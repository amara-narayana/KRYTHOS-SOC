import os
import sys
import json
import shutil
from pathlib import Path
from typing import Optional
from datetime import datetime, timezone

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text

# Add workspace root to sys.path so backend imports work offline
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.config import settings
from backend.app.database import init_db, SessionLocal
from backend.app.models.user import User, UserRole
from backend.app.models.event import SecurityEvent, EventSource
from backend.app.models.rule import DetectionRule
from backend.app.models.alert import Alert, AlertStatus
from backend.app.models.case import IncidentCase, CaseStatus
from backend.app.models.ioc import ThreatIndicator
from backend.app.schemas.auth import BootstrapAdminRequest
from backend.app.schemas.case import CaseCreate
from backend.app.schemas.event import EventFilterParams
from backend.app.services.auth_service import bootstrap_initial_admin, is_system_bootstrapped
from backend.app.services.event_service import ingest_file_content, search_events
from backend.app.services.detection_service import (
    initialize_default_rules,
    evaluate_events_against_rules,
    validate_rule_definition
)
from backend.app.services.case_service import create_case, get_case
from backend.app.services.ioc_service import import_iocs, export_iocs_csv
from backend.app.services.report_service import generate_case_html_report

app = typer.Typer(
    name="krythos",
    help="KRYTHOS Security Operations Platform CLI — Every Signal Connected. Every Threat Investigated."
)
console = Console(legacy_windows=False, highlight=False)

# --- Helpers ---
def get_db_session():
    init_db()
    db = SessionLocal()
    initialize_default_rules(db)
    return db

# --- status & health ---
@app.command()
def status(as_json: bool = typer.Option(False, "--json", help="Output JSON")):
    """Display overall KRYTHOS platform status, database size, and counts."""
    db = get_db_session()
    try:
        events_cnt = db.query(SecurityEvent).count()
        alerts_cnt = db.query(Alert).count()
        cases_cnt = db.query(IncidentCase).count()
        rules_cnt = db.query(DetectionRule).filter(DetectionRule.enabled == True).count()
        bootstrapped = is_system_bootstrapped(db)
        db_file = settings.DATA_DIR / "krythos.db"
        db_size_mb = round((db_file.stat().st_size if db_file.exists() else 0) / (1024 * 1024), 2)

        data = {
            "app_name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "bootstrapped": bootstrapped,
            "database": str(db_file),
            "db_size_mb": db_size_mb,
            "events_count": events_cnt,
            "alerts_count": alerts_cnt,
            "cases_count": cases_cnt,
            "active_rules": rules_cnt
        }

        if as_json:
            console.print(json.dumps(data, indent=2))
        else:
            table = Table(title="[bold cyan]KRYTHOS SOC -- System Status[/bold cyan]")
            table.add_column("Property", style="bold white")
            table.add_column("Value", style="cyan")
            table.add_row("Version", settings.APP_VERSION)
            table.add_row("Bootstrapped", "[green]Yes[/green]" if bootstrapped else "[yellow]No (run 'krythos setup')[/yellow]")
            table.add_row("Database File", str(db_file))
            table.add_row("Database Size", f"{db_size_mb} MB")
            table.add_row("Total Ingested Events", str(events_cnt))
            table.add_row("Security Alerts", str(alerts_cnt))
            table.add_row("Investigation Cases", str(cases_cnt))
            table.add_row("Active Detection Rules", str(rules_cnt))
            console.print(table)
    finally:
        db.close()

@app.command()
def health():
    """Run diagnostics on local database and runtime directories."""
    db = get_db_session()
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    finally:
        db.close()

    console.print(Panel(
        f"[bold white]Platform Health Diagnostics[/bold white]\n"
        f"Database Status: {'[bold green]HEALTHY (Connected)[/bold green]' if db_ok else '[bold red]FAILED[/bold red]'}\n"
        f"Data Directory: [cyan]{settings.DATA_DIR}[/cyan] ({'Accessible' if settings.DATA_DIR.exists() else 'Missing'})\n"
        f"Reports Directory: [cyan]{settings.REPORTS_DIR}[/cyan]\n"
        f"Logs Directory: [cyan]{settings.LOGS_DIR}[/cyan]",
        title="[bold cyan]KRYTHOS Health[/bold cyan]",
        border_style="cyan"
    ))

