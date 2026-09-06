"""
API v1 Router aggregation.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import health, analysis, agents, graph

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(agents.router, prefix="/agents", tags=["Agents"])
api_router.include_router(graph.router, prefix="/graph", tags=["Knowledge Graph"])
