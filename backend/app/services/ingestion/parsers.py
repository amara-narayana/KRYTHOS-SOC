import csv
import io
import json
import re
from datetime import datetime, timezone
from typing import Generator, Dict, Any, List, Optional
from dateutil import parser as date_parser

# Regex pattern for standard Linux SSH / sudo auth logs
# Example: Oct 16 04:12:33 host sshd[12345]: Failed password for invalid user admin from 192.168.1.100 port 44212 ssh2
LINUX_AUTH_RE = re.compile(
    r"^(?P<timestamp>[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+(?P<host>[\w\.\-]+)\s+(?P<process>[\w\.\-]+)(?:\[(?P<pid>\d+)\])?:\s+(?P<message>.+)$"
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
    """Parse a single Linux syslog / auth.log line."""
    line = line.strip()
    if not line:
        return None

    match = LINUX_AUTH_RE.match(line)
    if not match:
        # Fallback raw line
        return {
            "raw_message": line,
            "source_type": "linux_auth",
            "action": "unknown",
            "outcome": "unknown"
        }

    parts = match.groupdict()
    year = default_year or datetime.now(timezone.utc).year
    ts_str = f"{year} {parts['timestamp']}"
    try:
        ts = date_parser.parse(ts_str).replace(tzinfo=timezone.utc)
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

    if "Failed password" in msg:
        action = "ssh_login"
        outcome = "failure"
        user_match = re.search(r"for (?:invalid user )?(\w+)", msg)
        ip_match = re.search(r"from ([\d\.\:a-fA-F]+)", msg)
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
    elif "sudo:" in proc or "sudo" in msg:
        action = "sudo_command"
        category = "privilege_escalation"
        if "authentication failure" in msg:
            outcome = "failure"
        elif "COMMAND=" in msg:
            outcome = "success"
        user_match = re.search(r"sudo:\s+(\w+)\s*:", line) or re.search(r"user=(\w+)", msg)
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
