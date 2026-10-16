from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    database: str
    timestamp: datetime
    low_memory_mode: bool
    ai_status: str

class SeverityCount(BaseModel):
    low: int = 0
    medium: int = 0
    high: int = 0
    critical: int = 0

class DashboardMetrics(BaseModel):
    events_count: int
    alerts_count: int
    cases_count: int
    open_alerts_by_severity: SeverityCount
    active_cases: int
    event_volume_over_time: List[Dict[str, Any]]
    top_affected_hosts: List[Dict[str, Any]]
    top_triggered_rules: List[Dict[str, Any]]
    data_source_health: List[Dict[str, Any]]
    storage_utilization: Dict[str, Any]
    recent_audit_activity: List[Dict[str, Any]]

class EntityActivitySummary(BaseModel):
    entity_type: str  # "user", "host", "ip"
    entity_value: str
    events_count: int
    alerts_count: int
    cases_count: int
    risk_score: int  # 0-100
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    recent_events: List[Dict[str, Any]] = []
    related_alerts: List[Dict[str, Any]] = []
    threat_intel_matches: List[Dict[str, Any]] = []

class AttackMatrixTechnique(BaseModel):
    technique_id: str
    technique_name: str
    tactic: str
    rules_count: int
    implemented: bool
    tested: bool
