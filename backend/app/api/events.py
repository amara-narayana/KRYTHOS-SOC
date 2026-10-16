from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas.event import EventFilterParams, PaginatedEvents, EventRead
from backend.app.services.event_service import search_events, export_events_csv
from backend.app.models.event import SecurityEvent
from backend.app.core.permissions import require_viewer
from backend.app.models.user import User

router = APIRouter(prefix="/events", tags=["Events"])

@router.get("", response_model=PaginatedEvents)
def list_and_search_events(
    query: Optional[str] = None,
    source_type: Optional[str] = None,
    event_category: Optional[str] = None,
    severity: Optional[str] = None,
    outcome: Optional[str] = None,
    host: Optional[str] = None,
    username: Optional[str] = None,
    source_ip: Optional[str] = None,
    destination_ip: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    sort_by: str = "timestamp",
    sort_desc: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """Search and filter ingested security events with safe pagination."""
    params = EventFilterParams(
        query=query,
        source_type=source_type,
        event_category=event_category,
        severity=severity,
        outcome=outcome,
        host=host,
        username=username,
        source_ip=source_ip,
        destination_ip=destination_ip,
        start_time=start_time,
        end_time=end_time,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_desc=sort_desc
    )
    items, total = search_events(db, params)
    pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedEvents(
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
        items=[EventRead.model_validate(e) for e in items]
    )

@router.get("/export/csv")
def export_events(
    query: Optional[str] = None,
    source_type: Optional[str] = None,
    event_category: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(1000, le=5000),
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """Export filtered events as CSV."""
    params = EventFilterParams(
        query=query,
        source_type=source_type,
        event_category=event_category,
        severity=severity,
        page=1,
        page_size=limit
    )
    items, _ = search_events(db, params)
    csv_text = export_events_csv(items)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=krythos_events_export.csv"}
    )

@router.get("/{event_id}", response_model=EventRead)
def get_event_details(
    event_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """Retrieve full details and raw payload for a specific event ID."""
    event = db.query(SecurityEvent).filter(SecurityEvent.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found.")
    return event
