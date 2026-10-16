from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.app.models.event import SecurityEvent
from backend.app.models.alert import Alert
from backend.app.models.case import IncidentCase
from backend.app.models.ioc import ThreatIndicator
from backend.app.schemas.stats import EntityActivitySummary

def calculate_entity_risk_score(
    events_count: int,
    alerts: List[Alert],
    ioc_matched: bool
) -> int:
    """
    Explainable risk score calculation:
    - Base: 0
    - Critical alert: +35 each (max 70)
    - High alert: +20 each (max 40)
    - Medium alert: +10 each (max 30)
    - Low alert: +5 each (max 15)
    - Threat IOC hit: +30
    - High failure event volume: +10
    Cap at 100.
    """
    score = 0
    sev_weights = {"critical": 35, "high": 20, "medium": 10, "low": 5}
    for a in alerts:
        score += sev_weights.get(a.severity.lower(), 5)
    
    if ioc_matched:
        score += 30
    if events_count > 50:
        score += 10

    return min(100, max(0, score))

def get_entity_summary(
    db: Session,
    entity_type: str,  # "user", "host", "ip"
    entity_value: str
) -> EntityActivitySummary:
    """Aggregate all historical security telemetry for an entity."""
    clean_val = entity_value.strip()

    # Query events
    if entity_type == "user":
        event_query = db.query(SecurityEvent).filter(SecurityEvent.username.ilike(clean_val))
    elif entity_type == "host":
        event_query = db.query(SecurityEvent).filter(SecurityEvent.host.ilike(clean_val))
    else:  # ip
        event_query = db.query(SecurityEvent).filter(
            or_(SecurityEvent.source_ip == clean_val, SecurityEvent.destination_ip == clean_val)
        )

    events_count = event_query.count()
    recent_events_records = event_query.order_by(desc(SecurityEvent.timestamp)).limit(20).all()
    first_seen = event_query.order_by(SecurityEvent.timestamp.asc()).first()
    last_seen = event_query.order_by(SecurityEvent.timestamp.desc()).first()

    # Query alerts where entity is mentioned
    all_alerts = db.query(Alert).all()
    related_alerts = []
    for a in all_alerts:
        if a.entities and clean_val.lower() in str(a.entities).lower():
            related_alerts.append(a)

    # Threat Intel IOC match check
    ioc_match = db.query(ThreatIndicator).filter(ThreatIndicator.value == clean_val.lower()).first()
    ioc_matched_list = []
    if ioc_match:
        ioc_matched_list.append({
            "ioc_type": ioc_match.ioc_type,
            "threat_type": ioc_match.threat_type,
            "confidence": ioc_match.confidence,
            "provenance": ioc_match.provenance
        })

    # Cases linking to these alerts
    alert_ids = [a.alert_id for a in related_alerts]
    cases_count = db.query(IncidentCase).filter(
        IncidentCase.description.ilike(f"%{clean_val}%")
    ).count()

    risk_score = calculate_entity_risk_score(
        events_count=events_count,
        alerts=related_alerts,
        ioc_matched=bool(ioc_match)
    )

    return EntityActivitySummary(
        entity_type=entity_type,
        entity_value=clean_val,
        events_count=events_count,
        alerts_count=len(related_alerts),
        cases_count=cases_count,
        risk_score=risk_score,
        first_seen=first_seen.timestamp if first_seen else None,
        last_seen=last_seen.timestamp if last_seen else None,
        recent_events=[
            {
                "event_id": e.event_id,
                "timestamp": e.timestamp.isoformat(),
                "action": e.action,
                "outcome": e.outcome,
                "severity": e.severity,
                "host": e.host,
                "username": e.username,
                "source_ip": e.source_ip
            }
            for e in recent_events_records
        ],
        related_alerts=[
            {
                "alert_id": a.alert_id,
                "title": a.title,
                "severity": a.severity,
                "rule_id": a.rule_id,
                "status": a.status,
                "created_at": a.created_at.isoformat()
            }
            for a in related_alerts
        ],
        threat_intel_matches=ioc_matched_list
    )
