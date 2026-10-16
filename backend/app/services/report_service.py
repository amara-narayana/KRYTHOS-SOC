from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.models.case import IncidentCase
from backend.app.models.alert import Alert
from backend.app.models.event import SecurityEvent
from backend.app.models.rule import DetectionRule
from backend.app.core.exceptions import EntityNotFoundError

def generate_case_html_report(db: Session, case_id: str) -> str:
    """Generate human-readable, executive HTML incident report with evidence bindings."""
    case = db.query(IncidentCase).filter(IncidentCase.case_id == case_id).first()
    if not case:
        raise EntityNotFoundError("IncidentCase", case_id)

    # Gather evidence alerts
    evidence_items = case.evidence
    notes = case.notes

    notes_html = "".join([
        f"<div class='note'><span class='meta'>{n.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')} by <strong>{n.author_username}</strong></span><p>{n.content}</p></div>"
        for n in notes
    ]) or "<p><em>No analyst notes logged.</em></p>"

    evidence_html = "".join([
        f"<tr><td>{ev.evidence_type}</td><td><code>{ev.evidence_reference}</code></td><td>{ev.description or ''}</td><td>{ev.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}</td></tr>"
        for ev in evidence_items
    ]) or "<tr><td colspan='4'><em>No evidence attached.</em></td></tr>"

    checklist_html = ""
    if case.checklist:
        checklist_html = "".join([
            f"<li>{'[x]' if item.get('completed') else '[ ]'} {item.get('task')}</li>"
            for item in case.checklist
        ])

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>KRYTHOS SOC Incident Report - {case.case_id}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0b1120; color: #f1f5f9; padding: 40px; margin: 0; }}
  .container {{ max-width: 900px; margin: 0 auto; background: #1e293b; border-radius: 8px; border: 1px solid #334155; padding: 32px; }}
  .header {{ border-bottom: 2px solid #0ea5e9; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: baseline; }}
  h1 {{ margin: 0; font-size: 24px; color: #38bdf8; }}
  .badge {{ display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 12px; }}
  .badge-critical {{ background: #991b1b; color: #fecaca; }}
  .badge-high {{ background: #c2410c; color: #ffedd5; }}
  .badge-medium {{ background: #b45309; color: #fef3c7; }}
  .badge-low {{ background: #0369a1; color: #e0f2fe; }}
  .grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }}
  .card {{ background: #0f172a; padding: 16px; border-radius: 6px; border: 1px solid #334155; }}
  .card h3 {{ margin-top: 0; color: #94a3b8; font-size: 13px; text-transform: uppercase; }}
  .card p {{ margin: 4px 0 0; font-size: 16px; font-weight: 500; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 24px; font-size: 14px; }}
  th, td {{ border: 1px solid #334155; padding: 10px; text-align: left; }}
  th {{ background: #0f172a; color: #94a3b8; }}
  .note {{ background: #0f172a; padding: 12px; border-left: 3px solid #0ea5e9; margin-bottom: 12px; border-radius: 0 4px 4px 0; }}
  .meta {{ font-size: 12px; color: #64748b; }}
  .footer {{ margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #334155; padding-top: 16px; text-align: center; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div>
      <h1>KRYTHOS SOC — INCIDENT REPORT</h1>
      <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Case ID: <strong>{case.case_id}</strong> &bull; Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</div>
    </div>
    <div>
      <span class="badge badge-{case.severity.lower()}">{case.severity}</span>
    </div>
  </div>

  <h2>{case.title}</h2>
  <p style="color: #cbd5e1; line-height: 1.6;">{case.description}</p>

  <div class="grid">
    <div class="card"><h3>Status</h3><p>{case.status.upper()}</p></div>
    <div class="card"><h3>Priority</h3><p>{case.priority.upper()}</p></div>
    <div class="card"><h3>Assigned Analyst</h3><p>{case.assigned_to or 'Unassigned'}</p></div>
    <div class="card"><h3>Incident Created</h3><p>{case.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}</p></div>
  </div>

  <h3>Executive Findings</h3>
  <div class="card" style="margin-bottom: 24px; line-height: 1.6;">
    {case.findings or '<em>No findings documented yet.</em>'}
  </div>

  <h3>Resolution Summary</h3>
  <div class="card" style="margin-bottom: 24px; line-height: 1.6;">
    {case.resolution_summary or '<em>Investigation ongoing.</em>'}
  </div>

  <h3>Attached Evidence & Alerts</h3>
  <table>
    <thead>
      <tr><th>Type</th><th>Reference ID</th><th>Description</th><th>Timestamp</th></tr>
    </thead>
    <tbody>
      {evidence_html}
    </tbody>
  </table>

  <h3>Analyst Timeline & Notes</h3>
  {notes_html}

  <div class="footer">
    KRYTHOS Security Operations Platform &bull; Every Signal Connected. Every Threat Investigated. &bull; Local-First SIEM
  </div>
</div>
</body>
</html>"""
    return html
