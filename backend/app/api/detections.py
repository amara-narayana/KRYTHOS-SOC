from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.rule import DetectionRule
from backend.app.models.event import SecurityEvent
from backend.app.schemas.rule import RuleRead, RuleCreate, RuleUpdate, RuleValidationResult
from backend.app.services.detection_service import (
    initialize_default_rules,
    validate_rule_definition,
    evaluate_events_against_rules
)
from backend.app.core.permissions import require_viewer, require_admin, require_analyst
from backend.app.models.user import User

router = APIRouter(prefix="/detections", tags=["Detections"])

@router.get("/rules", response_model=List[RuleRead])
def list_detection_rules(
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """List all configured detection rules and their ATT&CK mappings."""
    initialize_default_rules(db)
    return db.query(DetectionRule).all()

@router.post("/rules", response_model=RuleRead, status_code=status.HTTP_201_CREATED)
def create_detection_rule(
    payload: RuleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Create a new custom detection rule (Administrator only)."""
    existing = db.query(DetectionRule).filter(DetectionRule.rule_id == payload.rule_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Rule ID '{payload.rule_id}' already exists.")

    val = validate_rule_definition(payload.logic_definition, payload.rule_type)
    if not val.is_valid:
        raise HTTPException(status_code=400, detail=f"Invalid rule definition: {', '.join(val.errors)}")

    rule = DetectionRule(
        rule_id=payload.rule_id,
        version=payload.version,
        name=payload.name,
        description=payload.description,
        severity=payload.severity,
        confidence=payload.confidence,
        rule_type=payload.rule_type,
        logic_definition=payload.logic_definition,
        mitre_attack_id=payload.mitre_attack_id,
        mitre_tactic=payload.mitre_tactic,
        mitre_technique=payload.mitre_technique,
        enabled=payload.enabled,
        suppression_window_seconds=payload.suppression_window_seconds
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.put("/rules/{rule_id}", response_model=RuleRead)
def update_detection_rule(
    rule_id: str,
    payload: RuleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Update detection rule configuration or toggle enabled state (Administrator only)."""
    rule = db.query(DetectionRule).filter(DetectionRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule '{rule_id}' not found.")

    if payload.name is not None:
        rule.name = payload.name
    if payload.description is not None:
        rule.description = payload.description
    if payload.severity is not None:
        rule.severity = payload.severity
    if payload.confidence is not None:
        rule.confidence = payload.confidence
    if payload.enabled is not None:
        rule.enabled = payload.enabled
    if payload.suppression_window_seconds is not None:
        rule.suppression_window_seconds = payload.suppression_window_seconds
    if payload.logic_definition is not None:
        rule.logic_definition = payload.logic_definition

    db.commit()
    db.refresh(rule)
    return rule

@router.post("/validate", response_model=RuleValidationResult)
def validate_rule(
    logic_definition: dict,
    rule_type: str = "threshold",
    _: User = Depends(require_analyst)
):
    """Validate detection rule syntax and parameters before deployment."""
    return validate_rule_definition(logic_definition, rule_type)

@router.post("/run")
def trigger_detection_run(
    limit: int = 1000,
    db: Session = Depends(get_db),
    _: User = Depends(require_analyst)
):
    """Execute detection engine evaluation across recent events."""
    recent_events = db.query(SecurityEvent).order_by(SecurityEvent.timestamp.desc()).limit(limit).all()
    alerts = evaluate_events_against_rules(db, recent_events)
    return {
        "status": "success",
        "evaluated_events": len(recent_events),
        "alerts_generated": len(alerts)
    }
