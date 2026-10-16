import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class CaseStatus(str, enum.Enum):
    NEW = "new"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    CLOSED = "closed"

class CasePriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentCase(Base):
    __tablename__ = "incident_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(64), unique=True, index=True, nullable=False)  # e.g., "CASE-2026-0001"
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="medium", nullable=False)
    status = Column(String(20), default=CaseStatus.NEW.value, index=True, nullable=False)
    priority = Column(String(20), default=CasePriority.MEDIUM.value, nullable=False)
    assigned_to = Column(String(50), nullable=True)
    findings = Column(Text, nullable=True)
    resolution_summary = Column(Text, nullable=True)
    checklist = Column(JSON, nullable=True)  # List of dicts: [{"task": "...", "completed": bool}]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    closed_at = Column(DateTime, nullable=True)

    notes = relationship("CaseNote", back_populates="case", cascade="all, delete-orphan")
    evidence = relationship("CaseEvidence", back_populates="case", cascade="all, delete-orphan")

class CaseNote(Base):
    __tablename__ = "case_notes"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("incident_cases.case_id"), index=True, nullable=False)
    user_id = Column(Integer, nullable=True)
    author_username = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    case = relationship("IncidentCase", back_populates="notes")

class CaseEvidence(Base):
    __tablename__ = "case_evidence"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(64), ForeignKey("incident_cases.case_id"), index=True, nullable=False)
    evidence_type = Column(String(50), nullable=False)  # "event", "alert", "ioc", "file", "network_artifact"
    evidence_reference = Column(String(255), nullable=False)  # UUID or identifier
    description = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    case = relationship("IncidentCase", back_populates="evidence")
