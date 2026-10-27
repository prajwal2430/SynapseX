"""
Report Generation Service for ADEIP Forensic Intelligence.

Synthesizes the complete 12-section structured report, generates HTML/JSON artifacts,
and logs audit events for all generated reports.
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
from app.agents.missing_evidence_agent import missing_evidence_agent
from app.agents.reasoning_agent import reasoning_agent
from app.agents.report_agent import report_agent
from app.agents.timeline_agent import timeline_agent
from app.core.audit_actions import AuditAction, AuditResourceType
from app.models.case import InvestigationCase
from app.models.entity import ExtractedEntityModel
from app.models.evidence import Evidence
from app.models.finding import InvestigationFindingModel
from app.models.investigation_event import InvestigationEvent
from app.models.recommendation import InvestigationRecommendationModel
from app.models.report import InvestigationReportModel, ReportFormat
from app.models.user import User
from app.schemas.report import (
    ReportDetailResponse,
    ReportGenerateRequest,
    ReportListResponse,
    ReportResponse,
    StructuredReportData,
)
from app.services.audit_service import AuditService

logger = logging.getLogger("adeip.services.report")

_MANDATORY_DISCLAIMER = "AI-Assisted Draft — Requires Human Investigator Review"


class ReportService:
    """
    Manages investigation report synthesis, HTML rendering, and querying.
    """

    @classmethod
    def _render_html_report(cls, data: Dict[str, Any]) -> str:
        """
        Renders a clean, standalone, print-ready HTML forensic report document.
        """
        case_summary = data.get("case_summary", {})
        evidence_inv = data.get("evidence_inventory", [])
        integrity_status = data.get("evidence_integrity_status", [])
        timeline = data.get("investigation_timeline", [])
        entity_rel = data.get("entity_relationships", {})
        correlations = data.get("correlations", [])
        findings = data.get("ai_assisted_findings", [])
        supporting_ev = data.get("supporting_evidence", [])
        alternatives = data.get("alternative_explanations", [])
        verifications = data.get("recommended_verification", [])
        reviews = data.get("investigator_review_status", [])
        limitations = data.get("limitations", [])

        # Build HTML tables and lists
        evidence_rows = "".join(
            f"<tr><td>{e.get('id')}</td><td><b>{e.get('evidence_number', '')}</b></td><td>{e.get('original_filename')}</td><td>{e.get('mime_type')}</td><td>{e.get('file_size', 0)} B</td><td><span class='badge'>{e.get('processing_status')}</span></td></tr>"
            for e in evidence_inv
        ) or "<tr><td colspan='6'>No evidence artifacts recorded.</td></tr>"

        integrity_rows = "".join(
            f"<tr><td>{i.get('evidence_id')}</td><td>{i.get('original_filename')}</td><td><code class='hash'>{i.get('sha256_hash')}</code></td><td><span class='badge status-{i.get('integrity_status')}'>{i.get('integrity_status')}</span></td><td>{i.get('last_verified_at') or 'N/A'}</td></tr>"
            for i in integrity_status
        ) or "<tr><td colspan='5'>No cryptographic records available.</td></tr>"

        timeline_rows = "".join(
            f"<tr><td>{t.get('timestamp')}</td><td><b>{t.get('event_type')}</b></td><td>{t.get('source')}</td><td>{t.get('entity_type', '')}: {t.get('entity_value', '')}</td><td>{t.get('details')}</td></tr>"
            for t in timeline[:30]
        ) or "<tr><td colspan='5'>No timeline events logged.</td></tr>"

        findings_cards = "".join(
            f"<div class='card'><h4>{f.get('finding_id')}: {f.get('title')}</h4><p>{f.get('description')}</p><p><b>Category:</b> {f.get('category')} | <b>Confidence:</b> {int(f.get('confidence', 0.85)*100)}% | <b>Status:</b> <span class='badge'>{f.get('review_status')}</span></p><p><small><b>Referenced Evidence IDs:</b> {f.get('referenced_evidence_ids')} | <b>Event IDs:</b> {f.get('referenced_event_ids')}</small></p></div>"
            for f in findings
        ) or "<p>No AI findings formulated.</p>"

        correlations_cards = "".join(
            f"<div class='card'><h4>{c.get('correlation_id')}: {c.get('title')}</h4><p>{c.get('description')}</p><p><b>Signal:</b> {c.get('signal_type')} | <b>Score:</b> {int(c.get('score', 0)*100)}%</p><small><b>Supporting Evidence:</b> {c.get('supporting_evidence_ids')}</small></div>"
            for c in correlations
        ) or "<p>No correlations recorded.</p>"

        alternatives_list = "".join(f"<li>{alt}</li>" for alt in alternatives)
        verifications_list = "".join(f"<li>{v}</li>" for v in verifications)
        limitations_list = "".join(f"<li>{lim}</li>" for lim in limitations)

        reviews_rows = "".join(
            f"<tr><td><b>{r.get('finding_id')}</b></td><td>{r.get('title')}</td><td><span class='badge status-{r.get('review_status')}'>{r.get('review_status')}</span></td><td>{r.get('reviewer_notes') or 'Pending Review'}</td><td>{r.get('reviewed_at') or 'N/A'}</td></tr>"
            for r in reviews
        ) or "<tr><td colspan='5'>No review actions recorded.</td></tr>"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Investigation Report — {case_summary.get('case_number', 'Case')}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
  .container {{ max-width: 1000px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }}
  .disclaimer-banner {{ background: #dc2626; color: #fff; padding: 14px 20px; font-weight: bold; text-align: center; border-radius: 6px; font-size: 16px; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px; }}
  h1, h2, h3, h4 {{ color: #e2e8f0; margin-top: 24px; border-bottom: 1px solid #334155; padding-bottom: 8px; }}
  table {{ width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }}
  th, td {{ padding: 10px 12px; border: 1px solid #334155; text-align: left; }}
  th {{ background: #0f172a; color: #94a3b8; font-weight: 600; }}
  tr:nth-child(even) {{ background: #1e293b; }}
  tr:nth-child(odd) {{ background: #182234; }}
  .badge {{ display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; background: #3b82f6; color: #fff; }}
  .status-verified {{ background: #10b981; }}
  .status-accepted_as_lead {{ background: #10b981; }}
  .status-rejected {{ background: #ef4444; }}
  .status-needs_more_analysis {{ background: #f59e0b; }}
  .card {{ background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 16px; margin-bottom: 12px; }}
  code.hash {{ font-family: monospace; font-size: 11px; word-break: break-all; color: #38bdf8; }}
  ul {{ padding-left: 20px; }}
  li {{ margin-bottom: 8px; line-height: 1.5; }}
  .meta-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; font-size: 14px; }}
  .meta-item {{ background: #0f172a; padding: 10px; border-radius: 4px; border: 1px solid #334155; }}
</style>
</head>
<body>
<div class="container">
  <div class="disclaimer-banner">
    ⚠️ {data.get('disclaimer', _MANDATORY_DISCLAIMER)}
  </div>

  <h1>Forensic Investigation Report</h1>
  <div class="meta-grid">
    <div class="meta-item"><b>Case Number:</b> {case_summary.get('case_number')}</div>
    <div class="meta-item"><b>Title:</b> {case_summary.get('title')}</div>
    <div class="meta-item"><b>Priority:</b> <span class="badge">{case_summary.get('priority')}</span></div>
    <div class="meta-item"><b>Status:</b> <span class="badge">{case_summary.get('status')}</span></div>
    <div class="meta-item"><b>Generated At:</b> {data.get('generated_at')}</div>
    <div class="meta-item"><b>Primary Record:</b> PostgreSQL (ADEIP)</div>
  </div>

  <h2>1. Case Summary</h2>
  <p>{case_summary.get('description')}</p>

  <h2>2. Evidence Inventory</h2>
  <table>
    <thead><tr><th>ID</th><th>Evidence #</th><th>Original Filename</th><th>MIME Type</th><th>File Size</th><th>Processing Status</th></tr></thead>
    <tbody>{evidence_rows}</tbody>
  </table>

  <h2>3. Evidence Integrity Status</h2>
  <table>
    <thead><tr><th>Evidence ID</th><th>Filename</th><th>SHA-256 Hash</th><th>Integrity Status</th><th>Last Verified At</th></tr></thead>
    <tbody>{integrity_rows}</tbody>
  </table>

  <h2>4. Investigation Timeline</h2>
  <table>
    <thead><tr><th>Timestamp (UTC)</th><th>Event Type</th><th>Source Artifact</th><th>Entity / Actor</th><th>Details</th></tr></thead>
    <tbody>{timeline_rows}</tbody>
  </table>

  <h2>5. Entity Relationships</h2>
  <p>Total normalized entities identified: <b>{entity_rel.get('total_entities', 0)}</b></p>
  <div class="card">
    <b>Breakdown by Type:</b> {json.dumps(entity_rel.get('entities_by_type', {}))}
  </div>

  <h2>6. Correlations</h2>
  {correlations_cards}

  <h2>7. AI-Assisted Findings</h2>
  {findings_cards}

  <h2>8. Supporting Evidence Mapping</h2>
  <p>Every finding links directly to source evidence artifacts stored in the primary evidentiary repository.</p>

  <h2>9. Alternative Explanations</h2>
  <ul>{alternatives_list}</ul>

  <h2>10. Recommended Verification Steps</h2>
  <ul>{verifications_list}</ul>

  <h2>11. Investigator Review Status (Human-in-the-Loop)</h2>
  <table>
    <thead><tr><th>Finding ID</th><th>Title</th><th>Review Status</th><th>Investigator Notes</th><th>Reviewed At</th></tr></thead>
    <tbody>{reviews_rows}</tbody>
  </table>

  <h2>12. Limitations & Uncertainty Declarations</h2>
  <ul>{limitations_list}</ul>

  <hr style="margin-top: 32px; border-color: #334155;">
  <p style="text-align: center; color: #94a3b8; font-size: 12px;">
    ADEIP — AI-Assisted Digital Evidence Intelligence Platform • Document generated for official investigative review.
  </p>
</div>
</body>
</html>"""

    @classmethod
    def generate_case_report(
        cls,
        db: Session,
        case_id: int,
        req: ReportGenerateRequest,
        current_user: User,
        client_ip: Optional[str] = None,
    ) -> ReportDetailResponse:
        """
        Synthesizes the complete 12-section structured report, saves it in PostgreSQL,
        renders the standalone HTML report, and emits an audit event.
        """
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        # 1. Gather all relational data
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
        findings_records = list(
            db.scalars(select(InvestigationFindingModel).where(InvestigationFindingModel.case_id == case_id)).all()
        )
        recommendations_records = list(
            db.scalars(select(InvestigationRecommendationModel).where(InvestigationRecommendationModel.case_id == case_id)).all()
        )

        evidence_dicts = [
            {
                "id": ev.id,
                "evidence_number": ev.evidence_number,
                "original_filename": ev.original_filename,
                "file_size": ev.file_size,
                "mime_type": ev.mime_type,
                "sha256_hash": ev.sha256_hash,
                "processing_status": ev.processing_status.value,
                "integrity_status": ev.integrity_status.value,
                "last_verified_at": ev.last_verified_at.isoformat() if ev.last_verified_at else None,
                "created_at": ev.uploaded_at.isoformat() if hasattr(ev, 'uploaded_at') and ev.uploaded_at else (ev.updated_at.isoformat() if hasattr(ev, 'updated_at') and ev.updated_at else None),
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
                "evidence_id": ent.evidence_id,
                "confidence": ent.confidence,
            }
            for ent in entities_records
        ]
        findings_dicts = [
            {
                "finding_id": f.finding_id,
                "title": f.title,
                "category": f.category,
                "description": f.summary,
                "confidence": f.confidence_score,
                "referenced_evidence_ids": json.loads(f.supporting_evidence_ids) if f.supporting_evidence_ids else [],
                "referenced_event_ids": json.loads(f.supporting_event_ids) if f.supporting_event_ids else [],
                "review_status": f.review_status.value,
                "reviewed_by": f.reviewed_by,
                "reviewer_notes": f.reviewer_notes,
                "reviewed_at": f.reviewed_at.isoformat() if f.reviewed_at else None,
            }
            for f in findings_records
        ]
        recommendations_dicts = [
            {
                "recommendation_id": r.recommendation_id,
                "recommendation": r.recommendation,
                "reason": r.reason,
                "priority": r.priority.value,
            }
            for r in recommendations_records
        ]

        # 2. Build mock state and run agents
        mock_state = {
            "case_id": case_id,
            "evidence_ids": [ev.id for ev in evidence_items],
            "case_info": {
                "id": case.id,
                "case_number": case.case_number,
                "title": case.title,
                "description": case.description,
                "priority": case.priority.value,
                "status": case.status.value,
                "created_at": case.created_at.isoformat(),
            },
            "evidence_items": evidence_dicts,
            "raw_events": raw_events,
            "extracted_entities": extracted_entities,
            "findings": findings_dicts,
            "recommendations": recommendations_dicts,
            "agent_logs": [],
        }

        timeline_res = timeline_agent(mock_state)
        mock_state["timeline"] = timeline_res.get("timeline", [])

        corr_res = correlation_agent(mock_state)
        mock_state["correlations"] = corr_res.get("correlations", [])

        reason_res = reasoning_agent(mock_state)
        mock_state["reasoning_output"] = reason_res.get("reasoning_output", {})

        # Synthesize report via Report Agent
        rep_res = report_agent(mock_state)
        structured_data = rep_res.get("structured_report", {})

        # Render HTML
        rendered_html = cls._render_html_report(structured_data)

        # 3. Store in Database
        report_uid = f"RPT-{case_id}-{uuid.uuid4().hex[:6].upper()}"
        report_title = req.title or f"Investigation Report: {case.title} ({case.case_number})"

        report_model = InvestigationReportModel(
            report_id=report_uid,
            case_id=case_id,
            title=report_title,
            report_format=req.report_format,
            disclaimer=_MANDATORY_DISCLAIMER,
            report_data=json.dumps(structured_data),
            html_content=rendered_html if req.report_format == ReportFormat.HTML else None,
            generated_by=current_user.id,
        )
        db.add(report_model)
        db.commit()
        db.refresh(report_model)

        # 4. Log Audit Event
        AuditService.log(
            db=db,
            action=AuditAction.REPORT_GENERATED,
            resource_type=AuditResourceType.CASE,
            user_id=current_user.id,
            resource_id=str(case_id),
            details={
                "report_id": report_model.report_id,
                "format": req.report_format.value,
                "case_id": case_id,
            },
            ip_address=client_ip,
            flush=True,
        )

        return ReportDetailResponse(
            id=report_model.id,
            report_id=report_model.report_id,
            case_id=report_model.case_id,
            title=report_model.title,
            report_format=report_model.report_format,
            disclaimer=report_model.disclaimer,
            generated_by=report_model.generated_by,
            author_name=current_user.full_name,
            created_at=report_model.created_at,
            report_data=StructuredReportData(**structured_data),
            html_content=report_model.html_content,
        )

    @classmethod
    def list_case_reports(
        cls,
        db: Session,
        case_id: int,
        page: int = 1,
        page_size: int = 20,
    ) -> ReportListResponse:
        """Retrieves paginated list of reports for a case."""
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        stmt = select(InvestigationReportModel).where(InvestigationReportModel.case_id == case_id)
        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        offset = (max(1, page) - 1) * page_size

        models = list(
            db.scalars(
                stmt.order_by(InvestigationReportModel.created_at.desc())
                .offset(offset)
                .limit(page_size)
            ).all()
        )

        items = [
            ReportResponse(
                id=m.id,
                report_id=m.report_id,
                case_id=m.case_id,
                title=m.title,
                report_format=m.report_format,
                disclaimer=m.disclaimer,
                generated_by=m.generated_by,
                author_name=m.author.full_name if m.author else None,
                created_at=m.created_at,
            )
            for m in models
        ]

        return ReportListResponse(
            case_id=case_id,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total > 0 else 0,
            items=items,
        )

    @classmethod
    def get_report_detail(cls, db: Session, report_id_str: str) -> ReportDetailResponse:
        """Retrieves full 12-section report details and rendered HTML by ID."""
        model = db.scalars(
            select(InvestigationReportModel).where(
                (InvestigationReportModel.report_id == report_id_str) |
                (InvestigationReportModel.id == (int(report_id_str) if report_id_str.isdigit() else -1))
            )
        ).first()

        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation report '{report_id_str}' not found.",
            )

        raw_data = json.loads(model.report_data) if model.report_data else {}
        author_name = model.author.full_name if model.author else None

        return ReportDetailResponse(
            id=model.id,
            report_id=model.report_id,
            case_id=model.case_id,
            title=model.title,
            report_format=model.report_format,
            disclaimer=model.disclaimer,
            generated_by=model.generated_by,
            author_name=author_name,
            created_at=model.created_at,
            report_data=StructuredReportData(**raw_data),
            html_content=model.html_content,
        )
