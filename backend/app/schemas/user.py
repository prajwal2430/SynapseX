import datetime
import re
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole


class UserBase(BaseModel):
    """Shared base properties for a user."""
    full_name: str = Field(..., min_length=2, max_length=150, description="Full name of the user")
    email: str = Field(..., min_length=3, description="Unique email address")
    role: UserRole = Field(default=UserRole.INVESTIGATOR, description="Platform RBAC role")

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v_clean = v.strip().lower()
        if "@" not in v_clean or "." not in v_clean.split("@")[-1]:
            raise ValueError("Invalid email address format")
        return v_clean


class UserRegisterRequest(UserBase):
    """Request payload for user registration."""
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (min 8 characters, must contain letters and numbers)",
    )

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


class UserLoginRequest(BaseModel):
    """Request payload for user login."""
    email: str = Field(..., min_length=3, description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")


class UserResponse(UserBase):
    """Safe public user profile representation (no password hash)."""
    id: int
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
