import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.case import IncidentCase, CaseNote, CaseEvidence, CaseStatus, CasePriority
from backend.app.models.alert import Alert
from backend.app.schemas.case import CaseCreate, CaseUpdate, CaseNoteCreate, CaseEvidenceCreate
from backend.app.core.exceptions import EntityNotFoundError
from backend.app.services.audit_service import record_audit

def generate_case_id(db: Session) -> str:
    """Generate human-readable sequential case identifier like CASE-2026-0001."""
    year = datetime.now(timezone.utc).year
    count = db.query(IncidentCase).count() + 1
    return f"CASE-{year}-{count:04d}"

def create_case(
    db: Session,
    case_in: CaseCreate,
    author_username: str,
    author_id: Optional[int] = None,
    ip_address: Optional[str] = None
) -> IncidentCase:
    """Create a new incident case and link any specified alerts."""
    case_id = generate_case_id(db)
    
    # Default investigation checklist
    default_checklist = [
        {"task": "Verify initial alert triggering events", "completed": False},
        {"task": "Determine affected entities and blast radius", "completed": False},
        {"task": "Check IOC matches and reputation", "completed": False},
        {"task": "Apply containment or remediation actions", "completed": False},
        {"task": "Document findings and resolution summary", "completed": False}
    ]

    new_case = IncidentCase(
        case_id=case_id,
        title=case_in.title,
        description=case_in.description,
        severity=case_in.severity,
        priority=case_in.priority,
        status=CaseStatus.NEW.value,
        assigned_to=case_in.assigned_to or author_username,
        checklist=default_checklist,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # Link alerts if provided
    if case_in.alert_ids:
        for aid in case_in.alert_ids:
            alert = db.query(Alert).filter(Alert.alert_id == aid).first()
            if alert:
                alert.case_id = case_id
                # Add as evidence
                ev = CaseEvidence(
                    case_id=case_id,
                    evidence_type="alert",
                    evidence_reference=alert.alert_id,
                    description=f"Triggering Alert: {alert.title}",
                    metadata_json={"severity": alert.severity, "rule_id": alert.rule_id}
                )
                db.add(ev)
        db.commit()

    # Initial system note
    initial_note = CaseNote(
        case_id=case_id,
        user_id=author_id,
        author_username=author_username,
        content=f"Case created by {author_username}. Status set to 'new'."
    )
    db.add(initial_note)
    db.commit()

    record_audit(
        db=db,
        username=author_username,
        action="case.create",
        user_id=author_id,
        resource_type="case",
        resource_id=case_id,
        ip_address=ip_address,
        details={"title": case_in.title, "severity": case_in.severity}
    )

    db.refresh(new_case)
    return new_case

def get_case(db: Session, case_id: str) -> IncidentCase:
    """Retrieve case by case_id."""
    case = db.query(IncidentCase).filter(IncidentCase.case_id == case_id).first()
    if not case:
        raise EntityNotFoundError("IncidentCase", case_id)
    return case

def update_case(
    db: Session,
    case_id: str,
    update_in: CaseUpdate,
    author_username: str,
    author_id: Optional[int] = None,
    ip_address: Optional[str] = None
) -> IncidentCase:
    """Update case status, findings, resolution, checklist, etc."""
    case = get_case(db, case_id)

    old_status = case.status
    if update_in.title is not None:
        case.title = update_in.title
    if update_in.description is not None:
        case.description = update_in.description
    if update_in.severity is not None:
        case.severity = update_in.severity
    if update_in.priority is not None:
        case.priority = update_in.priority
    if update_in.assigned_to is not None:
        case.assigned_to = update_in.assigned_to
    if update_in.findings is not None:
        case.findings = update_in.findings
    if update_in.resolution_summary is not None:
        case.resolution_summary = update_in.resolution_summary
    if update_in.checklist is not None:
        case.checklist = update_in.checklist

    if update_in.status is not None:
        case.status = update_in.status
        if update_in.status == CaseStatus.CLOSED.value and old_status != CaseStatus.CLOSED.value:
            case.closed_at = datetime.now(timezone.utc)
            # Add status change note
            note = CaseNote(
                case_id=case_id,
                user_id=author_id,
                author_username=author_username,
                content=f"Case closed by {author_username} with resolution: {case.resolution_summary or 'No summary provided.'}"
            )
            db.add(note)

    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(case)

    record_audit(
        db=db,
        username=author_username,
        action="case.update",
        user_id=author_id,
        resource_type="case",
        resource_id=case_id,
        ip_address=ip_address,
        details={"status": case.status, "assigned_to": case.assigned_to}
    )
    return case

def add_case_note(
    db: Session,
    case_id: str,
    note_in: CaseNoteCreate,
    author_username: str,
    author_id: Optional[int] = None,
    ip_address: Optional[str] = None
) -> CaseNote:
    """Append analyst note to case timeline."""
    case = get_case(db, case_id)
    note = CaseNote(
        case_id=case.case_id,
        user_id=author_id,
        author_username=author_username,
        content=note_in.content,
        created_at=datetime.now(timezone.utc)
    )
    db.add(note)
    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note)

    record_audit(
        db=db,
        username=author_username,
        action="case.add_note",
        user_id=author_id,
        resource_type="case",
        resource_id=case_id,
        ip_address=ip_address
    )
    return note

def add_case_evidence(
    db: Session,
    case_id: str,
    ev_in: CaseEvidenceCreate,
    author_username: str,
    author_id: Optional[int] = None,
    ip_address: Optional[str] = None
) -> CaseEvidence:
    """Link evidence item to case."""
    case = get_case(db, case_id)
    evidence = CaseEvidence(
        case_id=case.case_id,
        evidence_type=ev_in.evidence_type,
        evidence_reference=ev_in.evidence_reference,
        description=ev_in.description,
        metadata_json=ev_in.metadata_json,
        created_at=datetime.now(timezone.utc)
    )
    db.add(evidence)
    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(evidence)

    record_audit(
        db=db,
        username=author_username,
        action="case.add_evidence",
        user_id=author_id,
        resource_type="case",
        resource_id=case_id,
        ip_address=ip_address,
        details={"evidence_type": ev_in.evidence_type, "ref": ev_in.evidence_reference}
    )
    return evidence
