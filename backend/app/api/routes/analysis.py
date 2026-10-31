"""
Analysis Routes for ADEIP AI Multi-Agent Intelligence Pipeline.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_active_user
from app.api.dependencies.database import get_db
from app.models.user import User
from app.schemas.analysis import (
    AnalysisJobListResponse,
    AnalysisJobResponse,
    AnalysisStartRequest,
)
from app.services.analysis_service import AnalysisService

# Router 1: Case-scoped analysis endpoints (/api/cases/{case_id}/analysis)
case_analysis_router = APIRouter(prefix="/cases", tags=["Case AI Analysis"])

# Router 2: Direct analysis job endpoints (/api/analysis/{analysis_id})
analysis_router = APIRouter(prefix="/analysis", tags=["AI Multi-Agent Intelligence"])


@case_analysis_router.post(
    "/{case_id}/analysis/start",
    response_model=AnalysisJobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start an AI Multi-Agent investigation run on a case",
)
def start_case_analysis(
    case_id: int,
    request: Request,
    body: Optional[AnalysisStartRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Initiates an AI Multi-Agent investigation pipeline on the specified case.

    Orchestrates the LangGraph multi-agent workflow across:
    - Chief Agent (Supervision & Scoping)
    - Evidence Agent (Entity Extraction & Mapping)
    - Timeline Agent (Chronological Sequencing)
    - Correlation Agent (Multi-Source Convergence)
    - Graph Agent (Knowledge Graph Topology)
    - Reasoning Agent (Evidence-Backed Findings)
    - Missing Evidence Agent (Gap Analysis & Recommendations)
    - Report Agent (Executive Briefing)

    Strict Compliance:
    - AI findings are grounded in evidence IDs and event IDs.
    - AI never automatically declares guilt.
    """
    client_ip = request.client.host if request.client else None
    focus_evidence = body.focus_evidence_ids if body else None
    notes = body.notes if body else None

    return AnalysisService.start_case_analysis(
        db=db,
        case_id=case_id,
        current_user=current_user,
        focus_evidence_ids=focus_evidence,
        notes=notes,
        client_ip=client_ip,
    )


@case_analysis_router.get(
    "/{case_id}/analysis",
    response_model=AnalysisJobListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all AI analysis runs for a case",
)
def list_case_analyses(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns historical AI Multi-Agent analysis runs for the case.
    """
    return AnalysisService.list_case_analyses(
        db=db,
        case_id=case_id,
        current_user=current_user,
    )


@case_analysis_router.get(
    "/{case_id}/analysis/status",
    status_code=status.HTTP_200_OK,
    summary="Get active/latest AI Multi-Agent analysis run status for a case",
)
def get_case_analysis_status(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves the execution status of the most recent AI multi-agent analysis for a case.
    """
    return AnalysisService.get_case_analysis_status(
        db=db,
        case_id=case_id,
        current_user=current_user,
    )



@analysis_router.get(
    "/{analysis_id}",
    response_model=AnalysisJobResponse,
    status_code=status.HTTP_200_OK,
    summary="Get detailed AI Multi-Agent analysis findings and graph state",
)
def get_analysis_job(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves full findings, recommendations, graph snapshot, and timeline
    for a specific multi-agent analysis execution.
    """
    return AnalysisService.get_analysis_job(
        db=db,
        analysis_id=analysis_id,
        current_user=current_user,
    )
