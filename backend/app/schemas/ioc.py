from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class IOCCreate(BaseModel):
    ioc_type: str = Field(..., description="ip, domain, url, md5, sha256")
    value: str = Field(..., min_length=2, max_length=500)
    threat_type: str = "malicious"
    confidence: int = Field(80, ge=1, le=100)
    provenance: str = "internal_analyst"
    description: Optional[str] = None
    expires_at: Optional[datetime] = None

class IOCRead(BaseModel):
    id: int
    ioc_type: str
    value: str
    threat_type: str
    confidence: int
    provenance: str
    description: Optional[str] = None
    first_seen: datetime
    last_seen: datetime
    expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class IOCMatchResult(BaseModel):
    matched: bool
    ioc_value: str
    ioc_type: str
    threat_type: str
    confidence: int
    matched_event_id: str
    matched_field: str
