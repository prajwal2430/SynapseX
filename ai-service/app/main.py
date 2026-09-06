"""
Main entry point for SynapseX AI Service.
Exclusively handles AI agents, LangGraph workflows, and analytical intelligence.
"""
from contextlib import asynccontextmanager
import datetime
import logging
import platform

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.neo4j import Neo4jClient
from app.api.v1.router import api_router
from app.api.internal import router as internal_router

setup_logging()
logger = logging.getLogger("synapsex.ai.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Attempt Neo4j driver connection with graceful fallback
    logger.info("Initializing SynapseX AI Service...")
    try:
        Neo4jClient.get_driver()
    except Exception as exc:
        logger.warning(f"Neo4j driver initialization deferred (offline/dev): {exc}")
    yield
    # Shutdown: Close connection pools
    logger.info("Shutting down SynapseX AI Service...")
    try:
        Neo4jClient.close()
    except Exception:
        pass


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Dedicated AI and Evidence Intelligence Service for SynapseX",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ------------------------------------------------------------------------------
# Security & Error Handling: Uniform Structured JSON Error Responses
# ------------------------------------------------------------------------------

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"[HTTPException] {request.method} {request.url.path} -> {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
            }
        },
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"[ValidationError] {request.method} {request.url.path} -> 422: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": 422,
                "message": "Request validation failed",
                "details": exc.errors(),
            }
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"[UnhandledException] {request.method} {request.url.path} -> 500: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": 500,
                "message": "Internal AI service error occurred",
            }
        },
    )


# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Internal Analytical Endpoints
app.include_router(internal_router)

# Register API v1 Router (graph queries and agent utilities)
app.include_router(api_router)


# ------------------------------------------------------------------------------
# Root & Health Endpoints
# ------------------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def root():
    return {
        "service": settings.APP_NAME,
        "status": "operational",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def public_health():
    return {
        "service": settings.APP_NAME,
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "python": platform.python_version(),
    }
