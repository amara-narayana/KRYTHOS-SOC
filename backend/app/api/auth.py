from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.auth import (
    BootstrapAdminRequest,
    RegisterRequest,
    LoginRequest,
    ChangePasswordRequest,
    Token
)
from backend.app.schemas.user import UserRead
from backend.app.services.auth_service import (
    is_system_bootstrapped,
    bootstrap_initial_admin,
    register_user,
    authenticate_user,
    change_user_password
)
from backend.app.core.permissions import get_current_user
from backend.app.models.user import User
from backend.app.core.exceptions import KrythosException

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/status")
def get_auth_status(db: Session = Depends(get_db)):
    """Check whether the platform has been bootstrapped with an initial Administrator."""
    bootstrapped = is_system_bootstrapped(db)
    return {
        "bootstrapped": bootstrapped,
        "registration_allowed": not bootstrapped or True  # can be controlled by policy
    }

@router.post("/bootstrap-admin", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def setup_first_admin(
    payload: BootstrapAdminRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """First-run administrator bootstrap. Permanently disabled after first admin is created."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        admin_user = bootstrap_initial_admin(db, payload, ip_address=client_ip)
        return admin_user
    except KrythosException as e:
        raise HTTPException(status_code=400, detail=e.message)

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user account with default Viewer role."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        user = register_user(db, payload, ip_address=client_ip)
        return user
    except KrythosException as e:
        raise HTTPException(status_code=400, detail=e.message)

@router.post("/login", response_model=Token)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Authenticate and receive a JWT session token."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        token, _ = authenticate_user(db, payload, ip_address=client_ip)
        return token
    except KrythosException as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)

@router.get("/me", response_model=UserRead)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get profile information for the authenticated user."""
    return current_user

@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user's password."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    try:
        change_user_password(db, current_user, payload, ip_address=client_ip)
        return {"message": "Password updated successfully."}
    except KrythosException as e:
        raise HTTPException(status_code=400, detail=e.message)
