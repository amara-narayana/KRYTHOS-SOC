from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models.case import IncidentCase
from backend.app.schemas.case import (
    CaseCreate,
    CaseUpdate,
    CaseRead,
    PaginatedCases,
    CaseNoteCreate,
    CaseNoteRead,
    CaseEvidenceCreate,
    CaseEvidenceRead
)
from backend.app.services.case_service import (
    create_case,
    get_case,
    update_case,
    add_case_note,
    add_case_evidence
)
from backend.app.services.report_service import generate_case_html_report
from backend.app.core.permissions import require_viewer, require_analyst
from backend.app.models.user import User
from backend.app.core.exceptions import KrythosException

router = APIRouter(prefix="/cases", tags=["Cases"])

@router.get("", response_model=PaginatedCases)
def list_cases(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """List incident investigation cases with filters and pagination."""
    query = db.query(IncidentCase)
    if status:
        query = query.filter(IncidentCase.status == status.lower())
    if severity:
        query = query.filter(IncidentCase.severity == severity.lower())
    if priority:
        query = query.filter(IncidentCase.priority == priority.lower())
    if assigned_to:
        query = query.filter(IncidentCase.assigned_to.ilike(f"%{assigned_to}%"))

    total = query.count()
    items = query.order_by(desc(IncidentCase.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedCases(
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
        items=[CaseRead.model_validate(c) for c in items]
    )

@router.post("", response_model=CaseRead, status_code=status.HTTP_201_CREATED)
def create_new_case(
    payload: CaseCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_analyst)
):
    """Create a new incident investigation case."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        new_case = create_case(
            db=db,
            case_in=payload,
            author_username=user.username,
            author_id=user.id,
            ip_address=client_ip
        )
        return new_case
    except KrythosException as e:
        raise HTTPException(status_code=400, detail=e.message)

@router.get("/{case_id}", response_model=CaseRead)
def get_case_detail(
    case_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """Retrieve complete case details, notes, and attached evidence."""
    try:
        return get_case(db, case_id)
    except KrythosException as e:
        raise HTTPException(status_code=404, detail=e.message)

@router.put("/{case_id}", response_model=CaseRead)
def update_case_detail(
    case_id: str,
    payload: CaseUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_analyst)
):
    """Update case status, priority, findings, checklist, or closure summary."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        updated = update_case(
            db=db,
            case_id=case_id,
            update_in=payload,
            author_username=user.username,
            author_id=user.id,
            ip_address=client_ip
        )
        return updated
    except KrythosException as e:
        raise HTTPException(status_code=400, detail=e.message)

@router.post("/{case_id}/notes", response_model=CaseNoteRead, status_code=status.HTTP_201_CREATED)
def add_note_to_case(
    case_id: str,
    payload: CaseNoteCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_analyst)
):
    """Add an analyst note to the case timeline."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        note = add_case_note(
            db=db,
            case_id=case_id,
            note_in=payload,
            author_username=user.username,
            author_id=user.id,
            ip_address=client_ip
        )
        return note
    except KrythosException as e:
        raise HTTPException(status_code=400, detail=e.message)

@router.post("/{case_id}/evidence", response_model=CaseEvidenceRead, status_code=status.HTTP_201_CREATED)
def add_evidence_to_case(
    case_id: str,
    payload: CaseEvidenceCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_analyst)
):
    """Link an evidence artifact (alert, event ID, IOC) to the case."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        evidence = add_case_evidence(
            db=db,
            case_id=case_id,
            ev_in=payload,
            author_username=user.username,
            author_id=user.id,
            ip_address=client_ip
        )
        return evidence
    except KrythosException as e:
        raise HTTPException(status_code=400, detail=e.message)

@router.get("/{case_id}/report.html")
def download_case_html_report(
    case_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """Generate and view a human-readable HTML incident report."""
    try:
        html = generate_case_html_report(db, case_id)
        return Response(content=html, media_type="text/html")
    except KrythosException as e:
        raise HTTPException(status_code=404, detail=e.message)
