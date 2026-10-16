from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, UploadFile, File
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.ioc import ThreatIndicator
from backend.app.models.rule import DetectionRule
from backend.app.schemas.ioc import IOCCreate, IOCRead
from backend.app.schemas.stats import AttackMatrixTechnique
from backend.app.services.ioc_service import create_ioc, import_iocs, export_iocs_csv
from backend.app.services.detection_service import initialize_default_rules
from backend.app.core.permissions import require_viewer, require_analyst
from backend.app.models.user import User
from backend.app.core.exceptions import KrythosException

router = APIRouter(prefix="/intelligence", tags=["Threat Intelligence"])

@router.get("/iocs", response_model=List[IOCRead])
def list_threat_indicators(
    ioc_type: Optional[str] = None,
    threat_type: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """List local Threat Intelligence indicators (IOCs)."""
    query = db.query(ThreatIndicator)
    if ioc_type:
        query = query.filter(ThreatIndicator.ioc_type == ioc_type.lower())
    if threat_type:
        query = query.filter(ThreatIndicator.threat_type == threat_type.lower())
    return query.all()

@router.post("/iocs", response_model=IOCRead, status_code=status.HTTP_201_CREATED)
def add_threat_indicator(
    payload: IOCCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_analyst)
):
    """Add a new IOC to local database."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        ioc = create_ioc(db, payload, author_username=user.username, ip_address=client_ip)
        return ioc
    except KrythosException as e:
        raise HTTPException(status_code=400, detail=e.message)

@router.post("/iocs/import")
async def import_ioc_file(
    file: UploadFile = File(...),
    provenance: str = "file_upload",
    db: Session = Depends(get_db),
    user: User = Depends(require_analyst)
):
    """Import IOCs from CSV or JSON file."""
    content_bytes = await file.read()
    content_text = content_bytes.decode("utf-8", errors="replace")
    added = import_iocs(db, content_text, provenance=provenance, author_username=user.username)
    return {"status": "success", "imported_count": added}

@router.get("/iocs/export/csv")
def export_iocs(
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """Export all local IOCs as CSV."""
    csv_text = export_iocs_csv(db)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=krythos_iocs_export.csv"}
    )

@router.get("/attack-matrix", response_model=List[AttackMatrixTechnique])
def get_mitre_attack_matrix(
    db: Session = Depends(get_db),
    _: User = Depends(require_viewer)
):
    """Return ATT&CK coverage matrix mapped from implemented detection rules."""
    initialize_default_rules(db)
    rules = db.query(DetectionRule).all()

    matrix_map = {}
    for r in rules:
        if r.mitre_attack_id:
            tech_id = r.mitre_attack_id
            if tech_id not in matrix_map:
                matrix_map[tech_id] = {
                    "technique_id": tech_id,
                    "technique_name": r.mitre_technique or "Security Technique",
                    "tactic": r.mitre_tactic or "Detection",
                    "rules_count": 0,
                    "implemented": True,
                    "tested": True
                }
            matrix_map[tech_id]["rules_count"] += 1

    return list(matrix_map.values())