# --- setup (First-Run Admin Bootstrap) ---
@app.command()
def setup(
    username: str = typer.Option(..., prompt=True, help="Administrator username"),
    email: str = typer.Option(..., prompt=True, help="Administrator email"),
    full_name: str = typer.Option(..., prompt=True, help="Full Name"),
    password: str = typer.Option(..., prompt=True, hide_input=True, confirmation_prompt=True, help="Password")
):
    """First-run administrator bootstrap workflow."""
    db = get_db_session()
    try:
        req = BootstrapAdminRequest(
            username=username,
            email=email,
            full_name=full_name,
            password=password,
            password_confirm=password
        )
        admin = bootstrap_initial_admin(db, req, ip_address="127.0.0.1")
        console.print(f"[bold green][+] Administrator '{admin.username}' created successfully![/bold green]")
        console.print("[dim]First-run bootstrap is now permanently disabled.[/dim]")
    except Exception as e:
        console.print(f"[bold red][-] Bootstrap failed: {str(e)}[/bold red]")
        sys.exit(1)
    finally:
        db.close()

# --- user ---
user_app = typer.Typer(help="User management commands")
app.add_typer(user_app, name="user")

@user_app.command("list")
def list_users(as_json: bool = typer.Option(False, "--json")):
    """List registered user accounts."""
    db = get_db_session()
    try:
        users = db.query(User).all()
        if as_json:
            data = [{"id": u.id, "username": u.username, "email": u.email, "role": u.role.value, "is_active": u.is_active} for u in users]
            console.print(json.dumps(data, indent=2))
        else:
            table = Table(title="[bold cyan]Registered Users[/bold cyan]")
            table.add_column("ID", style="dim")
            table.add_column("Username", style="bold white")
            table.add_column("Email", style="cyan")
            table.add_column("Role", style="magenta")
            table.add_column("Status", style="green")
            for u in users:
                status_str = "[green]Active[/green]" if u.is_active else "[red]Disabled[/red]"
                table.add_row(str(u.id), u.username, u.email, u.role.value, status_str)
            console.print(table)
    finally:
        db.close()

# --- ingest ---
@app.command()
def ingest(
    file_path: str = typer.Argument(..., help="Path to log file (JSON, JSONL, CSV, or Linux auth.log)"),
    source_type: Optional[str] = typer.Option(None, "--source", help="Optional source type override")
):
    """Ingest a log file into KRYTHOS SOC."""
    path = Path(file_path)
    if not path.exists():
        console.print(f"[bold red]File not found: {file_path}[/bold red]")
        sys.exit(1)

    db = get_db_session()
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
        count, detected_source = ingest_file_content(db, filename=path.name, content=content, source_type_override=source_type)
        console.print(f"[bold green][+] Ingested {count} events[/bold green] (Source: [cyan]{detected_source}[/cyan])")
    except Exception as e:
        console.print(f"[bold red][-] Ingestion error: {str(e)}[/bold red]")
        sys.exit(1)
    finally:
        db.close()

# --- events ---
events_app = typer.Typer(help="Event search and viewing commands")
app.add_typer(events_app, name="events")

