from typing import Optional
from datetime import datetime, timezone
import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas.event import EventFilterParams, PaginatedEvents, EventRead
from backend.app.services.event_service import search_events, export_events_csv
from backend.app.models.event import SecurityEvent
from backend.app.core.permissions import require_viewer, require_admin
from backend.app.models.user import User
from backend.app.services.live_bus import live_bus
from backend.app.services.live_watcher import live_watcher

router = APIRouter(prefix="/events", tags=["Events"])

@router.get("/stream")
async def stream_live_events():
    """
    Real-time Server-Sent Events (SSE) telemetry stream.
    Zero polling, push-based delivery for live arrivals and immediate alert detections.
    """
    async def event_generator():
        queue = live_bus.subscribe()
        try:
            yield f"data: {json.dumps({'type': 'connected', 'status': 'stream_active', 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
            while True:
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {json.dumps(msg)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            live_bus.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/collector/status")
def get_live_collector_status(_: User = Depends(require_viewer)):
    """Retrieve real-time live collector daemon status, captured events, and health."""
    return live_watcher.get_status()

@router.post("/collector/restart")
def restart_live_collector(_: User = Depends(require_admin)):
    """Restart the live collector process."""
    live_watcher.stop()
    live_watcher.start()
    return {"status": "restarted", "collector": live_watcher.get_status()}

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
