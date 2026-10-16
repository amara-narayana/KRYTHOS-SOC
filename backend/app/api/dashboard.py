import os
import shutil
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.database import get_db
from backend.app.config import settings
from backend.app.models.event import SecurityEvent, EventSource
from backend.app.models.alert import Alert, AlertStatus
from backend.app.models.case import IncidentCase, CaseStatus
from backend.app.models.rule import DetectionRule
from backend.app.models.audit import AuditLog
from backend.app.schemas.stats import DashboardMetrics, SeverityCount
from backend.app.core.permissions import require_viewer
from backend.app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """Aggregate real database-backed SOC overview metrics."""
    events_count = db.query(SecurityEvent).count()
    alerts_count = db.query(Alert).count()
    cases_count = db.query(IncidentCase).count()

    # Active cases
    active_cases = db.query(IncidentCase).filter(
        IncidentCase.status.in_([CaseStatus.NEW.value, CaseStatus.INVESTIGATING.value, CaseStatus.CONTAINED.value])
    ).count()

    # Open alerts by severity
    open_alerts = db.query(Alert.severity, func.count(Alert.id)).filter(
        Alert.status.in_([AlertStatus.NEW.value, AlertStatus.INVESTIGATING.value])
    ).group_by(Alert.severity).all()
    
    sev_dict = {sev.lower(): count for sev, count in open_alerts}
    severity_breakdown = SeverityCount(
        low=sev_dict.get("low", 0),
        medium=sev_dict.get("medium", 0),
        high=sev_dict.get("high", 0),
        critical=sev_dict.get("critical", 0)
    )

    # Event volume over past 7 days (or recent buckets)
    now = datetime.now(timezone.utc)
    volume_buckets = []
    for day_offset in range(6, -1, -1):
        day_start = (now - timedelta(days=day_offset)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        cnt = db.query(SecurityEvent).filter(
            SecurityEvent.timestamp >= day_start,
            SecurityEvent.timestamp < day_end
        ).count()
        volume_buckets.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "events": cnt
        })

    # Top affected hosts
    top_hosts_query = db.query(
        SecurityEvent.host,
        func.count(SecurityEvent.id).label("count")
    ).filter(SecurityEvent.host != None).group_by(SecurityEvent.host).order_by(desc("count")).limit(5).all()

    top_hosts = [{"host": h, "count": c} for h, c in top_hosts_query if h]

    # Most frequently triggered rules
    top_rules_query = db.query(
        Alert.rule_id,
        Alert.rule_name,
        func.count(Alert.id).label("count")
    ).group_by(Alert.rule_id, Alert.rule_name).order_by(desc("count")).limit(5).all()

    top_rules = [{"rule_id": r_id, "name": r_name, "count": c} for r_id, r_name, c in top_rules_query]

    # Data source health
    sources = db.query(EventSource).all()
    data_source_health = [
        {
            "id": s.id,
            "source_type": s.source_type,
            "name": s.name,
            "status": s.status,
            "events_count": s.events_count,
            "last_event_at": s.last_event_at.isoformat() if s.last_event_at else None
        }
        for s in sources
    ]

    # Storage utilization
    db_file = settings.DATA_DIR / "krythos.db"
    db_size_bytes = db_file.stat().st_size if db_file.exists() else 0
    total, used, free = shutil.disk_usage(str(settings.DATA_DIR))
    storage_utilization = {
        "database_size_mb": round(db_size_bytes / (1024 * 1024), 2),
        "disk_total_gb": round(total / (1024**3), 2),
        "disk_used_gb": round(used / (1024**3), 2),
        "disk_free_gb": round(free / (1024**3), 2),
        "disk_percent_used": round((used / total) * 100, 1)
    }

    # Recent audit activity
    recent_audits = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(8).all()
    audit_list = [
        {
            "id": a.id,
            "username": a.username,
            "action": a.action,
            "resource_type": a.resource_type,
            "created_at": a.created_at.isoformat()
        }
        for a in recent_audits
    ]

    return DashboardMetrics(
        events_count=events_count,
        alerts_count=alerts_count,
        cases_count=cases_count,
        open_alerts_by_severity=severity_breakdown,
        active_cases=active_cases,
        event_volume_over_time=volume_buckets,
        top_affected_hosts=top_hosts,
        top_triggered_rules=top_rules,
        data_source_health=data_source_health,
        storage_utilization=storage_utilization,
        recent_audit_activity=audit_list
    )
