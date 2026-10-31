"""
Analysis Service.

Orchestrates AI Multi-Agent investigations on cases:
1. Loads case metadata, registered evidence, and normalized events.
2. Initializes the shared InvestigationState.
3. Invokes the LangGraph intelligence pipeline (chief -> evidence -> timeline -> correlation -> graph -> reasoning -> missing_evidence -> report).
4. Persists the resulting snapshot, findings, recommendations, and graph in AnalysisJob.
5. Records chain-of-custody and audit events.
"""
import datetime
import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.graph import run_investigation
from app.agents.state import InvestigationState
from app.core.audit_actions import AuditAction, AuditResourceType
from app.models.analysis import AnalysisJob, AnalysisStatus
from app.models.case import InvestigationCase
from app.models.custody import CustodyAction
from app.models.evidence import Evidence
from app.models.investigation_event import InvestigationEvent
from app.models.user import User
from app.schemas.analysis import (
    AnalysisJobListResponse,
    AnalysisJobResponse,
    AnalysisStartResponse,
)
from app.services.audit_service import AuditService
from app.services.custody_service import CustodyService

logger = logging.getLogger("adeip.services.analysis")


class AnalysisService:
    """
    Forensic analysis service coordinating AI multi-agent investigations.
    """

    @classmethod
    def _to_job_response(cls, job: AnalysisJob) -> AnalysisJobResponse:
        """Converts an AnalysisJob ORM instance and its JSON snapshot into a validated response."""
        requester_name = job.requester.full_name if job.requester else "System"

        findings = []
        recommendations = []
        extracted_entities = []
        correlations = []
        timeline = []
        graph = None
        report_summary = None
        agent_logs = []

        if job.state_snapshot:
            try:
                snap = json.loads(job.state_snapshot)
                findings = snap.get("findings", [])
                recommendations = snap.get("recommendations", [])
                extracted_entities = snap.get("extracted_entities", [])
                correlations = snap.get("correlations", [])
                timeline = snap.get("timeline", [])
                graph = snap.get("graph")
                report_summary = snap.get("report_summary")
                agent_logs = snap.get("agent_logs", [])
            except Exception as exc:
                logger.error(f"Failed to deserialize state_snapshot for AnalysisJob #{job.id}: {exc}")

        return AnalysisJobResponse(
            id=job.id,
            case_id=job.case_id,
            requested_by=job.requested_by,
            requester_name=requester_name,
            status=job.status,
            summary=job.summary,
            error_message=job.error_message,
            findings=findings,
            recommendations=recommendations,
            extracted_entities=extracted_entities,
            correlations=correlations,
            timeline=timeline,
            graph=graph,
            report_summary=report_summary,
            agent_logs=agent_logs,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at,
        )

    @classmethod
    def start_case_analysis(
        cls,
        db: Session,
        case_id: int,
        current_user: User,
        focus_evidence_ids: Optional[List[int]] = None,
        notes: Optional[str] = None,
        client_ip: Optional[str] = None,
    ) -> AnalysisJobResponse:
        """
        Launches an AI Multi-Agent analysis execution for the specified case.
        """
        # 1. Verify Case exists
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        now_utc = datetime.datetime.now(datetime.timezone.utc)

        # 2. Fetch Evidence artifacts
        ev_stmt = select(Evidence).where(Evidence.case_id == case_id)
        if focus_evidence_ids:
            ev_stmt = ev_stmt.where(Evidence.id.in_(focus_evidence_ids))
        evidence_items = list(db.scalars(ev_stmt).all())
        evidence_ids = [e.id for e in evidence_items]

        # 3. Fetch normalized Investigation Events
        raw_events_stmt = select(InvestigationEvent).where(InvestigationEvent.case_id == case_id)
        if evidence_ids:
            raw_events_stmt = raw_events_stmt.where(InvestigationEvent.evidence_id.in_(evidence_ids))
        raw_events_records = list(db.scalars(raw_events_stmt).all())

        # Serialize inputs for the LangGraph agent pipeline
        evidence_dicts = [
            {
                "id": ev.id,
                "evidence_number": ev.evidence_number,
                "original_filename": ev.original_filename,
                "mime_type": ev.mime_type,
                "file_size": ev.file_size,
                "sha256_hash": ev.sha256_hash,
                "processing_status": ev.processing_status.value,
                "integrity_status": ev.integrity_status.value,
            }
            for ev in evidence_items
        ]

        raw_event_dicts = [
            {
                "id": e.id,
                "evidence_id": e.evidence_id,
                "event_type": e.event_type.value,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                "source": e.source,
                "entity_type": e.entity_type,
                "entity_value": e.entity_value,
                "metadata": json.loads(e.event_metadata) if e.event_metadata else None,
            }
            for e in raw_events_records
        ]

        # 4. Create initial AnalysisJob DB record
        analysis_job = AnalysisJob(
            case_id=case_id,
            requested_by=current_user.id,
            status=AnalysisStatus.RUNNING,
            started_at=now_utc,
        )
        db.add(analysis_job)
        db.flush()

        # 5. Log Audit and Custody events for analysis kickoff
        AuditService.log(
            db=db,
            action=AuditAction.ANALYSIS_STARTED,
            resource_type=AuditResourceType.CASE,
            user_id=current_user.id,
            resource_id=str(case_id),
            details={
                "analysis_job_id": analysis_job.id,
                "case_id": case_id,
                "evidence_count": len(evidence_ids),
                "events_count": len(raw_event_dicts),
                "notes": notes,
            },
            ip_address=client_ip,
            flush=True,
        )

        for ev_id in evidence_ids:
            CustodyService.record_event(
                db=db,
                evidence_id=ev_id,
                action=CustodyAction.ANALYSIS_REQUESTED,
                actor_id=current_user.id,
                details={"analysis_job_id": analysis_job.id, "orchestrator": "LangGraph"},
                flush=True,
            )

        # 6. Initialize shared InvestigationState
        initial_state: InvestigationState = {
            "case_id": case_id,
            "evidence_ids": evidence_ids,
            "event_ids": [e["id"] for e in raw_event_dicts if "id" in e],
            "case_info": {
                "id": case.id,
                "case_number": case.case_number,
                "title": case.title,
                "description": case.description,
                "priority": case.priority.value,
                "status": case.status.value,
            },
            "evidence_items": evidence_dicts,
            "raw_events": raw_event_dicts,
            "extracted_entities": [],
            "timeline": [],
            "correlations": [],
            "graph": {},
            "findings": [],
            "recommendations": [],
            "report_summary": None,
            "agent_logs": [],
            "errors": [],
            "status": "started",
        }

        # 7. Execute LangGraph multi-agent orchestration
        try:
            final_state = run_investigation(initial_state)
            completed_utc = datetime.datetime.now(datetime.timezone.utc)

            report_summary = final_state.get("report_summary", {})
            summary_text = report_summary.get("executive_summary") if isinstance(report_summary, dict) else None

            analysis_job.status = AnalysisStatus.COMPLETED
            analysis_job.summary = summary_text
            analysis_job.state_snapshot = json.dumps(final_state)
            analysis_job.completed_at = completed_utc

            # Log audit completion
            AuditService.log(
                db=db,
                action=AuditAction.ANALYSIS_COMPLETED,
                resource_type=AuditResourceType.CASE,
                user_id=current_user.id,
                resource_id=str(case_id),
                details={
                    "analysis_job_id": analysis_job.id,
                    "findings_count": len(final_state.get("findings", [])),
                    "recommendations_count": len(final_state.get("recommendations", [])),
                    "status": "completed",
                },
                ip_address=client_ip,
                flush=True,
            )

        except Exception as exc:
            logger.error(f"Analysis job #{analysis_job.id} failed: {exc}", exc_info=True)
            analysis_job.status = AnalysisStatus.FAILED
            analysis_job.error_message = f"Multi-agent analysis failed: {type(exc).__name__}"
            analysis_job.completed_at = datetime.datetime.now(datetime.timezone.utc)

        db.commit()
        db.refresh(analysis_job)

        return cls._to_job_response(analysis_job)

    @classmethod
    def get_analysis_job(cls, db: Session, analysis_id: int, current_user: User) -> AnalysisJobResponse:
        """Retrieves a specific AnalysisJob by ID."""
        job = db.scalars(select(AnalysisJob).where(AnalysisJob.id == analysis_id)).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis job #{analysis_id} not found.",
            )
        return cls._to_job_response(job)

    @classmethod
    def list_case_analyses(cls, db: Session, case_id: int, current_user: User) -> AnalysisJobListResponse:
        """Lists all analysis jobs for a given case."""
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        jobs = list(
            db.scalars(
                select(AnalysisJob)
                .where(AnalysisJob.case_id == case_id)
                .order_by(AnalysisJob.created_at.desc())
            ).all()
        )

        return AnalysisJobListResponse(
            case_id=case_id,
            total=len(jobs),
            items=[cls._to_job_response(j) for j in jobs],
        )

    @classmethod
    def get_case_analysis_status(cls, db: Session, case_id: int, current_user: User) -> Dict[str, Any]:
        """Returns the latest analysis execution status and metrics for a case."""
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        latest_job = db.scalars(
            select(AnalysisJob)
            .where(AnalysisJob.case_id == case_id)
            .order_by(AnalysisJob.created_at.desc())
        ).first()

        if not latest_job:
            return {
                "case_id": case_id,
                "status": "idle",
                "latest_analysis_id": None,
                "message": "No AI analysis run has been executed for this case yet.",
                "completed_at": None,
            }

        return {
            "case_id": case_id,
            "status": latest_job.status.value,
            "latest_analysis_id": latest_job.id,
            "error_message": latest_job.error_message,
            "created_at": latest_job.created_at.isoformat() if latest_job.created_at else None,
            "completed_at": latest_job.completed_at.isoformat() if latest_job.completed_at else None,
        }

