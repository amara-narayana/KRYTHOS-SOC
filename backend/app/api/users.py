from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.schemas.user import UserRead, UserRoleUpdate
from backend.app.core.permissions import require_admin
from backend.app.services.user_service import get_users, update_user_role, toggle_user_active_status
from backend.app.core.exceptions import KrythosException

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserRead])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """List all user accounts (Administrator only)."""
    return get_users(db, skip=skip, limit=limit)

@router.put("/{user_id}/role", response_model=UserRead)
def change_role(
    user_id: int,
    payload: UserRoleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Change a user's role (Administrator only)."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        updated = update_user_role(db, user_id, payload, admin_user, ip_address=client_ip)
        return updated
    except KrythosException as e:
        raise HTTPException(status_code=400, detail=e.message)

@router.put("/{user_id}/status", response_model=UserRead)
def change_status(
    user_id: int,
    is_active: bool,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Activate or deactivate a user account (Administrator only)."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        updated = toggle_user_active_status(db, user_id, is_active, admin_user, ip_address=client_ip)
        return updated
    except KrythosException as e:
        raise HTTPException(status_code=400, detail=e.message)