@events_app.command("search")
def search_events_cmd(
    query: Optional[str] = typer.Option(None, "--query", "-q", help="Free text search query"),
    source: Optional[str] = typer.Option(None, "--source", "-s", help="Filter by source type"),
    category: Optional[str] = typer.Option(None, "--category", "-c", help="Filter by category"),
    limit: int = typer.Option(20, "--limit", "-l", help="Number of records to show"),
    as_json: bool = typer.Option(False, "--json")
):
    """Search ingested security events."""
    db = get_db_session()
    try:
        params = EventFilterParams(query=query, source_type=source, event_category=category, page_size=limit)
        items, total = search_events(db, params)
        if as_json:
            data = [
                {
                    "event_id": e.event_id,
                    "timestamp": e.timestamp.isoformat(),
                    "host": e.host,
                    "username": e.username,
                    "source_ip": e.source_ip,
                    "action": e.action,
                    "outcome": e.outcome,
                    "severity": e.severity
                }
                for e in items
            ]
            console.print(json.dumps(data, indent=2))
        else:
            table = Table(title=f"[bold cyan]Security Events ({total} total matches)[/bold cyan]")
            table.add_column("Timestamp (UTC)", style="dim")
            table.add_column("Host", style="bold white")
            table.add_column("User", style="cyan")
            table.add_column("Source IP", style="yellow")
            table.add_column("Action", style="magenta")
            table.add_column("Outcome")
            table.add_column("Severity")

            for e in items:
                outcome_style = "[green]success[/green]" if e.outcome == "success" else "[red]failure[/red]" if e.outcome == "failure" else e.outcome
                table.add_row(
                    e.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    e.host or "-",
                    e.username or "-",
                    e.source_ip or "-",
                    e.action,
                    outcome_style,
                    e.severity
                )
            console.print(table)
    finally:
        db.close()

@events_app.command("show")
def show_event(event_id: str):
    """Display full normalized and raw details of a single event."""
    db = get_db_session()
    try:
        event = db.query(SecurityEvent).filter(SecurityEvent.event_id == event_id).first()
        if not event:
            console.print(f"[bold red]Event '{event_id}' not found.[/bold red]")
            sys.exit(1)

        console.print(Panel(
            f"[bold white]Event ID:[/bold white] {event.event_id}\n"
            f"[bold white]Timestamp:[/bold white] {event.timestamp.isoformat()}\n"
            f"[bold white]Host:[/bold white] {event.host}\n"
            f"[bold white]Username:[/bold white] {event.username}\n"
            f"[bold white]Source IP:[/bold white] {event.source_ip}\n"
            f"[bold white]Action:[/bold white] {event.action}\n"
            f"[bold white]Outcome:[/bold white] {event.outcome}\n"
            f"[bold white]Severity:[/bold white] {event.severity}\n\n"
            f"[bold cyan]Raw Payload:[/bold cyan]\n{event.raw_payload}",
            title=f"[bold cyan]Security Event Details[/bold cyan]",
            border_style="cyan"
        ))
    finally:
        db.close()

# --- rules ---
rules_app = typer.Typer(help="Detection rules commands")
app.add_typer(rules_app, name="rules")

@rules_app.command("list")
def list_rules(as_json: bool = typer.Option(False, "--json")):
    """List detection rules and ATT&CK mappings."""
    db = get_db_session()
    try:
        rules = db.query(DetectionRule).all()
        if as_json:
            data = [{"rule_id": r.rule_id, "name": r.name, "severity": r.severity, "attack_id": r.mitre_attack_id, "enabled": r.enabled} for r in rules]
            console.print(json.dumps(data, indent=2))
        else:
            table = Table(title="[bold cyan]Detection Rules[/bold cyan]")
            table.add_column("Rule ID", style="bold white")
            table.add_column("Name", style="cyan")
            table.add_column("Severity")
            table.add_column("Type", style="dim")
            table.add_column("ATT&CK ID", style="yellow")
            table.add_column("Status")

            for r in rules:
                status_str = "[green]Enabled[/green]" if r.enabled else "[red]Disabled[/red]"
                table.add_row(r.rule_id, r.name, r.severity, r.rule_type, r.mitre_attack_id or "-", status_str)
            console.print(table)
    finally:
        db.close()

