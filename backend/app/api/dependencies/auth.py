import logging
from typing import Optional
from fastapi import Depends, HTTPException, Query, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies.database import get_db
from app.core.config import settings
from app.models.user import User, UserRole
from app.security.jwt import decode_access_token
from app.services.auth_service import AuthService

logger = logging.getLogger("adeip.auth")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    query_token: Optional[str] = Query(None, alias="token"),
    db: Session = Depends(get_db),
) -> User:
    """
    Extracts, verifies, and resolves the authenticated User.
    Accepts JWT token from Authorization header or URL query parameter (?token=...).
    In development mode, gracefully falls back to the default seeded investigator
    if no token is provided, ensuring seamless browser media streaming and dev workflows.
    """
    effective_token = token or query_token

    if effective_token:
        payload = decode_access_token(effective_token)
        if payload:
            user_id_str: str = payload.get("sub")
            if user_id_str:
                try:
                    user_id = int(user_id_str)
                    user = AuthService.get_by_id(db, user_id=user_id)
                    if user and user.is_active:
                        return user
                except (ValueError, TypeError):
                    pass

    # If token was invalid, or no token provided:
    if settings.APP_ENV == "development" or settings.DEBUG:
        # Fallback to default lead analyst for seamless dev / direct browser media streaming
        dev_user = db.scalars(
            select(User).where(User.email == "analyst@adeip.local", User.is_active == True)
        ).first()
        if dev_user:
            return dev_user
        # Or any active investigator/admin
        fallback_user = db.scalars(select(User).where(User.is_active == True)).first()
        if fallback_user:
            return fallback_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensures that the authenticated user account is marked active.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return current_user
