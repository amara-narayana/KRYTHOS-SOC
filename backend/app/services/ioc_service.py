import csv
import io
import json
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.models.ioc import ThreatIndicator, IOCType
from backend.app.schemas.ioc import IOCCreate, IOCMatchResult
from backend.app.models.event import SecurityEvent
from backend.app.core.exceptions import DuplicateEntityError, EntityNotFoundError
from backend.app.services.audit_service import record_audit

def create_ioc(
    db: Session,
    ioc_in: IOCCreate,
    author_username: str,
    ip_address: Optional[str] = None
) -> ThreatIndicator:
    """Add a new threat indicator to local IOC store."""
    clean_val = ioc_in.value.strip().lower()
    existing = db.query(ThreatIndicator).filter(ThreatIndicator.value == clean_val).first()
    if existing:
        raise DuplicateEntityError(f"Indicator '{clean_val}' already exists in threat intelligence store.")

    ioc = ThreatIndicator(
        ioc_type=ioc_in.ioc_type.lower(),
        value=clean_val,
        threat_type=ioc_in.threat_type,
        confidence=ioc_in.confidence,
        provenance=ioc_in.provenance,
        description=ioc_in.description,
        first_seen=datetime.now(timezone.utc),
        last_seen=datetime.now(timezone.utc),
        expires_at=ioc_in.expires_at,
        created_at=datetime.now(timezone.utc)
    )
    db.add(ioc)
    db.commit()
    db.refresh(ioc)

    record_audit(
        db=db,
        username=author_username,
        action="ioc.create",
        resource_type="ioc",
        resource_id=str(ioc.id),
        ip_address=ip_address,
        details={"value": clean_val, "type": ioc.ioc_type}
    )
    return ioc

def import_iocs(
    db: Session,
    content: str,
    provenance: str = "imported_file",
    author_username: str = "system"
) -> int:
    """Import IOCs from CSV or JSON text."""
    added = 0
    # Try JSON
    try:
        data = json.loads(content)
        if isinstance(data, list):
            for item in data:
                val = item.get("value")
                ioc_type = item.get("ioc_type", "ip")
                if val:
                    val = val.strip().lower()
                    if not db.query(ThreatIndicator).filter(ThreatIndicator.value == val).first():
                        db.add(ThreatIndicator(
                            ioc_type=ioc_type,
                            value=val,
                            threat_type=item.get("threat_type", "malicious"),
                            confidence=item.get("confidence", 80),
                            provenance=provenance,
                            description=item.get("description", "Bulk import")
                        ))
                        added += 1
            db.commit()
            return added
    except Exception:
        pass

    # Try CSV
    try:
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            val = row.get("value") or row.get("indicator")
            ioc_type = row.get("ioc_type") or row.get("type", "ip")
            if val:
                val = val.strip().lower()
                if not db.query(ThreatIndicator).filter(ThreatIndicator.value == val).first():
                    db.add(ThreatIndicator(
                        ioc_type=ioc_type,
                        value=val,
                        threat_type=row.get("threat_type", "malicious"),
                        confidence=int(row.get("confidence", 80)),
                        provenance=provenance,
                        description=row.get("description", "Bulk import")
                    ))
                    added += 1
        db.commit()
    except Exception:
        pass

    return added

def export_iocs_csv(db: Session) -> str:
    """Export all local IOCs as CSV."""
    iocs = db.query(ThreatIndicator).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ioc_type", "value", "threat_type", "confidence", "provenance", "first_seen", "last_seen", "description"])
    for i in iocs:
        writer.writerow([
            i.ioc_type,
            i.value,
            i.threat_type,
            i.confidence,
            i.provenance,
            i.first_seen.isoformat(),
            i.last_seen.isoformat(),
            i.description or ""
        ])
    return output.getvalue()