@rules_app.command("validate")
def validate_rule_cmd(file_path: Optional[str] = typer.Argument(None, help="Path to rule JSON or YAML (validates all registered rules if omitted)")):
    """Validate syntax of a detection rule definition file or all active database rules."""
    db = get_db_session()
    try:
        if file_path:
            path = Path(file_path)
            if not path.exists():
                console.print(f"[bold red]File not found: {file_path}[/bold red]")
                sys.exit(1)
            try:
                content = json.loads(path.read_text(encoding="utf-8"))
                res = validate_rule_definition(content.get("logic_definition", {}), content.get("rule_type", "threshold"))
                if res.is_valid:
                    console.print("[bold green][+] Rule definition is valid.[/bold green]")
                else:
                    console.print(f"[bold red][-] Rule validation failed: {', '.join(res.errors)}[/bold red]")
                    sys.exit(1)
            except Exception as e:
                console.print(f"[bold red][-] Parse error: {str(e)}[/bold red]")
                sys.exit(1)
        else:
            rules = db.query(DetectionRule).all()
            all_valid = True
            for r in rules:
                res = validate_rule_definition(r.logic_definition or {}, r.rule_type)
                status_icon = "[bold green][+][/bold green]" if res.is_valid else "[bold red][-][/bold red]"
                console.print(f"{status_icon} Rule {r.rule_id} ({r.name}): {'VALID' if res.is_valid else 'INVALID'}")
                if not res.is_valid:
                    all_valid = False
            if all_valid:
                console.print(f"[bold green][+] All {len(rules)} registered rules validated successfully.[/bold green]")
            else:
                sys.exit(1)
    finally:
        db.close()

# --- detect ---
detect_app = typer.Typer(help="Detection evaluation commands")
app.add_typer(detect_app, name="detect")

@detect_app.command("run")
def run_detections(limit: int = typer.Option(1000, "--limit", "-l")):
    """Run deterministic detection engine against recent events."""
    db = get_db_session()
    try:
        events = db.query(SecurityEvent).order_by(SecurityEvent.timestamp.desc()).limit(limit).all()
        alerts = evaluate_events_against_rules(db, events)
        console.print(f"[bold green][+] Detection engine evaluated {len(events)} events[/bold green]")
        console.print(f"[bold cyan]Generated alerts:[/bold cyan] {len(alerts)}")
        for a in alerts:
            console.print(f"  * [bold yellow]{a.alert_id}[/bold yellow] - {a.title} ({a.severity})")
    finally:
        db.close()

# --- alerts ---
alerts_app = typer.Typer(help="Security alert triage commands")
app.add_typer(alerts_app, name="alerts")

@alerts_app.command("list")
def list_alerts(
    severity: Optional[str] = typer.Option(None, "--severity", "-s"),
    status: Optional[str] = typer.Option(None, "--status"),
    as_json: bool = typer.Option(False, "--json")
):
    """List generated security alerts."""
    db = get_db_session()
    try:
        query = db.query(Alert)
        if severity:
            query = query.filter(Alert.severity == severity.lower())
        if status:
            query = query.filter(Alert.status == status.lower())
        alerts = query.order_by(Alert.created_at.desc()).limit(50).all()

        if as_json:
            data = [{"alert_id": a.alert_id, "title": a.title, "severity": a.severity, "status": a.status, "rule_id": a.rule_id} for a in alerts]
            console.print(json.dumps(data, indent=2))
        else:
            table = Table(title="[bold cyan]Security Alerts Queue[/bold cyan]")
            table.add_column("Alert ID", style="bold white")
            table.add_column("Title", style="cyan")
            table.add_column("Severity")
            table.add_column("Status")
            table.add_column("Rule ID", style="dim")
            table.add_column("Created", style="dim")

            for a in alerts:
                sev_color = "[bold red]" if a.severity in ["high", "critical"] else "[yellow]"
                table.add_row(
                    a.alert_id,
                    a.title,
                    f"{sev_color}{a.severity}[/]",
                    a.status,
                    a.rule_id,
                    a.created_at.strftime("%Y-%m-%d %H:%M:%S")
                )
            console.print(table)
    finally:
        db.close()

