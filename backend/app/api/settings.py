from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.audit import SystemSetting, AuditLog
from backend.app.config import settings
from backend.app.core.permissions import require_admin
from backend.app.models.user import User
from backend.app.services.audit_service import record_audit

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
def get_system_settings(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Retrieve operational system configuration."""
    db_settings = db.query(SystemSetting).all()
    setting_map = {s.key: s.value for s in db_settings}

    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "registration_policy": setting_map.get("registration_policy", settings.REGISTRATION_POLICY),
        "log_retention_days": int(setting_map.get("log_retention_days", settings.LOG_RETENTION_DAYS)),
        "max_event_batch_size": int(setting_map.get("max_event_batch_size", settings.MAX_EVENT_BATCH_SIZE)),
        "low_memory_mode": setting_map.get("low_memory_mode", str(settings.LOW_MEMORY_MODE)).lower() == "true",
        "ai_enabled": setting_map.get("ai_enabled", str(settings.AI_ENABLED)).lower() == "true",
        "ai_model": setting_map.get("ai_model", settings.AI_MODEL)
    }

@router.put("")
def update_system_settings(
    payload: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Update system operational settings (Administrator only)."""
    for key, val in payload.items():
        existing = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if existing:
            existing.value = str(val)
        else:
            db.add(SystemSetting(key=key, value=str(val)))
    db.commit()

    client_ip = request.client.host if request.client else "127.0.0.1"
    record_audit(
        db=db,
        username=admin_user.username,
        action="settings.update",
        user_id=admin_user.id,
        resource_type="system",
        resource_id="configuration",
        ip_address=client_ip,
        details=payload
    )
    return {"status": "success", "updated_settings": payload}

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """List system audit history for compliance and accountability."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs
