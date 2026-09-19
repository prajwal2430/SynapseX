import logging
from datetime import datetime, timezone
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.analysis import analysis_router, case_analysis_router
from app.api.routes.auth import router as auth_router
from app.api.routes.audit_logs import router as audit_logs_router
from app.api.routes.cases import router as cases_router
from app.api.routes.correlations import router as correlations_router
from app.api.routes.entities import case_entity_router, evidence_entity_router
from app.api.routes.evidence import case_evidence_router, evidence_router
from app.api.routes.findings import case_finding_router, finding_router
from app.api.routes.graph import router as graph_router
from app.api.routes.health import router as health_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.processing import router as processing_router
from app.api.routes.rbac_test import router as rbac_router
from app.api.routes.recommendations import router as recommendations_router
from app.api.routes.reports import case_report_router, report_router
from app.api.routes.simulation import router as simulation_router
from app.api.routes.timeline import router as timeline_router
from app.api.routes.websocket import router as websocket_router
from starlette.middleware.trustedhost import TrustedHostMiddleware

from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.security_headers import SecurityHeadersMiddleware
from app.database.mongodb import mongo_manager

# Configure structured logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s | %(levelname)-7s | %(name)s - %(message)s",
)
logger = logging.getLogger("adeip.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager:
    - Startup: Initializes MongoDB Motor connection and verifies connectivity.
    - Shutdown: Closes MongoDB connection pool cleanly.
    """
    # ── Startup Phase ────────────────────────────────────────────────────────
    logger.info("[Lifespan] Starting ADEIP backend application...")
    from app.database.migrate_evidence_columns import ensure_evidence_columns
    ensure_evidence_columns()
    await mongo_manager.connect_to_mongo()
    await mongo_manager.init_collection_indexes()

    yield

    # ── Shutdown Phase ───────────────────────────────────────────────────────
    logger.info("[Lifespan] Shutting down ADEIP backend application...")
    await mongo_manager.close_mongo_connection()
    logger.info("[Lifespan] Application shutdown complete.")


# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for ADEIP — AI-Assisted Digital Evidence Intelligence Platform",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# 1. Security Headers Middleware (OWASP recommended headers)
app.add_middleware(SecurityHeadersMiddleware)

# 2. Trusted Host Middleware (Host Header Injection defense)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

# 3. Cross-Origin Resource Sharing (CORS) with exposed headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all exception handler to ensure all uncaught server errors
    return a consistent JSON payload rather than crashing or leaking stack traces in prod.
    """
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred. Please try again later.",
            "path": request.url.path,
        },
    )


# Root Endpoint
@app.get("/", tags=["Root"], summary="Root API Index")
async def root():
    """
    Returns platform identity, API version, and documentation pointers.
    """
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.APP_ENV,
        "docs_url": "/docs",
        "health_check": "/api/health",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# Register API Routers
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(cases_router, prefix="/api")
app.include_router(case_evidence_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(processing_router, prefix="/api")
app.include_router(jobs_router, prefix="/api")
app.include_router(evidence_entity_router, prefix="/api")
app.include_router(case_entity_router, prefix="/api")
app.include_router(timeline_router, prefix="/api")
app.include_router(correlations_router, prefix="/api")
app.include_router(graph_router, prefix="/api")
app.include_router(case_finding_router, prefix="/api")
app.include_router(finding_router, prefix="/api")
app.include_router(recommendations_router, prefix="/api")
app.include_router(simulation_router, prefix="/api")
app.include_router(case_report_router, prefix="/api")
app.include_router(report_router, prefix="/api")
app.include_router(case_analysis_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(rbac_router, prefix="/api")
app.include_router(audit_logs_router, prefix="/api")

# Live Real-Time WebSockets (/ws/cases/{case_id})
app.include_router(websocket_router)






if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