@alerts_app.command("show")
def show_alert(alert_id: str):
    """Show details and deterministic explanation for an alert."""
    db = get_db_session()
    try:
        a = db.query(Alert).filter(Alert.alert_id == alert_id).first()
        if not a:
            console.print(f"[bold red]Alert '{alert_id}' not found.[/bold red]")
            sys.exit(1)

        console.print(Panel(
            f"[bold white]Title:[/bold white] {a.title}\n"
            f"[bold white]Rule:[/bold white] {a.rule_name} ([dim]{a.rule_id}[/dim])\n"
            f"[bold white]Severity:[/bold white] {a.severity} -- [bold white]Confidence:[/bold white] {a.confidence}%\n"
            f"[bold white]Status:[/bold white] {a.status} -- [bold white]Case:[/bold white] {a.case_id or 'Unlinked'}\n\n"
            f"[bold cyan]Explanation:[/bold cyan]\n{a.explanation}\n\n"
            f"[bold cyan]Entities:[/bold cyan] {json.dumps(a.entities or {})}\n"
            f"[bold cyan]Supporting Event IDs:[/bold cyan] {len(a.supporting_event_ids)} events cited",
            title=f"[bold cyan]Alert: {a.alert_id}[/bold cyan]",
            border_style="cyan"
        ))
    finally:
        db.close()

# --- cases ---
cases_app = typer.Typer(help="Incident case management commands")
app.add_typer(cases_app, name="cases")

@cases_app.command("list")
def list_cases(as_json: bool = typer.Option(False, "--json")):
    """List incident cases."""
    db = get_db_session()
    try:
        cases = db.query(IncidentCase).order_by(IncidentCase.created_at.desc()).all()
        if as_json:
            data = [{"case_id": c.case_id, "title": c.title, "severity": c.severity, "status": c.status, "priority": c.priority} for c in cases]
            console.print(json.dumps(data, indent=2))
        else:
            table = Table(title="[bold cyan]Investigation Cases[/bold cyan]")
            table.add_column("Case ID", style="bold white")
            table.add_column("Title", style="cyan")
            table.add_column("Severity")
            table.add_column("Priority")
            table.add_column("Status")
            table.add_column("Assigned To")

            for c in cases:
                table.add_row(c.case_id, c.title, c.severity, c.priority, c.status, c.assigned_to or "Unassigned")
            console.print(table)
    finally:
        db.close()

@cases_app.command("create")
def create_case_cmd(
    title: str = typer.Option(..., prompt=True),
    description: str = typer.Option(..., prompt=True),
    severity: str = typer.Option("medium", "--severity", "-s"),
    priority: str = typer.Option("medium", "--priority", "-p")
):
    """Create a new incident case."""
    db = get_db_session()
    try:
        case_in = CaseCreate(title=title, description=description, severity=severity, priority=priority)
        case = create_case(db, case_in, author_username="cli_analyst")
        console.print(f"[bold green][+] Case '{case.case_id}' created successfully![/bold green]")
    finally:
        db.close()

