from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AlertRead(BaseModel):
    id: int
    alert_id: str
    rule_id: str
    rule_name: str
    severity: str
    confidence: int
    title: str
    description: str
    explanation: str
    entities: Optional[Dict[str, Any]] = None
    supporting_event_ids: List[str]
    mitre_attack_id: Optional[str] = None
    status: str
    assigned_to: Optional[str] = None
    case_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class AlertStatusUpdate(BaseModel):
    status: str
    assigned_to: Optional[str] = None
    case_id: Optional[str] = None
    note: Optional[str] = None

class PaginatedAlerts(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    items: List[AlertRead]
