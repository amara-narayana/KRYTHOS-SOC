from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class RuleCreate(BaseModel):
    rule_id: str = Field(..., min_length=3, max_length=50)
    version: str = "1.0.0"
    name: str = Field(..., min_length=3, max_length=150)
    description: str
    severity: str = "medium"  # low, medium, high, critical
    confidence: int = Field(80, ge=1, le=100)
    rule_type: str = "threshold"  # threshold, single_event, sequence, ioc_match
    logic_definition: Dict[str, Any]
    mitre_attack_id: Optional[str] = None
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None
    enabled: bool = True
    suppression_window_seconds: int = 300

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    confidence: Optional[int] = None
    rule_type: Optional[str] = None
    logic_definition: Optional[Dict[str, Any]] = None
    mitre_attack_id: Optional[str] = None
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None
    enabled: Optional[bool] = None
    suppression_window_seconds: Optional[int] = None

class RuleRead(BaseModel):
    id: int
    rule_id: str
    version: str
    name: str
    description: str
    severity: str
    confidence: int
    rule_type: str
    logic_definition: Dict[str, Any]
    mitre_attack_id: Optional[str] = None
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None
    enabled: bool
    suppression_window_seconds: int
    last_triggered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class RuleValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
