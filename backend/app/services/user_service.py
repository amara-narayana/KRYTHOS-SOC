from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.user import User, UserRole
from backend.app.schemas.user import UserUpdate, UserRoleUpdate
from backend.app.core.exceptions import EntityNotFoundError, PermissionDeniedError
from backend.app.services.audit_service import record_audit

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Retrieve paginated list of users."""
    return db.query(User).offset(skip).limit(limit).all()

def get_user_by_id(db: Session, user_id: int) -> User:
    """Retrieve user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise EntityNotFoundError("User", str(user_id))
    return user

def update_user_role(
    db: Session,
    target_user_id: int,
    role_update: UserRoleUpdate,
    admin_user: User,
    ip_address: Optional[str] = None
) -> User:
    """Administrator-controlled role modification."""
    user = get_user_by_id(db, target_user_id)
    
    # Prevent admin from demoting themselves if they are the only Administrator
    if user.id == admin_user.id and role_update.role != UserRole.ADMINISTRATOR:
        admin_count = db.query(User).filter(User.role == UserRole.ADMINISTRATOR).count()
        if admin_count <= 1:
            raise PermissionDeniedError("Cannot demote the sole Administrator in the system.")

    old_role = user.role.value
    user.role = role_update.role
    db.commit()
    db.refresh(user)

    record_audit(
        db=db,
        username=admin_user.username,
        action="user.role_change",
        user_id=admin_user.id,
        resource_type="user",
        resource_id=str(user.id),
        ip_address=ip_address,
        details={"target_username": user.username, "old_role": old_role, "new_role": user.role.value}
    )
    return user

def toggle_user_active_status(
    db: Session,
    target_user_id: int,
    is_active: bool,
    admin_user: User,
    ip_address: Optional[str] = None
) -> User:
    """Administrator-controlled account activation/deactivation."""
    user = get_user_by_id(db, target_user_id)
    
    # Prevent admin from deactivating their own account
    if user.id == admin_user.id and not is_active:
        raise PermissionDeniedError("Administrators cannot deactivate their own account.")

    user.is_active = is_active
    db.commit()
    db.refresh(user)

    action = "user.activated" if is_active else "user.deactivated"
    record_audit(
        db=db,
        username=admin_user.username,
        action=action,
        user_id=admin_user.id,
        resource_type="user",
        resource_id=str(user.id),
        ip_address=ip_address,
        details={"target_username": user.username}
    )
    return user
