from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models.alert import Alert
from backend.app.models.case import IncidentCase
from backend.app.models.event import SecurityEvent
from backend.app.models.rule import DetectionRule
from backend.app.core.permissions import require_viewer
from backend.app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
def get_executive_summary_report(
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """Aggregate high-level executive report data."""
    total_events = db.query(SecurityEvent).count()
    total_alerts = db.query(Alert).count()
    total_cases = db.query(IncidentCase).count()
    active_rules = db.query(DetectionRule).filter(DetectionRule.enabled == True).count()

    alerts_by_severity = db.query(Alert.severity, func.count(Alert.id)).group_by(Alert.severity).all()
    cases_by_status = db.query(IncidentCase.status, func.count(IncidentCase.id)).group_by(IncidentCase.status).all()

    return {
        "report_title": "KRYTHOS SOC Executive Operational Summary",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_events": total_events,
        "total_alerts": total_alerts,
        "total_cases": total_cases,
        "active_rules": active_rules,
        "alerts_by_severity": {s: c for s, c in alerts_by_severity},
        "cases_by_status": {st: c for st, c in cases_by_status}
    }
from datetime import datetime, timezone
