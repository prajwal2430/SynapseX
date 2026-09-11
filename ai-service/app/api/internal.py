"""
Internal Analytical API Endpoints for SynapseX AI Service.
Exclusively handles AI agents, LangGraph workflows, evidence analysis, entity extraction,
timeline analysis, correlation analysis, reasoning, and recommendations.

All endpoints are protected by internal service authentication and are not exposed directly to users.
"""
import datetime
import logging
import platform
import time
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status

from app.core.security import verify_internal_auth
from app.core.config import settings
from app.schemas.analysis import (
    EvidenceAnalysisRequest,
    EvidenceAnalysisResponse,
    TimelineAnalysisRequest,
    TimelineAnalysisResponse,
    CorrelationAnalysisRequest,
    CorrelationAnalysisResponse,
    InvestigationRequest,
    InvestigationResponse,
    HealthResponse,
)
from app.agents.evidence_agent import evidence_agent
from app.agents.timeline_agent import timeline_agent
from app.agents.correlation_agent import correlation_agent, _DISCLAIMER
from app.agents.graph import run_investigation
from app.agents.state import ExtractedEntity, TimelineEntry, CorrelationItem

logger = logging.getLogger("synapsex.ai.internal")

router = APIRouter(
    prefix="/internal",
    tags=["Internal AI & Analytical Services"],
    dependencies=[Depends(verify_internal_auth)],
)


# ==============================================================================
# 1. POST /internal/analyze/evidence
# ==============================================================================

@router.post(
    "/analyze/evidence",
    response_model=EvidenceAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract and normalize structured entities from evidence metadata and content",
)
async def analyze_evidence(request: EvidenceAnalysisRequest) -> EvidenceAnalysisResponse:
    start_time = time.perf_counter()
    logger.info(
        f"[InternalAPI] Analyzing evidence '{request.evidence_id}' for Case #{request.case_id} ({request.file_name})"
    )

    # Construct initial state for evidence_agent
    evidence_item = {
        "id": request.evidence_id,
        "filename": request.file_name,
        "mime_type": request.mime_type,
        "metadata": request.metadata,
        "content_text": request.content_text or "",
    }

    state = {
        "case_id": request.case_id,
        "evidence_items": [evidence_item],
        "raw_events": request.raw_events,
        "agent_logs": [],
        "errors": [],
    }

    # Execute deterministic evidence agent
    updates = evidence_agent(state)
    raw_entities = updates.get("extracted_entities", [])

    # Compute type-wise counts
    entity_counts: Dict[str, int] = {}
    validated_entities: List[ExtractedEntity] = []

    for item in raw_entities:
        e_type = item.get("entity_type", "unknown")
        entity_counts[e_type] = entity_counts.get(e_type, 0) + 1
        validated_entities.append(ExtractedEntity(**item))

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return EvidenceAnalysisResponse(
        case_id=str(request.case_id),
        evidence_id=str(request.evidence_id),
        file_name=request.file_name,
        entities=validated_entities,
        entity_counts=entity_counts,
        total_entities=len(validated_entities),
        execution_time_ms=duration_ms,
    )


# ==============================================================================
# 2. POST /internal/analyze/timeline
# ==============================================================================

@router.post(
    "/analyze/timeline",
    response_model=TimelineAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Sequentially reconstruct, UTC-normalize, and cluster investigation events",
)
async def analyze_timeline(request: TimelineAnalysisRequest) -> TimelineAnalysisResponse:
    start_time = time.perf_counter()
    logger.info(
        f"[InternalAPI] Reconstructing chronological timeline for Case #{request.case_id} ({len(request.events)} events)"
    )

    state = {
        "case_id": request.case_id,
        "raw_events": request.events,
        "window_seconds": request.window_seconds,
        "agent_logs": [],
        "errors": [],
    }

    # Execute deterministic timeline agent
    updates = timeline_agent(state)
    raw_timeline = updates.get("timeline", [])
    clusters = updates.get("timeline_clusters") or updates.get("time_clusters") or []

    validated_timeline: List[TimelineEntry] = []
    for item in raw_timeline:
        validated_timeline.append(
            TimelineEntry(
                event_id=item.get("event_id"),
                evidence_id=item.get("evidence_id"),
                timestamp=item.get("timestamp"),
                source=item.get("source"),
                event_type=item.get("event_type", "event"),
                description=item.get("description", ""),
                entities=item.get("entities", []),
            )
        )

    # Compute temporal boundary range
    temporal_range: Dict[str, Any] = {
        "start": validated_timeline[0].timestamp if validated_timeline else None,
        "end": validated_timeline[-1].timestamp if validated_timeline else None,
        "total_clusters": len(clusters),
    }

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return TimelineAnalysisResponse(
        case_id=str(request.case_id),
        timeline=validated_timeline,
        clusters=clusters,
        total_events=len(validated_timeline),
        temporal_range=temporal_range,
        execution_time_ms=duration_ms,
    )


