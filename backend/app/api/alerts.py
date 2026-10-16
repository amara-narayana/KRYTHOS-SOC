from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models.alert import Alert, AlertStatus
from backend.app.schemas.alert import AlertRead, AlertStatusUpdate, PaginatedAlerts
from backend.app.core.permissions import require_viewer, require_analyst
from backend.app.models.user import User
from backend.app.services.audit_service import record_audit
from backend.app.services.ai_service import generate_investigation_assistant_summary

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=PaginatedAlerts)
def list_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    rule_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """Retrieve filtered, paginated list of security alerts."""
    query = db.query(Alert)
    if severity:
        query = query.filter(Alert.severity == severity.lower())
    if status:
        query = query.filter(Alert.status == status.lower())
    if rule_id:
        query = query.filter(Alert.rule_id == rule_id)

    total = query.count()
    items = query.order_by(desc(Alert.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedAlerts(
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
        items=[AlertRead.model_validate(a) for a in items]
    )

@router.get("/{alert_id}", response_model=AlertRead)
def get_alert_detail(
    alert_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """Retrieve full details, entities, and supporting evidence references for an alert."""
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")
    return alert

@router.put("/{alert_id}/status", response_model=AlertRead)
def update_alert_status(
    alert_id: str,
    payload: AlertStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_analyst)
):
    """Triage or update alert status (acknowledge, assign, link case, resolve)."""
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")

    old_status = alert.status
    alert.status = payload.status
    if payload.assigned_to is not None:
        alert.assigned_to = payload.assigned_to
    if payload.case_id is not None:
        alert.case_id = payload.case_id
    alert.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)

    client_ip = request.client.host if request.client else "127.0.0.1"
    record_audit(
        db=db,
        username=user.username,
        action="alert.status_change",
        user_id=user.id,
        resource_type="alert",
        resource_id=alert.alert_id,
        ip_address=client_ip,
        details={"old_status": old_status, "new_status": alert.status, "case_id": alert.case_id}
    )
    return alert

@router.get("/{alert_id}/ai-assist")
async def get_alert_ai_assistance(
    alert_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_analyst)
):
    """Get optional AI-assisted investigation summary with deterministic fallback."""
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")

    analysis = await generate_investigation_assistant_summary(
        alert_title=alert.title,
        explanation=alert.explanation,
        entities=alert.entities or {},
        event_ids=alert.supporting_event_ids or []
    )
    return analysis
