from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class CaseNoteCreate(BaseModel):
    content: str = Field(..., min_length=1)

class CaseNoteRead(BaseModel):
    id: int
    case_id: str
    user_id: Optional[int] = None
    author_username: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}

class CaseEvidenceCreate(BaseModel):
    evidence_type: str  # "event", "alert", "ioc", "file", "network_artifact"
    evidence_reference: str  # ID, hash, or reference string
    description: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class CaseEvidenceRead(BaseModel):
    id: int
    case_id: str
    evidence_type: str
    evidence_reference: str
    description: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class CaseCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str
    severity: str = "medium"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    alert_ids: Optional[List[str]] = None

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    findings: Optional[str] = None
    resolution_summary: Optional[str] = None
    checklist: Optional[List[Dict[str, Any]]] = None

class CaseRead(BaseModel):
    id: int
    case_id: str
    title: str
    description: str
    severity: str
    status: str
    priority: str
    assigned_to: Optional[str] = None
    findings: Optional[str] = None
    resolution_summary: Optional[str] = None
    checklist: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    notes: List[CaseNoteRead] = []
    evidence: List[CaseEvidenceRead] = []

    model_config = {"from_attributes": True}

class PaginatedCases(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    items: List[CaseRead]
