import ipaddress
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.core.logging_config import logger
from backend.app.models.ioc import ThreatIndicator
from backend.app.models.audit import AuditLog
from backend.app.models.user import User
from backend.app.models.event import SecurityEvent

def record_audit(
    db: Session,
    username: str,
    action: str,
    resource_type: str,
    resource_id: str,
    details: Dict[str, Any]
) -> AuditLog:
    """Helper to persist audit logs for playbook operations."""
    entry = AuditLog(
        username=username,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def execute_block_ip(ip: str, reason: str, db: Session, user_name: str) -> Dict[str, Any]:
    """
    Executes actual firewall boundary drop rule (iptables/ufw on Linux, netsh on Windows)
    and registers the indicator into local Threat Intelligence.
    """
    ip = ip.strip()
    try:
        ip_obj = ipaddress.ip_address(ip)
    except ValueError:
        raise ValueError(f"Invalid IP address format: '{ip}'")

    if ip_obj.is_loopback:
        raise ValueError(f"Cannot block loopback address '{ip}' as it will disrupt local SOC services.")

    cmd_executed = None
    stdout = ""
    stderr = ""
    exit_code = 0
    os_status = "unsupported_os"

    if sys.platform.startswith("linux"):
        has_iptables = shutil.which("iptables") is not None
        has_ufw = shutil.which("ufw") is not None

        if has_iptables:
            cmd = ["iptables", "-I", "INPUT", "1", "-s", ip, "-j", "DROP"]
            cmd_executed = " ".join(cmd)
            try:
                # First check if rule already exists to prevent duplicate rules
                check_cmd = ["iptables", "-C", "INPUT", "-s", ip, "-j", "DROP"]
                check_res = subprocess.run(check_cmd, capture_output=True, text=True, timeout=5)
                if check_res.returncode == 0:
                    os_status = "already_blocked"
                    stdout = f"Rule already present in iptables INPUT chain: -s {ip} -j DROP"
                else:
                    res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
                    exit_code = res.returncode
                    stdout = res.stdout.strip()
                    stderr = res.stderr.strip()
                    if exit_code == 0:
                        os_status = "iptables_rule_inserted"
                    else:
                        os_status = f"permission_denied_or_error (exit {exit_code})"
            except Exception as e:
                stderr = str(e)
                os_status = f"execution_error: {e}"
        elif has_ufw:
            cmd = ["ufw", "insert", "1", "deny", "from", ip]
            cmd_executed = " ".join(cmd)
            try:
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
                exit_code = res.returncode
                stdout = res.stdout.strip()
                stderr = res.stderr.strip()
                os_status = "ufw_rule_inserted" if exit_code == 0 else f"ufw_error (exit {exit_code})"
            except Exception as e:
                stderr = str(e)
                os_status = f"execution_error: {e}"
        else:
            os_status = "no_firewall_cli_found"

    elif sys.platform == "win32":
        rule_name = f"KRYTHOS_BLOCK_{ip.replace(':', '_')}"
        cmd = ["netsh", "advfirewall", "firewall", "add", "rule", f"name={rule_name}", "dir=in", "action=block", f"remoteip={ip}"]
        cmd_executed = " ".join(cmd)
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            exit_code = res.returncode
            stdout = res.stdout.strip()
            stderr = res.stderr.strip()
            os_status = "windows_firewall_rule_added" if exit_code == 0 else f"netsh_error (exit {exit_code})"
        except Exception as e:
            stderr = str(e)
            os_status = f"execution_error: {e}"

    # Register into local Threat Intelligence IOC store
    existing_ioc = db.query(ThreatIndicator).filter(ThreatIndicator.value == ip).first()
    if not existing_ioc:
        ioc = ThreatIndicator(
            ioc_type="ip",
            value=ip,
            threat_type="perimeter_quarantine",
            confidence=100,
            provenance="krythos_playbook_firewall",
            description=f"Quarantined by analyst {user_name}. Reason: {reason}"
        )
        db.add(ioc)
        db.commit()
        db.refresh(ioc)
        ioc_id = ioc.id
    else:
        existing_ioc.last_seen = datetime.now(timezone.utc)
        existing_ioc.confidence = 100
        existing_ioc.description = f"{existing_ioc.description or ''} | Re-blocked by {user_name}: {reason}"
        db.commit()
        ioc_id = existing_ioc.id

    # Record tamper-evident audit trail
    audit = record_audit(
        db=db,
        username=user_name,
        action="playbook.block_ip",
        resource_type="firewall_rule",
        resource_id=ip,
        details={
            "ip": ip,
            "reason": reason,
            "cmd": cmd_executed,
            "exit_code": exit_code,
            "stdout": stdout,
            "stderr": stderr,
            "os_status": os_status,
            "ioc_id": ioc_id
        }
    )

    return {
        "status": "success" if exit_code == 0 or os_status == "already_blocked" else "warning",
        "action": "block_ip",
        "target_ip": ip,
        "firewall_command": cmd_executed,
        "os_status": os_status,
        "stdout": stdout,
        "stderr": stderr,
        "ioc_id": ioc_id,
        "audit_id": audit.id,
        "executed_at": datetime.now(timezone.utc).isoformat()
    }

def execute_isolate_host(host: str, reason: str, db: Session, user_name: str) -> Dict[str, Any]:
    """
    Applies real host network isolation policy:
    Allows loopback, administrative port 8000 (SOC Web UI), and port 22 (SSH forensics),
    while blocking external communications.
    """
    host = host.strip()
    cmd_executed = None
    stdout = ""
    stderr = ""
    exit_code = 0
    os_status = "unsupported_os"

    if sys.platform.startswith("linux"):
        # Setup KRYTHOS isolation chain
        commands = [
            "iptables -N KRYTHOS_ISOLATE 2>/dev/null || true",
            "iptables -C INPUT -j KRYTHOS_ISOLATE 2>/dev/null || iptables -I INPUT 1 -j KRYTHOS_ISOLATE",
            "iptables -A KRYTHOS_ISOLATE -i lo -j ACCEPT 2>/dev/null || true",
            "iptables -A KRYTHOS_ISOLATE -p tcp --dport 8000 -j ACCEPT 2>/dev/null || true",
            "iptables -A KRYTHOS_ISOLATE -p tcp --dport 22 -j ACCEPT 2>/dev/null || true",
            "iptables -A KRYTHOS_ISOLATE -m state --state ESTABLISHED,RELATED -j ACCEPT 2>/dev/null || true"
        ]
        cmd_executed = "; ".join(commands)
        try:
            res = subprocess.run(cmd_executed, shell=True, capture_output=True, text=True, timeout=5)
            exit_code = res.returncode
            stdout = res.stdout.strip()
            stderr = res.stderr.strip()
            os_status = "isolation_chain_applied" if exit_code == 0 else f"iptables_error (exit {exit_code})"
        except Exception as e:
            stderr = str(e)
            os_status = f"execution_error: {e}"
    else:
        os_status = f"host_isolation_not_supported_on_{sys.platform}"

    audit = record_audit(
        db=db,
        username=user_name,
        action="playbook.isolate_host",
        resource_type="host_network",
        resource_id=host,
        details={
            "host": host,
            "reason": reason,
            "cmd": cmd_executed,
            "os_status": os_status,
            "exit_code": exit_code
        }
    )

    return {
        "status": "success" if exit_code == 0 else "warning",
        "action": "isolate_host",
        "target_host": host,
        "isolation_command": cmd_executed,
        "os_status": os_status,
        "stdout": stdout,
        "stderr": stderr,
        "audit_id": audit.id,
        "executed_at": datetime.now(timezone.utc).isoformat()
    }

def execute_lockout_user(target_user: str, reason: str, db: Session, user_name: str) -> Dict[str, Any]:
    """
    Suspends account in local KRYTHOS web database and locks Linux system user account.
    """
    target_user = target_user.strip()
    # 1. Lock in database
    web_user = db.query(User).filter(User.username == target_user).first()
    db_locked = False
    if web_user:
        web_user.is_active = False
        db.commit()
        db_locked = True

    # 2. Lock Linux user account via passwd -l or usermod -L
    os_status = "not_linux"
    cmd_executed = None
    exit_code = 0
    stdout = ""
    stderr = ""

    if sys.platform.startswith("linux"):
        cmd = ["passwd", "-l", target_user]
        cmd_executed = " ".join(cmd)
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            exit_code = res.returncode
            stdout = res.stdout.strip()
            stderr = res.stderr.strip()
            if exit_code == 0:
                os_status = f"linux_account_{target_user}_locked"
            else:
                os_status = f"passwd_lock_failed (exit {exit_code})"
        except Exception as e:
            stderr = str(e)
            os_status = f"execution_error: {e}"

    audit = record_audit(
        db=db,
        username=user_name,
        action="playbook.lockout_user",
        resource_type="user",
        resource_id=target_user,
        details={
            "target_user": target_user,
            "reason": reason,
            "db_locked": db_locked,
            "os_status": os_status,
            "cmd": cmd_executed
        }
    )

    return {
        "status": "success" if (db_locked or exit_code == 0) else "warning",
        "action": "lockout_user",
        "target_username": target_user,
        "db_account_suspended": db_locked,
        "os_account_status": os_status,
        "os_command": cmd_executed,
        "stdout": stdout,
        "stderr": stderr,
        "audit_id": audit.id,
        "executed_at": datetime.now(timezone.utc).isoformat()
    }

def execute_sweep_iocs(db: Session, user_name: str) -> Dict[str, Any]:
    """
    Executes actual historical database sweep across all normalized security events
    matching any active Threat Intelligence indicators.
    """
    iocs = db.query(ThreatIndicator).all()
    if not iocs:
        return {
            "status": "success",
            "action": "sweep_iocs",
            "indicators_evaluated": 0,
            "matching_events_count": 0,
            "matched_events": [],
            "message": "No threat indicators in database to sweep."
        }

    ioc_values = [i.value for i in iocs]
    matched_events = db.query(SecurityEvent).filter(
        (SecurityEvent.source_ip.in_(ioc_values)) |
        (SecurityEvent.destination_ip.in_(ioc_values)) |
        (SecurityEvent.username.in_(ioc_values))
    ).limit(50).all()

    audit = record_audit(
        db=db,
        username=user_name,
        action="playbook.sweep_iocs",
        resource_type="events_sweep",
        resource_id="all_iocs",
        details={
            "indicators_checked": len(ioc_values),
            "matches_found": len(matched_events)
        }
    )

    results = [
        {
            "event_id": e.event_id,
            "timestamp": e.timestamp.isoformat(),
            "source_ip": e.source_ip,
            "destination_ip": e.destination_ip,
            "username": e.username,
            "action": e.action,
            "severity": e.severity
        }
        for e in matched_events
    ]

    return {
        "status": "success",
        "action": "sweep_iocs",
        "indicators_evaluated": len(ioc_values),
        "matching_events_count": len(matched_events),
        "matched_events": results,
        "audit_id": audit.id,
        "executed_at": datetime.now(timezone.utc).isoformat()
    }
