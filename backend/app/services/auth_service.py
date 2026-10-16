from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.config import settings
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    auth_rate_limiter
)
from backend.app.core.exceptions import (
    AuthenticationError,
    DuplicateEntityError,
    ValidationError,
    PermissionDeniedError
)
from backend.app.models.user import User, UserRole
from backend.app.schemas.auth import (
    RegisterRequest,
    BootstrapAdminRequest,
    LoginRequest,
    ChangePasswordRequest,
    Token
)
from backend.app.schemas.user import UserRead
from backend.app.services.audit_service import record_audit

def is_system_bootstrapped(db: Session) -> bool:
    """Return True if at least one Administrator exists in the system."""
    admin_count = db.query(User).filter(User.role == UserRole.ADMINISTRATOR).count()
    return admin_count > 0

def bootstrap_initial_admin(
    db: Session,
    request: BootstrapAdminRequest,
    ip_address: Optional[str] = None
) -> User:
    """Controlled one-time bootstrap workflow for the first Administrator."""
    if is_system_bootstrapped(db):
        raise PermissionDeniedError("System is already bootstrapped. Initial administrator setup is permanently disabled.")

    # Check for duplicate username or email
    existing = db.query(User).filter(
        or_(User.username == request.username.lower(), User.email == request.email.lower())
    ).first()
    if existing:
        raise DuplicateEntityError("Username or email is already registered.")

    hashed_pw = hash_password(request.password)
    admin_user = User(
        username=request.username.lower(),
        email=request.email.lower(),
        full_name=request.full_name,
        hashed_password=hashed_pw,
        role=UserRole.ADMINISTRATOR,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    record_audit(
        db=db,
        username=admin_user.username,
        action="system.bootstrap_admin",
        user_id=admin_user.id,
        resource_type="user",
        resource_id=str(admin_user.id),
        ip_address=ip_address,
        details={"message": "First-run Administrator successfully bootstrapped"}
    )
    return admin_user

def register_user(
    db: Session,
    request: RegisterRequest,
    ip_address: Optional[str] = None
) -> User:
    """Public user registration."""
    # Ensure bootstrap has occurred
    if not is_system_bootstrapped(db):
        raise ValidationError("System has not been bootstrapped. Please complete the initial Administrator setup first.")

    # Check registration policy
    if settings.REGISTRATION_POLICY == "disabled":
        raise PermissionDeniedError("Public registration is disabled by administrator policy.")

    # Check duplicates
    existing = db.query(User).filter(
        or_(User.username == request.username.lower(), User.email == request.email.lower())
    ).first()
    if existing:
        raise DuplicateEntityError("A user with this username or email already exists.")

    hashed_pw = hash_password(request.password)
    # New registrations default to VIEWER role for safe access control
    new_user = User(
        username=request.username.lower(),
        email=request.email.lower(),
        full_name=request.full_name,
        hashed_password=hashed_pw,
        role=UserRole.VIEWER,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    record_audit(
        db=db,
        username=new_user.username,
        action="user.register",
        user_id=new_user.id,
        resource_type="user",
        resource_id=str(new_user.id),
        ip_address=ip_address,
        details={"email": new_user.email, "role": new_user.role.value}
    )
    return new_user

def authenticate_user(
    db: Session,
    request: LoginRequest,
    ip_address: Optional[str] = None
) -> Tuple[Token, User]:
    """Verify credentials and issue JWT token with rate limiting and audit logging."""
    identifier = request.username_or_email.strip().lower()
    rate_limit_key = f"{ip_address or '127.0.0.1'}:{identifier}"

    # Rate limiting check
    if not auth_rate_limiter.is_allowed(rate_limit_key):
        record_audit(
            db=db,
            username=identifier,
            action="user.login_rate_limited",
            ip_address=ip_address,
            details={"reason": "Excessive failed attempts"}
        )
        raise AuthenticationError("Too many login attempts. Please wait 60 seconds and try again.")

    user = db.query(User).filter(
        or_(User.username == identifier, User.email == identifier)
    ).first()

    if not user or not verify_password(request.password, user.hashed_password):
        record_audit(
            db=db,
            username=identifier,
            action="user.login_failed",
            ip_address=ip_address,
            details={"attempted_identifier": identifier}
        )
        raise AuthenticationError("Invalid username, email, or password.")

    if not user.is_active:
        raise PermissionDeniedError("Account is deactivated. Contact your administrator.")

    # Reset rate limiter on successful authentication
    auth_rate_limiter.reset(rate_limit_key)

    # Update last login time
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token_data = {
        "sub": user.username,
        "user_id": user.id,
        "role": user.role.value
    }
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_str = create_access_token(token_data, expires_delta=expires_delta)

    record_audit(
        db=db,
        username=user.username,
        action="user.login_success",
        user_id=user.id,
        resource_type="user",
        resource_id=str(user.id),
        ip_address=ip_address
    )

    token = Token(
        access_token=token_str,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user)
    )
    return token, user

def change_user_password(
    db: Session,
    user: User,
    request: ChangePasswordRequest,
    ip_address: Optional[str] = None
) -> None:
    """Verify current password and update to new Argon2id hash."""
    if not verify_password(request.current_password, user.hashed_password):
        raise AuthenticationError("Current password verification failed.")

    user.hashed_password = hash_password(request.new_password)
    user.updated_at = datetime.now(timezone.utc)
    db.commit()

    record_audit(
        db=db,
        username=user.username,
        action="user.password_change",
        user_id=user.id,
        resource_type="user",
        resource_id=str(user.id),
        ip_address=ip_address
    )
