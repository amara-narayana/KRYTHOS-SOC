import io
import csv
import json
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc

from backend.app.models.event import SecurityEvent, EventSource
from backend.app.schemas.event import EventFilterParams, EventCreate
from backend.app.services.ingestion.parsers import (
    parse_json,
    parse_jsonl,
    parse_csv,
    parse_linux_auth_line
)
from backend.app.services.ingestion.normalizers import normalize_event_dict

def get_or_create_source(db: Session, source_type: str, name: Optional[str] = None) -> EventSource:
    """Find or create an EventSource tracking record."""
    source = db.query(EventSource).filter(EventSource.source_type == source_type).first()
    if not source:
        source = EventSource(
            source_type=source_type,
            name=name or f"Source: {source_type.title()}",
            status="active",
            events_count=0
        )
        db.add(source)
        db.commit()
        db.refresh(source)
    return source

def ingest_events_batch(
    db: Session,
    raw_records: List[Dict[str, Any]],
    source_type: str = "generic",
    trigger_detections: bool = True
) -> Tuple[int, List[SecurityEvent]]:
    """
    Ingest, normalize, deduplicate, and persist a batch of raw log records.
    Returns (persisted_count, list_of_persisted_events).
    """
    if not raw_records:
        return 0, []

    source = get_or_create_source(db, source_type)
    persisted_events = []
    
    # Check existing event_ids in current batch to prevent duplicates
    for record in raw_records:
        norm = normalize_event_dict(record, default_source=source_type)
        
        # Check idempotency / deduplication
        existing = db.query(SecurityEvent.id).filter(SecurityEvent.event_id == norm["event_id"]).first()
        if existing:
            continue

        sec_event = SecurityEvent(
            event_id=norm["event_id"],
            timestamp=norm["timestamp"],
            source_type=norm["source_type"],
            source_id=norm["source_id"],
            host=norm["host"],
            username=norm["username"],
            source_ip=norm["source_ip"],
            destination_ip=norm["destination_ip"],
            event_category=norm["event_category"],
            action=norm["action"],
            outcome=norm["outcome"],
            severity=norm["severity"],
            process_name=norm["process_name"],
            raw_payload=norm["raw_payload"],
            normalized_payload=norm["normalized_payload"],
            ingested_at=datetime.now(timezone.utc)
        )
        db.add(sec_event)
        persisted_events.append(sec_event)

    db.commit()

    # Update source statistics
    if persisted_events:
        source.events_count += len(persisted_events)
        source.last_event_at = max(e.timestamp for e in persisted_events)
        db.commit()

    # Optionally trigger detection engine for newly ingested events
    if trigger_detections and persisted_events:
        from backend.app.services.detection_service import evaluate_events_against_rules
        evaluate_events_against_rules(db, persisted_events)

    return len(persisted_events), persisted_events

def ingest_file_content(
    db: Session,
    filename: str,
    content: str,
    source_type_override: Optional[str] = None
) -> Tuple[int, str]:
    """Inspect file format and ingest records safely."""
    lower_name = filename.lower()
    raw_records: List[Dict[str, Any]] = []
    detected_source = source_type_override or "generic"

    if lower_name.endswith(".json"):
        detected_source = source_type_override or "json"
        raw_records = parse_json(content)
    elif lower_name.endswith(".jsonl") or lower_name.endswith(".ndjson"):
        detected_source = source_type_override or "jsonl"
        lines = content.splitlines()
        raw_records = list(parse_jsonl(lines))
    elif lower_name.endswith(".csv"):
        detected_source = source_type_override or "csv"
        raw_records = parse_csv(content)
    elif "auth.log" in lower_name or "secure" in lower_name or lower_name.endswith(".log"):
        detected_source = source_type_override or "linux_auth"
        lines = content.splitlines()
        for line in lines:
            parsed_line = parse_linux_auth_line(line)
            if parsed_line:
                raw_records.append(parsed_line)
    else:
        # Default attempt JSON then line-by-line auth log
        try:
            raw_records = parse_json(content)
            detected_source = source_type_override or "json"
        except Exception:
            lines = content.splitlines()
            for line in lines:
                parsed_line = parse_linux_auth_line(line)
                if parsed_line:
                    raw_records.append(parsed_line)
            detected_source = source_type_override or "linux_auth"

    count, _ = ingest_events_batch(db, raw_records, source_type=detected_source)
    return count, detected_source

def search_events(
    db: Session,
    params: EventFilterParams
) -> Tuple[List[SecurityEvent], int]:
    """Execute parameterized, safe filtered query on SecurityEvent."""
    query = db.query(SecurityEvent)

    # Safe structured filters
    if params.source_type:
        query = query.filter(SecurityEvent.source_type == params.source_type)
    if params.event_category:
        query = query.filter(SecurityEvent.event_category == params.event_category)
    if params.severity:
        query = query.filter(SecurityEvent.severity == params.severity)
    if params.outcome:
        query = query.filter(SecurityEvent.outcome == params.outcome)
    if params.host:
        query = query.filter(SecurityEvent.host.ilike(f"%{params.host}%"))
    if params.username:
        query = query.filter(SecurityEvent.username.ilike(f"%{params.username}%"))
    if params.source_ip:
        query = query.filter(SecurityEvent.source_ip == params.source_ip)
    if params.destination_ip:
        query = query.filter(SecurityEvent.destination_ip == params.destination_ip)
    if params.start_time:
        query = query.filter(SecurityEvent.timestamp >= params.start_time)
    if params.end_time:
        query = query.filter(SecurityEvent.timestamp <= params.end_time)

    # Free-text search safely parameterized across host, user, action, raw_payload
    if params.query:
        search_pattern = f"%{params.query}%"
        query = query.filter(
            or_(
                SecurityEvent.username.ilike(search_pattern),
                SecurityEvent.host.ilike(search_pattern),
                SecurityEvent.action.ilike(search_pattern),
                SecurityEvent.source_ip.ilike(search_pattern),
                SecurityEvent.raw_payload.ilike(search_pattern)
            )
        )

    total = query.count()

    # Safe sorting
    sort_column = getattr(SecurityEvent, params.sort_by, SecurityEvent.timestamp)
    if params.sort_desc:
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # Safe pagination
    offset = (params.page - 1) * params.page_size
    items = query.offset(offset).limit(params.page_size).all()
    return items, total

def export_events_csv(events: List[SecurityEvent]) -> str:
    """Generate CSV string of event records."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "event_id", "timestamp", "source_type", "host", "username",
        "source_ip", "destination_ip", "category", "action", "outcome", "severity"
    ])
    for e in events:
        writer.writerow([
            e.event_id,
            e.timestamp.isoformat() if e.timestamp else "",
            e.source_type,
            e.host or "",
            e.username or "",
            e.source_ip or "",
            e.destination_ip or "",
            e.event_category,
            e.action,
            e.outcome,
            e.severity
        ])
    return output.getvalue()
