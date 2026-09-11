"""
Health check endpoints for SynapseX AI Service.
"""
from fastapi import APIRouter
from app.core.neo4j import Neo4jClient
from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="Basic service health check")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }


@router.get("/health/readiness", summary="Deep dependency health check (Neo4j, etc.)")
async def readiness_check():
    neo4j_status = Neo4jClient.check_health()
    is_ready = neo4j_status.get("status") in ["connected", "unavailable"]

    return {
        "status": "ready" if is_ready else "not_ready",
        "dependencies": {
            "neo4j": neo4j_status,
        },
    }
