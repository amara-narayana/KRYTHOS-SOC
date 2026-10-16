import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class AlertStatus(str, enum.Enum):
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    CLOSED = "closed"
    FALSE_POSITIVE = "false_positive"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(64), unique=True, index=True, nullable=False)
    rule_id = Column(String(50), index=True, nullable=False)
    rule_name = Column(String(150), nullable=False)
    severity = Column(String(20), index=True, nullable=False)  # low, medium, high, critical
    confidence = Column(Integer, default=80, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)  # Deterministic explanation of why rule triggered
    entities = Column(JSON, nullable=True)  # {"users": [...], "hosts": [...], "ips": [...]}
    supporting_event_ids = Column(JSON, nullable=False)  # List of event UUIDs
    mitre_attack_id = Column(String(20), nullable=True)
    status = Column(String(20), default=AlertStatus.NEW.value, index=True, nullable=False)
    assigned_to = Column(String(50), nullable=True)
    case_id = Column(String(64), index=True, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_alerts_severity_status", "severity", "status"),
    )
