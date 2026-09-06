"""
Internal Service Authentication Security Module.
Restricts access to internal analytical endpoints to authorized backend services (NestJS).
"""
import logging
from typing import Optional
from fastapi import Header, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import settings

logger = logging.getLogger("synapsex.ai.security")
security_bearer = HTTPBearer(auto_error=False)


def verify_internal_auth(
    x_internal_service_key: Optional[str] = Header(None, alias="X-Internal-Service-Key"),
    bearer_auth: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
) -> bool:
    """
    Validates internal service credentials provided via:
    1. 'X-Internal-Service-Key' header
    2. 'Authorization: Bearer <secret>' header

    Rejects unauthenticated calls to ensure this service is never exposed to public users.
    """
    expected_key = settings.INTERNAL_SERVICE_KEY or settings.API_SECRET_KEY

    token: Optional[str] = None
    if x_internal_service_key:
        token = x_internal_service_key.strip()
    elif bearer_auth and bearer_auth.credentials:
        token = bearer_auth.credentials.strip()

    if not token or token != expected_key:
        logger.warning("[Security] Unauthorized attempt to access internal AI service endpoint.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing internal service credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return True
