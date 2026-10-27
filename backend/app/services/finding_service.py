"""
Finding & Reasoning Service for ADEIP.

Handles:
1. Executing the Reasoning Agent over structured investigation data.
2. Persisting grounded findings in the investigation_findings table.
3. Managing human-in-the-loop review actions (accepted_as_lead, rejected, needs_more_analysis).
4. Logging immutable audit trails for every reviewer decision.
"""
import datetime
import json
import logging
import math
import uuid
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.agents.correlation_agent import correlation_agent
from app.agents.reasoning_agent import reasoning_agent
from app.agents.timeline_agent import timeline_agent
from app.core.audit_actions import AuditAction, AuditResourceType
from app.models.case import InvestigationCase
from app.models.entity import ExtractedEntityModel
from app.models.evidence import Evidence
from app.models.finding import FindingReviewStatus, InvestigationFindingModel
from app.models.investigation_event import InvestigationEvent
from app.models.user import User
from app.schemas.finding import (
    FindingListResponse,
    FindingResponse,
    FindingReviewRequest,
    ReasoningOutput,
    ReasoningRunResultResponse,
)
from app.services.audit_service import AuditService

logger = logging.getLogger("adeip.services.finding")


class FindingService:
    """
    Forensic service managing AI reasoning runs and investigator finding reviews.
    """

    @classmethod
    def _to_finding_response(cls, model: InvestigationFindingModel) -> FindingResponse:
        """Converts an InvestigationFindingModel ORM instance to a validated Pydantic response."""
        reviewer_name = model.reviewer.full_name if model.reviewer else None

        obs = json.loads(model.observations) if model.observations else []
        hyps = json.loads(model.potential_hypotheses) if model.potential_hypotheses else []
        ev_ids = json.loads(model.supporting_evidence_ids) if model.supporting_evidence_ids else []
        event_ids = json.loads(model.supporting_event_ids) if model.supporting_event_ids else []
        alts = json.loads(model.alternative_explanations) if model.alternative_explanations else []
        recs = json.loads(model.recommended_verification) if model.recommended_verification else []
        lims = json.loads(model.limitations) if model.limitations else []
        classification_val = getattr(model, "classification", "INFERENCE") or "INFERENCE"
        related_entities_val = json.loads(model.related_entities) if getattr(model, "related_entities", None) else []

        return FindingResponse(
            id=model.id,
            finding_id=model.finding_id,
            case_id=model.case_id,
            title=model.title,
            category=model.category,
            classification=classification_val,
            related_entities=related_entities_val,
            confidence_score=model.confidence_score,
            summary=model.summary,
            observations=obs,
            potential_hypotheses=hyps,
            supporting_evidence_ids=ev_ids,
            supporting_event_ids=event_ids,
            alternative_explanations=alts,
            recommended_verification=recs,
            limitations=lims,
            review_status=model.review_status,
            reviewed_by=model.reviewed_by,
            reviewer_name=reviewer_name,
            reviewer_notes=model.reviewer_notes,
            reviewed_at=model.reviewed_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @classmethod
    def run_case_reasoning(
        cls,
        db: Session,
        case_id: int,
        current_user: User,
        client_ip: Optional[str] = None,
    ) -> ReasoningRunResultResponse:
        """
        Executes the Reasoning Agent on structured investigation data for a case,
        persists the findings in the database, and returns the formal 7-element reasoning output.
        """
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        # 1. Gather all structured case inputs
        evidence_items = list(db.scalars(select(Evidence).where(Evidence.case_id == case_id)).all())
        events_records = list(
            db.scalars(
                select(InvestigationEvent)
                .where(InvestigationEvent.case_id == case_id)
                .order_by(InvestigationEvent.timestamp.asc().nullslast(), InvestigationEvent.id.asc())
            ).all()
        )
        entities_records = list(
            db.scalars(select(ExtractedEntityModel).where(ExtractedEntityModel.case_id == case_id)).all()
        )

        evidence_dicts = [
            {
                "id": ev.id,
                "original_filename": ev.original_filename,
                "sha256_hash": ev.sha256_hash,
                "integrity_status": ev.integrity_status.value,
            }
            for ev in evidence_items
        ]
        raw_events = [
            {
                "id": ev.id,
                "evidence_id": ev.evidence_id,
                "source": ev.source,
                "event_type": ev.event_type.value,
                "timestamp": ev.timestamp.isoformat() if ev.timestamp else None,
                "entity_type": ev.entity_type,
                "entity_value": ev.entity_value,
                "metadata": json.loads(ev.event_metadata) if ev.event_metadata else None,
            }
            for ev in events_records
        ]
        extracted_entities = [
            {
                "id": ent.id,
                "entity_type": ent.entity_type.value,
                "entity_value": ent.entity_value,
                "normalized_value": ent.normalized_value,
                "evidence_id": ent.evidence_id,
                "event_id": ent.event_id,
                "event_ids": [ent.event_id] if ent.event_id else [],
                "confidence": ent.confidence,
            }
            for ent in entities_records
        ]

        # 2. Build mock state and run upstream timeline & correlation agents
        mock_state = {
            "case_id": case_id,
            "evidence_ids": [ev.id for ev in evidence_items],
            "case_info": {"id": case.id, "title": case.title},
            "evidence_items": evidence_dicts,
            "raw_events": raw_events,
            "extracted_entities": extracted_entities,
            "agent_logs": [],
        }

        timeline_res = timeline_agent(mock_state)
        mock_state["timeline"] = timeline_res.get("timeline", [])

        corr_res = correlation_agent(mock_state)
        mock_state["correlations"] = corr_res.get("correlations", [])

        # 3. Execute Reasoning Agent
        reasoning_res = reasoning_agent(mock_state)
        reasoning_data = reasoning_res.get("reasoning_output", {})
        raw_findings = reasoning_res.get("findings", [])

        # 4. Persist findings to database (clean up older pending findings on new reasoning run)
        from sqlalchemy import delete
        db.execute(
            delete(InvestigationFindingModel).where(
                InvestigationFindingModel.case_id == case_id,
                InvestigationFindingModel.review_status == FindingReviewStatus.PENDING_REVIEW,
            )
        )
        db.flush()

        new_models_saved: List[InvestigationFindingModel] = []
        for idx, item in enumerate(raw_findings, start=1):
            fnd_id = item.get("finding_id") or f"FND-{case_id}-{uuid.uuid4().hex[:6].upper()}"
            cls_val = item.get("classification", "INFERENCE")
            rel_ents_val = item.get("related_entities", [])

            finding_model = InvestigationFindingModel(
                finding_id=fnd_id,
                case_id=case_id,
                title=item.get("title", f"Investigative Lead #{idx}"),
                category=item.get("category", "reasoning_lead"),
                classification=cls_val,
                related_entities=json.dumps(rel_ents_val) if rel_ents_val else None,
                confidence_score=item.get("confidence", 0.85),
                summary=item.get("description") or reasoning_data.get("summary", ""),
                observations=json.dumps(reasoning_data.get("observations", [])),
                potential_hypotheses=json.dumps(reasoning_data.get("potential_hypotheses", [])),
                supporting_evidence_ids=json.dumps(item.get("referenced_evidence_ids", [ev.id for ev in evidence_items])),
                supporting_event_ids=json.dumps(item.get("referenced_event_ids", [e.id for e in events_records[:10]])),
                alternative_explanations=json.dumps(reasoning_data.get("alternative_explanations", [])),
                recommended_verification=json.dumps(reasoning_data.get("recommended_verification", [])),
                limitations=json.dumps(reasoning_data.get("limitations", [])),
                review_status=FindingReviewStatus.PENDING_REVIEW,
            )
            db.add(finding_model)
            new_models_saved.append(finding_model)

        db.commit()

        # 5. Log Audit Event
        AuditService.log(
            db=db,
            action=AuditAction.ANALYSIS_COMPLETED,
            resource_type=AuditResourceType.CASE,
            user_id=current_user.id,
            resource_id=str(case_id),
            details={
                "action": "reasoning_run",
                "case_id": case_id,
                "findings_generated": len(new_models_saved),
            },
            ip_address=client_ip,
            flush=True,
        )

        all_findings = list(
            db.scalars(
                select(InvestigationFindingModel)
                .where(InvestigationFindingModel.case_id == case_id)
                .order_by(InvestigationFindingModel.created_at.desc())
            ).all()
        )

        return ReasoningRunResultResponse(
            case_id=case_id,
            findings_generated=len(new_models_saved),
            reasoning_output=ReasoningOutput(**reasoning_data),
            findings=[cls._to_finding_response(m) for m in all_findings],
        )

    @classmethod
    def list_case_findings(
        cls,
        db: Session,
        case_id: int,
        review_status: Optional[str] = None,
        category: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> FindingListResponse:
        """Retrieves paginated, filtered findings for a case."""
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        stmt = select(InvestigationFindingModel).where(InvestigationFindingModel.case_id == case_id)
        if review_status:
            stmt = stmt.where(InvestigationFindingModel.review_status == review_status.strip().lower())
        if category:
            stmt = stmt.where(InvestigationFindingModel.category == category.strip().lower())

        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        offset = (max(1, page) - 1) * page_size
        items = list(
            db.scalars(
                stmt.order_by(InvestigationFindingModel.created_at.desc())
                .offset(offset)
                .limit(page_size)
            ).all()
        )

        return FindingListResponse(
            case_id=case_id,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total > 0 else 0,
            items=[cls._to_finding_response(m) for m in items],
        )

    @classmethod
    def review_finding(
        cls,
        db: Session,
        finding_id_str: str,
        review_in: FindingReviewRequest,
        current_user: User,
        client_ip: Optional[str] = None,
    ) -> FindingResponse:
        """
        Updates the human-in-the-loop review status of an AI finding
        (accepted_as_lead, rejected, needs_more_analysis) and records an audit log.
        """
        finding = db.scalars(
            select(InvestigationFindingModel).where(
                (InvestigationFindingModel.finding_id == finding_id_str) |
                (InvestigationFindingModel.id == (int(finding_id_str) if finding_id_str.isdigit() else -1))
            )
        ).first()

        if not finding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation finding '{finding_id_str}' not found.",
            )

        old_status = finding.review_status.value
        now_utc = datetime.datetime.now(datetime.timezone.utc)

        finding.review_status = review_in.action
        finding.reviewed_by = current_user.id
        finding.reviewer_notes = review_in.notes
        finding.reviewed_at = now_utc

        db.flush()

        # Log audit trail
        AuditService.log(
            db=db,
            action=AuditAction.FINDING_REVIEWED,
            resource_type=AuditResourceType.FINDING,
            user_id=current_user.id,
            resource_id=finding.finding_id,
            details={
                "case_id": finding.case_id,
                "finding_id": finding.finding_id,
                "previous_status": old_status,
                "new_status": review_in.action.value,
                "reviewer_notes": review_in.notes,
            },
            ip_address=client_ip,
            flush=True,
        )

        db.commit()
        db.refresh(finding)

        logger.info(
            f"[FindingService] Finding {finding.finding_id} reviewed by {current_user.email} -> {review_in.action.value}"
        )

        return cls._to_finding_response(finding)
