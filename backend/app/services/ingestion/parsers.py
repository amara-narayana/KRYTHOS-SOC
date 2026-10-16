import csv
import io
import json
import re
from datetime import datetime, timezone
from typing import Generator, Dict, Any, List, Optional
from dateutil import parser as date_parser

# Regex pattern supporting both standard syslog ("Oct 16 04:12:33") and ISO timestamps ("2026-10-16T04:12:33+0000" / "2026-10-16 04:12:33")
LINUX_AUTH_RE = re.compile(
    r"^(?P<timestamp>(?:[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})|(?:\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:[\+\-]\d{2}:?\d{2}|Z)?))\s+(?P<host>[\w\.\-]+)\s+(?P<process>[\w\.\-]+)(?:\[(?P<pid>\d+)\])?:\s*(?P<message>.+)$"
)

def parse_json(content: str) -> List[Dict[str, Any]]:
    """Parse JSON string which can be a single dict or a list of dicts."""
    data = json.loads(content)
    if isinstance(data, dict):
        return [data]
    elif isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []

def parse_jsonl(lines: List[str]) -> Generator[Dict[str, Any], None, None]:
    """Parse JSON Lines stream."""
    for line_idx, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        try:
            parsed = json.loads(line)
            if isinstance(parsed, dict):
                yield parsed
        except Exception:
            # Skip malformed line without crashing entire ingestion
            continue

def parse_csv(content: str) -> List[Dict[str, Any]]:
    """Parse CSV text into list of dicts."""
    reader = csv.DictReader(io.StringIO(content))
    return [row for row in reader]

def parse_linux_auth_line(line: str, default_year: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """Parse a single Linux syslog, auth.log, or journalctl line."""
    line = line.strip()
    if not line:
        return None

    match = LINUX_AUTH_RE.match(line)
    if not match:
        # Fallback parsing for non-standard lines
        now = datetime.now(timezone.utc)
        outcome = "unknown"
        action = "system_event"
        category = "system"
        if "sudo" in line.lower():
            category = "privilege_escalation"
            action = "sudo_command"
            outcome = "failure" if "fail" in line.lower() else "success"
        elif "ssh" in line.lower():
            category = "authentication"
            action = "ssh_login"
            outcome = "failure" if "fail" in line.lower() else "success"

        return {
            "timestamp": now,
            "host": "localhost",
            "process_name": "journald",
            "username": "unknown",
            "source_ip": None,
            "action": action,
            "outcome": outcome,
            "event_category": category,
            "raw_message": line
        }

    parts = match.groupdict()
    ts_str = parts["timestamp"]
    try:
        if ts_str[0].isalpha():
            year = default_year or datetime.now(timezone.utc).year
            ts_str = f"{year} {ts_str}"
        ts = date_parser.parse(ts_str)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
    except Exception:
        ts = datetime.now(timezone.utc)

    msg = parts["message"]
    proc = parts["process"]
    host = parts["host"]

    # Extract user, ip, outcome from SSH / auth message
    username = None
    source_ip = None
    outcome = "unknown"
    action = "system_event"
    category = "authentication"

    if "Failed password" in msg or "authentication failure" in msg:
        action = "ssh_login" if "sshd" in proc else "auth_login"
        outcome = "failure"
        user_match = re.search(r"for (?:invalid user )?(\w+)", msg) or re.search(r"user=(\w+)", msg)
        ip_match = re.search(r"from ([\d\.\:a-fA-F]+)", msg) or re.search(r"rhost=([\d\.\:a-fA-F]+)", msg)
        if user_match:
            username = user_match.group(1)
        if ip_match:
            source_ip = ip_match.group(1)

    elif "Accepted password" in msg or "Accepted publickey" in msg:
        action = "ssh_login"
        outcome = "success"
        user_match = re.search(r"for (\w+)", msg)
        ip_match = re.search(r"from ([\d\.\:a-fA-F]+)", msg)
        if user_match:
            username = user_match.group(1)
        if ip_match:
            source_ip = ip_match.group(1)

    elif "Invalid user" in msg or "invalid user" in msg:
        action = "ssh_login"
        outcome = "failure"
        user_match = re.search(r"invalid user (\w+)", msg, re.IGNORECASE)
        ip_match = re.search(r"from ([\d\.\:a-fA-F]+)", msg)
        if user_match:
            username = user_match.group(1)
        if ip_match:
            source_ip = ip_match.group(1)

    elif "sudo:" in proc or "sudo" in msg.lower() or proc == "sudo":
        action = "sudo_command"
        category = "privilege_escalation"
        if "authentication failure" in msg or "incorrect password" in msg:
            outcome = "failure"
        elif "COMMAND=" in msg:
            outcome = "success"
        else:
            outcome = "success"

        user_match = re.search(r"sudo:\s+(\w+)\s*:", line) or re.search(r"(\w+)\s*:\s*TTY=", line) or re.search(r"user=(\w+)", msg)
        if user_match:
            username = user_match.group(1)

    elif "su:" in proc or proc == "su":
        action = "su_escalation"
        category = "privilege_escalation"
        outcome = "failure" if "FAILED SU" in msg or "authentication failure" in msg else "success"
        user_match = re.search(r"by (\w+)", msg) or re.search(r"for (\w+)", msg)
        if user_match:
            username = user_match.group(1)

    elif "session opened for user" in msg:
        action = "session_opened"
        outcome = "success"
        user_match = re.search(r"session opened for user (\w+)", msg)
        if user_match:
            username = user_match.group(1)

    return {
        "timestamp": ts,
        "host": host,
        "process_name": proc,
        "username": username,
        "source_ip": source_ip,
        "action": action,
        "outcome": outcome,
        "event_category": category,
        "raw_message": line
    }
