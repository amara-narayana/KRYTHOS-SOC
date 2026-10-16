from datetime import datetime
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, Field

class EventCreate(BaseModel):
    event_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    source_type: str = "generic"
    source_id: Optional[str] = None
    host: Optional[str] = None
    username: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    event_category: str = "other"
    action: str
    outcome: str = "unknown"
    severity: str = "low"
    process_name: Optional[str] = None
    raw_payload: Optional[str] = None
    normalized_payload: Optional[Dict[str, Any]] = None

class EventRead(BaseModel):
    id: int
    event_id: str
    timestamp: datetime
    source_type: str
    source_id: Optional[str] = None
    host: Optional[str] = None
    username: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    event_category: str
    action: str
    outcome: str
    severity: str
    process_name: Optional[str] = None
    raw_payload: Optional[str] = None
    normalized_payload: Optional[Dict[str, Any]] = None
    ingested_at: datetime

    model_config = {"from_attributes": True}

class EventFilterParams(BaseModel):
    query: Optional[str] = None
    source_type: Optional[str] = None
    event_category: Optional[str] = None
    severity: Optional[str] = None
    outcome: Optional[str] = None
    host: Optional[str] = None
    username: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=500)
    sort_by: str = "timestamp"
    sort_desc: bool = True

class EventSourceRead(BaseModel):
    id: int
    source_type: str
    name: str
    status: str
    events_count: int
    last_event_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}

class PaginatedEvents(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    items: List[EventRead]
