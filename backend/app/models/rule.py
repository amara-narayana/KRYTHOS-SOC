from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from backend.app.database import Base

class DetectionRule(Base):
    __tablename__ = "detection_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g., "KRY-AUTH-001"
    version = Column(String(20), default="1.0.0", nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="medium", nullable=False)  # low, medium, high, critical
    confidence = Column(Integer, default=80, nullable=False)  # 1-100
    rule_type = Column(String(50), default="threshold", nullable=False)  # threshold, single_event, sequence, ioc_match
    logic_definition = Column(JSON, nullable=False)
    mitre_attack_id = Column(String(20), index=True, nullable=True)  # e.g., "T1110.001"
    mitre_tactic = Column(String(50), index=True, nullable=True)  # e.g., "Credential Access"
    mitre_technique = Column(String(100), nullable=True)  # e.g., "Password Guessing"
    enabled = Column(Boolean, default=True, index=True, nullable=False)
    suppression_window_seconds = Column(Integer, default=300, nullable=False)  # Deduplicate alerts within 5 min
    last_triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
