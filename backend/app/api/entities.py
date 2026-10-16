from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.stats import EntityActivitySummary
from backend.app.services.entity_service import get_entity_summary
from backend.app.core.permissions import require_viewer
from backend.app.models.user import User

router = APIRouter(prefix="/entities", tags=["Entities"])

@router.get("/summary", response_model=EntityActivitySummary)
def get_entity_analytics(
    entity_type: str = Query(..., description="user, host, or ip"),
    entity_value: str = Query(..., description="Value of the entity"),
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """Aggregate historical activity, alerts, threat intel hits, and risk score for an entity."""
    clean_type = entity_type.lower()
    if clean_type not in ["user", "host", "ip"]:
        raise HTTPException(status_code=400, detail="entity_type must be 'user', 'host', or 'ip'")

    return get_entity_summary(db, entity_type=clean_type, entity_value=entity_value)
