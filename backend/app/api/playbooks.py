from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.core.permissions import require_viewer, require_analyst, require_admin
from backend.app.services.playbook_service import (
    execute_block_ip,
    execute_isolate_host,
    execute_lockout_user,
    execute_sweep_iocs
)

router = APIRouter(prefix="/playbooks", tags=["Playbooks"])

class BlockIPRequest(BaseModel):
    ip: str = Field(..., description="Target IPv4 or IPv6 address to drop")
    reason: str = Field(default="Analyst incident mitigation", description="Operational justification")

class IsolateHostRequest(BaseModel):
    host: str = Field(..., description="Target hostname or IP to isolate")
    reason: str = Field(default="Active incident containment", description="Operational justification")

class LockoutUserRequest(BaseModel):
    username: str = Field(..., description="Target username to suspend")
    reason: str = Field(default="Compromised credentials detected", description="Operational justification")

@router.get("/list")
def list_available_playbooks(_: User = Depends(require_viewer)):
    """Returns the catalog of production incident response playbooks."""
    return [
        {
            "id": "perimeter_block",
            "title": "Boundary Firewall Blacklist",
            "category": "Perimeter",
            "description": "Applies real iptables/ufw/netsh drop rules to block external traffic and adds IP to Threat Intelligence IOC store.",
            "requires_role": "analyst",
            "endpoint": "/api/v1/playbooks/block-ip"
        },
        {
            "id": "host_isolate",
            "title": "Automated Host Isolation",
            "category": "Containment",
            "description": "Applies real kernel network containment rules dropping all traffic except SOC Web UI (8000) and SSH (22).",
            "requires_role": "admin",
            "endpoint": "/api/v1/playbooks/isolate-host"
        },
        {
            "id": "cred_lockdown",
            "title": "Compromised Account Lockdown",
            "category": "Identity",
            "description": "Instantly suspends user in KRYTHOS database, revokes active tokens, and executes OS user lockout.",
            "requires_role": "analyst",
            "endpoint": "/api/v1/playbooks/lockout-user"
        },
        {
            "id": "ioc_sweep",
            "title": "Retrospective IOC Sweep",
            "category": "Forensics",
            "description": "Executes real historical database query against all ingested security events matching active IOCs.",
            "requires_role": "viewer",
            "endpoint": "/api/v1/playbooks/sweep-iocs"
        }
    ]

@router.post("/block-ip")
def block_ip(
    payload: BlockIPRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Execute live firewall IP block and record threat indicator."""
    try:
        return execute_block_ip(payload.ip, payload.reason, db, current_user.username)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firewall execution failed: {str(e)}")

@router.post("/isolate-host")
def isolate_host(
    payload: IsolateHostRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Execute live kernel network isolation."""
    try:
        return execute_isolate_host(payload.host, payload.reason, db, current_user.username)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Host isolation failed: {str(e)}")

@router.post("/lockout-user")
def lockout_user(
    payload: LockoutUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Suspend user account across SOC platform and host operating system."""
    try:
        return execute_lockout_user(payload.username, payload.reason, db, current_user.username)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Account lockout failed: {str(e)}")

@router.post("/sweep-iocs")
def sweep_iocs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer)
):
    """Execute live retrospective sweep across all telemetry for IOC correlations."""
    try:
        return execute_sweep_iocs(db, current_user.username)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IOC sweep failed: {str(e)}")
