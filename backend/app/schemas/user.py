from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from backend.app.models.user import UserRole
import re

EMAIL_REGEX = re.compile(r"^[\w\.\+\-]+@[\w\.\-]+\.[a-zA-Z0-9\-_]+$")

def validate_email_format(email: str) -> str:
    email_clean = email.strip().lower()
    if not EMAIL_REGEX.match(email_clean):
        raise ValueError("Invalid email address format.")
    return email_clean

class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: UserRole = UserRole.VIEWER
    is_active: bool = True

    @field_validator("email")
    @classmethod
    def check_email(cls, v):
        return validate_email_format(v)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

    @field_validator("email")
    @classmethod
    def check_email(cls, v):
        if v is not None:
            return validate_email_format(v)
        return v

class UserRead(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class UserRoleUpdate(BaseModel):
    role: UserRole