# ==============================================================================
# 3. POST /internal/analyze/correlation
# ==============================================================================

@router.post(
    "/analyze/correlation",
    response_model=CorrelationAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Identify explainable multi-signal correlation links across entities and events",
)
async def analyze_correlation(request: CorrelationAnalysisRequest) -> CorrelationAnalysisResponse:
    start_time = time.perf_counter()
    logger.info(
        f"[InternalAPI] Evaluating correlation signals for Case #{request.case_id} "
        f"({len(request.extracted_entities)} entities, {len(request.timeline)} timeline events)"
    )

    state = {
        "case_id": request.case_id,
        "extracted_entities": request.extracted_entities,
        "timeline": request.timeline,
        "raw_events": request.raw_events,
        "agent_logs": [],
        "errors": [],
    }

    # Execute deterministic correlation agent
    updates = correlation_agent(state)
    raw_correlations = updates.get("correlations", [])

    validated_correlations: List[CorrelationItem] = []
    high_confidence_count = 0

    for item in raw_correlations:
        corr = CorrelationItem(**item)
        if corr.correlation_score >= 0.8:
            high_confidence_count += 1
        validated_correlations.append(corr)

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return CorrelationAnalysisResponse(
        case_id=str(request.case_id),
        correlations=validated_correlations,
        total_correlations=len(validated_correlations),
        high_confidence_count=high_confidence_count,
        disclaimer=_DISCLAIMER,
        execution_time_ms=duration_ms,
    )


# ==============================================================================
# 4. POST /internal/investigate
# ==============================================================================

@router.post(
    "/investigate",
    response_model=InvestigationResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute complete end-to-end LangGraph multi-agent forensic investigation workflow",
)
async def investigate_case(request: InvestigationRequest) -> InvestigationResponse:
    start_time = time.perf_counter()
    logger.info(
        f"[InternalAPI] Launching full LangGraph investigation for Case #{request.case_id} "
        f"({len(request.evidence_items)} evidence files, {len(request.raw_events)} events)"
    )

    initial_state = {
        "case_id": request.case_id,
        "evidence_ids": [ev.get("id") for ev in request.evidence_items if ev.get("id")],
        "case_info": request.case_info,
        "evidence_items": request.evidence_items,
        "raw_events": request.raw_events,
        "agent_logs": [],
        "errors": [],
    }

    # Execute the compiled multi-agent LangGraph workflow
    final_state = run_investigation(initial_state)

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return InvestigationResponse(
        case_id=str(request.case_id),
        status=final_state.get("status", "completed"),
        extracted_entities=final_state.get("extracted_entities", []),
        timeline=final_state.get("timeline", []),
        correlations=final_state.get("correlations", []),
        graph=final_state.get("graph", {"nodes": [], "edges": []}),
        findings=final_state.get("findings", []),
        recommendations=final_state.get("recommendations", []),
        report_summary=final_state.get("report_summary"),
        agent_logs=final_state.get("agent_logs", []),
        errors=final_state.get("errors", []),
        execution_time_ms=duration_ms,
    )


# ==============================================================================
# 5. GET /internal/health
# ==============================================================================

@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Internal service health and dependency diagnostic check",
)
async def internal_health_check() -> HealthResponse:
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    dependencies = {
        "python": platform.python_version(),
        "framework": "FastAPI",
        "orchestrator": "LangGraph",
        "authentication": "Active",
    }

    return HealthResponse(
        service=settings.APP_NAME,
        status="healthy",
        version="1.0.0",
        timestamp=now_iso,
        dependencies=dependencies,
    )
