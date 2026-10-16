import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from backend.app.database import Base

class IOCType(str, enum.Enum):
    IP = "ip"
    DOMAIN = "domain"
    URL = "url"
    MD5 = "md5"
    SHA256 = "sha256"

class ThreatIndicator(Base):
    __tablename__ = "threat_indicators"

    id = Column(Integer, primary_key=True, index=True)
    ioc_type = Column(String(20), index=True, nullable=False)  # ip, domain, url, md5, sha256
    value = Column(String(500), unique=True, index=True, nullable=False)
    threat_type = Column(String(100), default="malicious", nullable=False)  # c2, malware, phishing, scanning
    confidence = Column(Integer, default=80, nullable=False)  # 1-100
    provenance = Column(String(200), default="internal_analyst", nullable=False)  # e.g., "internal_soc", "feed_import"
    description = Column(Text, nullable=True)
    first_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_ioc_type_val", "ioc_type", "value"),
    )
