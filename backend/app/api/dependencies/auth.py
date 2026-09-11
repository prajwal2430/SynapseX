from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.api.dependencies.database import get_db
from app.models.user import User
from app.security.jwt import decode_access_token
from app.services.auth_service import AuthService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Reusable FastAPI dependency to extract, verify, and resolve the authenticated User.
    Accepts JWT token via Authorization Bearer header OR ?token= query parameter
    for direct browser viewing and downloads.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    resolved_token = token or request.query_params.get("token")
    if not resolved_token:
        raise credentials_exception

    payload = decode_access_token(resolved_token)
    if not payload:
        raise credentials_exception

    user_id_str: str = payload.get("sub")
    if not user_id_str:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception

    user = AuthService.get_by_id(db, user_id=user_id)
    if not user or not user.is_active:
        raise credentials_exception

    return user


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
