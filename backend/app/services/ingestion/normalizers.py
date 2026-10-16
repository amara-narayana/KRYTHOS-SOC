import uuid
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from dateutil import parser as date_parser

def normalize_timestamp(ts_raw: Any) -> datetime:
    """Safely convert raw timestamp to UTC datetime."""
    if isinstance(ts_raw, datetime):
        if ts_raw.tzinfo is None:
            return ts_raw.replace(tzinfo=timezone.utc)
        return ts_raw.astimezone(timezone.utc)
    if isinstance(ts_raw, (int, float)):
        # Epoch timestamp (check if seconds or milliseconds)
        if ts_raw > 1e11:  # milliseconds
            ts_raw = ts_raw / 1000.0
        return datetime.fromtimestamp(ts_raw, tz=timezone.utc)
    if isinstance(ts_raw, str):
        try:
            parsed = date_parser.parse(ts_raw)
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except Exception:
            pass
    return datetime.now(timezone.utc)

def make_json_safe(obj: Any) -> Any:
    """Recursively convert datetime and non-JSON-serializable objects."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [make_json_safe(item) for item in obj]
    return obj

def normalize_event_dict(raw: Dict[str, Any], default_source: str = "generic") -> Dict[str, Any]:
    """Transform an arbitrary parsed log dictionary into KRYTHOS normalized structure."""
    event_id = str(raw.get("event_id") or raw.get("id") or uuid.uuid4())
    
    # Extract timestamp from common fields
    ts_field = raw.get("timestamp") or raw.get("@timestamp") or raw.get("time") or raw.get("date")
    timestamp = normalize_timestamp(ts_field)

    source_type = str(raw.get("source_type") or default_source)
    source_id = raw.get("source_id") or raw.get("sensor") or raw.get("agent_id")

    host = raw.get("host") or raw.get("hostname") or raw.get("computer_name") or raw.get("destination_host")
    username = raw.get("username") or raw.get("user") or raw.get("account") or raw.get("src_user") or raw.get("target_user")
    
    source_ip = raw.get("source_ip") or raw.get("src_ip") or raw.get("ip") or raw.get("client_ip")
    dest_ip = raw.get("destination_ip") or raw.get("dest_ip") or raw.get("dst_ip") or raw.get("server_ip")
    
    category = (raw.get("event_category") or raw.get("category") or "other").lower()
    action = str(raw.get("action") or raw.get("event") or raw.get("command") or raw.get("activity") or "log_event").lower()
    outcome = (raw.get("outcome") or raw.get("status") or raw.get("result") or "unknown").lower()
    
    if outcome in ["ok", "succeeded", "pass", "allowed"]:
        outcome = "success"
    elif outcome in ["err", "error", "denied", "blocked", "failed"]:
        outcome = "failure"

    severity = (raw.get("severity") or raw.get("level") or raw.get("priority") or "low").lower()
    if severity in ["info", "informational"]:
        severity = "informational"
    elif severity in ["warn", "warning", "med"]:
        severity = "medium"
    elif severity in ["crit", "fatal"]:
        severity = "critical"
    elif severity not in ["low", "medium", "high", "critical", "informational"]:
        severity = "low"

    process_name = raw.get("process_name") or raw.get("process") or raw.get("exe") or raw.get("program")

    # Serialize raw payload safely
    raw_payload_val = raw.get("raw_payload") or raw.get("raw_message")
    if raw_payload_val is None:
        try:
            raw_payload_str = json.dumps(make_json_safe(raw), default=str)
        except Exception:
            raw_payload_str = str(raw)
    elif isinstance(raw_payload_val, (dict, list)):
        try:
            raw_payload_str = json.dumps(make_json_safe(raw_payload_val), default=str)
        except Exception:
            raw_payload_str = str(raw_payload_val)
    else:
        raw_payload_str = str(raw_payload_val)

    return {
        "event_id": event_id,
        "timestamp": timestamp,
        "source_type": source_type,
        "source_id": str(source_id) if source_id else None,
        "host": str(host) if host else None,
        "username": str(username).lower() if username else None,
        "source_ip": str(source_ip) if source_ip else None,
        "destination_ip": str(dest_ip) if dest_ip else None,
        "event_category": category,
        "action": action,
        "outcome": outcome,
        "severity": severity,
        "process_name": str(process_name) if process_name else None,
        "raw_payload": raw_payload_str,
        "normalized_payload": make_json_safe(raw),
    }