@cases_app.command("show")
def show_case(case_id: str):
    """Display incident case details, checklist, and notes."""
    db = get_db_session()
    try:
        c = get_case(db, case_id)
        notes_text = "\n".join([f"  [{n.created_at.strftime('%Y-%m-%d %H:%M')}] {n.author_username}: {n.content}" for n in c.notes]) or "  None"
        ev_text = "\n".join([f"  * {e.evidence_type}: {e.evidence_reference}" for e in c.evidence]) or "  None"

        console.print(Panel(
            f"[bold white]Title:[/bold white] {c.title}\n"
            f"[bold white]Severity:[/bold white] {c.severity} -- [bold white]Priority:[/bold white] {c.priority} -- [bold white]Status:[/bold white] {c.status}\n"
            f"[bold white]Assigned Analyst:[/bold white] {c.assigned_to or 'Unassigned'}\n\n"
            f"[bold cyan]Description:[/bold cyan]\n{c.description}\n\n"
            f"[bold cyan]Findings:[/bold cyan] {c.findings or 'Ongoing'}\n"
            f"[bold cyan]Resolution:[/bold cyan] {c.resolution_summary or 'Unresolved'}\n\n"
            f"[bold cyan]Evidence Attached:[/bold cyan]\n{ev_text}\n\n"
            f"[bold cyan]Notes Timeline:[/bold cyan]\n{notes_text}",
            title=f"[bold cyan]Incident Case: {c.case_id}[/bold cyan]",
            border_style="cyan"
        ))
    finally:
        db.close()

# --- ioc ---
ioc_app = typer.Typer(help="Threat Intelligence indicator commands")
app.add_typer(ioc_app, name="ioc")

@ioc_app.command("import")
def import_ioc_cmd(file_path: str = typer.Argument(...)):
    """Import Threat Indicators (IOCs) from a CSV or JSON file."""
    path = Path(file_path)
    if not path.exists():
        console.print(f"[bold red]File not found: {file_path}[/bold red]")
        sys.exit(1)
    db = get_db_session()
    try:
        content = path.read_text(encoding="utf-8")
        added = import_iocs(db, content, provenance=f"cli_{path.name}")
        console.print(f"[bold green][+] Imported {added} threat indicators.[/bold green]")
    finally:
        db.close()

# --- report ---
report_app = typer.Typer(help="Report generation commands")
app.add_typer(report_app, name="report")

@report_app.command("export")
def export_report_cmd(case_id: str = typer.Argument(...), output: Optional[str] = typer.Option(None, "--output", "-o")):
    """Export an evidence-backed HTML incident report for a case."""
    db = get_db_session()
    try:
        html = generate_case_html_report(db, case_id)
        out_path = Path(output) if output else settings.REPORTS_DIR / f"{case_id}_report.html"
        out_path.write_text(html, encoding="utf-8")
        console.print(f"[bold green][+] Incident report generated:[/bold green] [cyan]{out_path}[/cyan]")
    except Exception as e:
        console.print(f"[bold red][-] Report generation failed: {str(e)}[/bold red]")
        sys.exit(1)
    finally:
        db.close()

# --- db ---
db_app = typer.Typer(help="Database administration and backup commands")
app.add_typer(db_app, name="db")

@db_app.command("backup")
def backup_database(destination: Optional[str] = typer.Option(None, "--dest", "-d")):
    """Create a safe snapshot backup of the KRYTHOS SQLite database."""
    db_file = settings.DATA_DIR / "krythos.db"
    if not db_file.exists():
        console.print("[bold red]Database file does not exist yet.[/bold red]")
        sys.exit(1)

    now_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    dest_path = Path(destination) if destination else settings.BACKUPS_DIR / f"krythos_backup_{now_str}.db"

    # SQLite VACUUM INTO or copy
    shutil.copy2(db_file, dest_path)
    console.print(f"[bold green][+] Database backed up successfully to:[/bold green] [cyan]{dest_path}[/cyan]")

@db_app.command("check")
def check_database_integrity():
    """Verify SQLite database file integrity."""
    db = get_db_session()
    try:
        from sqlalchemy import text
        res = db.execute(text("PRAGMA integrity_check")).fetchone()
        status_text = res[0] if res else "unknown"
        if status_text == "ok":
            console.print("[bold green][+] Database integrity check passed: OK[/bold green]")
        else:
            console.print(f"[bold red][-] Integrity check warning: {status_text}[/bold red]")
    finally:
        db.close()

if __name__ == "__main__":
    app()
