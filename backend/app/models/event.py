import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Index
from backend.app.database import Base

class EventCategory(str, enum.Enum):
    AUTHENTICATION = "authentication"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    NETWORK = "network"
    PROCESS = "process"
    SYSTEM = "system"
    DEFENSE_EVASION = "defense_evasion"
    OTHER = "other"

class EventOutcome(str, enum.Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    UNKNOWN = "unknown"

class EventSeverity(str, enum.Enum):
    INFORMATIONAL = "informational"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class EventSource(Base):
    __tablename__ = "event_sources"

    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String(50), nullable=False, index=True)  # e.g., "linux_auth", "jsonl", "csv", "suricata", "synthetic"
    name = Column(String(100), nullable=False)
    status = Column(String(20), default="active", nullable=False)  # active, degraded, inactive
    events_count = Column(Integer, default=0, nullable=False)
    last_event_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(64), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    source_type = Column(String(50), index=True, nullable=False)
    source_id = Column(String(100), index=True, nullable=True)
    host = Column(String(100), index=True, nullable=True)
    username = Column(String(100), index=True, nullable=True)
    source_ip = Column(String(45), index=True, nullable=True)
    destination_ip = Column(String(45), index=True, nullable=True)
    event_category = Column(String(50), index=True, default="other", nullable=False)
    action = Column(String(100), index=True, nullable=False)
    outcome = Column(String(20), default="unknown", nullable=False)
    severity = Column(String(20), default="low", nullable=False)
    process_name = Column(String(255), nullable=True)
    raw_payload = Column(Text, nullable=True)
    normalized_payload = Column(JSON, nullable=True)
    ingested_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_events_ts_category", "timestamp", "event_category"),
        Index("ix_events_host_ts", "host", "timestamp"),
        Index("ix_events_user_ts", "username", "timestamp"),
        Index("ix_events_ip_ts", "source_ip", "timestamp"),
    )
