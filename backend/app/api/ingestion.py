from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.services.event_service import ingest_file_content, ingest_events_batch
from backend.app.core.permissions import require_analyst
from backend.app.models.user import User
from backend.app.services.audit_service import record_audit

router = APIRouter(prefix="/ingestion", tags=["Ingestion"])

@router.post("/batch")
def ingest_batch(
    records: List[Dict[str, Any]],
    source_type: str = "api_batch",
    request: Request = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_analyst)
):
    """Ingest a batch of JSON event records directly."""
    if len(records) > 1000:
        raise HTTPException(status_code=400, detail="Batch size exceeds maximum limit of 1000 records.")

    count, events = ingest_events_batch(db, records, source_type=source_type)
    client_ip = request.client.host if request and request.client else "127.0.0.1"
    
    record_audit(
        db=db,
        username=user.username,
        action="event.ingest_batch",
        user_id=user.id,
        resource_type="event_source",
        resource_id=source_type,
        ip_address=client_ip,
        details={"ingested_count": count}
    )
    return {"status": "success", "ingested": count, "source_type": source_type}

@router.post("/upload")
async def upload_log_file(
    file: UploadFile = File(...),
    source_type: Optional[str] = Form(None),
    request: Request = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_analyst)
):
    """Upload and ingest a log file (JSON, JSONL, CSV, Linux auth.log, syslog)."""
    # Max file upload size check (e.g. 20MB)
    content_bytes = await file.read()
    if len(content_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Uploaded file exceeds 20MB limit.")

    try:
        content_text = content_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file as text: {str(e)}")

    count, detected_source = ingest_file_content(
        db=db,
        filename=file.filename or "upload.log",
        content=content_text,
        source_type_override=source_type
    )

    client_ip = request.client.host if request and request.client else "127.0.0.1"
    record_audit(
        db=db,
        username=user.username,
        action="event.ingest_file",
        user_id=user.id,
        resource_type="file",
        resource_id=file.filename,
        ip_address=client_ip,
        details={"records_persisted": count, "source_type": detected_source}
    )

    return {
        "status": "success",
        "filename": file.filename,
        "source_type": detected_source,
        "records_ingested": count
    }
