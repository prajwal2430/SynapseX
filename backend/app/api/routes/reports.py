"""
Investigation Report Routes for ADEIP.
Provides endpoints for generating, listing, and viewing structured forensic investigation reports.
"""
import json
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, Response, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_active_user
from app.api.dependencies.database import get_db
from app.models.user import User
from app.schemas.report import (
    ReportDetailResponse,
    ReportGenerateRequest,
    ReportListResponse,
    ReportResponse,
)
from app.services.report_service import ReportService

# Router 1: Case-scoped report generation & list
case_report_router = APIRouter(prefix="/cases", tags=["Case Investigation Reports"])

# Router 2: Direct report viewing & HTML export
report_router = APIRouter(prefix="/reports", tags=["Investigation Reports"])


@case_report_router.post(
    "/{case_id}/reports/generate",
    response_model=ReportDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a comprehensive 12-section investigation report (JSON & HTML)",
)
@case_report_router.post(
    "/{case_id}/reports",
    response_model=ReportDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Alias: Generate investigation report",
)
def generate_case_report(
    case_id: int,
    req: ReportGenerateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Generates a formal 12-section digital forensic investigation report:
    1. Case Summary
    2. Evidence Inventory
    3. Evidence Integrity Status
    4. Investigation Timeline
    5. Entity Relationships
    6. Correlations
    7. AI-Assisted Findings
    8. Supporting Evidence Mapping
    9. Alternative Explanations
    10. Recommended Verification
    11. Investigator Review Status
    12. Limitations & Uncertainty Declarations

    **Mandatory Disclaimer**: "AI-Assisted Draft — Requires Human Investigator Review"
    """
    client_ip = request.client.host if request.client else None
    return ReportService.generate_case_report(
        db=db,
        case_id=case_id,
        req=req,
        current_user=current_user,
        client_ip=client_ip,
    )


@case_report_router.get(
    "/{case_id}/reports",
    response_model=ReportListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all generated investigation reports for a case",
)
def list_case_reports(
    case_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves a paginated list of generated reports for a case.
    """
    return ReportService.list_case_reports(
        db=db,
        case_id=case_id,
        page=page,
        page_size=page_size,
    )


@report_router.get(
    "/{report_id}",
    response_model=ReportDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get full investigation report details and structured data",
)
def get_report_detail(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves full report details, 12-section structured payload, and rendered HTML.
    """
    return ReportService.get_report_detail(db=db, report_id_str=report_id)


@report_router.get(
    "/{report_id}/html",
    response_class=HTMLResponse,
    status_code=status.HTTP_200_OK,
    summary="View rendered standalone HTML investigation report in browser",
)
def view_html_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the standalone rendered HTML forensic report for direct browser viewing or printing.
    """
    report = ReportService.get_report_detail(db=db, report_id_str=report_id)
    if not report.html_content:
        # Re-render on demand
        rendered = ReportService._render_html_report(report.report_data.model_dump())
        return HTMLResponse(content=rendered)
    return HTMLResponse(content=report.html_content)


@report_router.get(
    "/{report_id}/pdf",
    status_code=status.HTTP_200_OK,
    summary="View or stream compiled investigation report as official PDF dossier",
)
def view_pdf_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the compiled forensic PDF document for direct browser preview or saving.
    """
    report = ReportService.get_report_detail(db=db, report_id_str=report_id)
    pdf_bytes = ReportService._render_pdf_report(
        data=report.report_data.model_dump(),
        title=report.title,
        report_id=report.report_id,
        case_id=report.case_id,
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="report-{report.report_id}.pdf"'},
    )


@report_router.get(
    "",
    response_model=ReportListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all reports across cases or filtered by case_id",
)
def list_all_reports(
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves a paginated list of generated investigation reports.
    """
    return ReportService.list_all_reports(
        db=db,
        case_id=case_id,
        page=page,
        page_size=page_size,
    )


@report_router.get(
    "/{report_id}/download",
    status_code=status.HTTP_200_OK,
    summary="Download report artifact as a file attachment",
)
def download_report(
    report_id: str,
    export_format: Optional[str] = Query(None, description="Export format: pdf, html, json, or markdown"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Downloads the real investigation report data in the requested format (PDF, HTML, JSON, or Markdown).
    """
    report = ReportService.get_report_detail(db=db, report_id_str=report_id)
    fmt = (export_format or report.report_format.value).lower().strip()

    if fmt == "pdf":
        data = report.report_data.model_dump()
        pdf_bytes = ReportService._render_pdf_report(
            data=data,
            title=report.title,
            report_id=report.report_id,
            case_id=report.case_id,
        )
        content = pdf_bytes
        media_type = "application/pdf"
        filename = f"report-{report.report_id}.pdf"
    elif fmt == "json":
        content = json.dumps(report.report_data.model_dump(), indent=2)
        media_type = "application/json"
        filename = f"report-{report.report_id}.json"
    elif fmt == "markdown" or fmt == "md":
        # Formulate readable markdown document
        data = report.report_data.model_dump()
        lines = [
            f"# {report.title}",
            "",
            f"> **Disclaimer:** {report.disclaimer}",
            f"> **Case ID:** {report.case_id} | **Report ID:** {report.report_id} | **Generated At:** {report.created_at}",
            "",
            "## 1. Case Summary",
            json.dumps(data.get("case_summary", {}), indent=2),
            "",
            "## 2. Evidence Inventory",
        ]
        for ev in data.get("evidence_inventory", []):
            lines.append(f"- **{ev.get('evidence_number', '')}**: {ev.get('original_filename')} ({ev.get('processing_status')})")
        lines.extend([
            "",
            "## 7. AI-Assisted Findings",
        ])
        for f in data.get("ai_assisted_findings", []):
            lines.append(f"### {f.get('finding_id')}: {f.get('title')}")
            lines.append(f"{f.get('description', '')}")
            lines.append(f"*Confidence:* {f.get('confidence')} | *Review Status:* {f.get('review_status')}")
            lines.append("")
        content = "\n".join(lines)
        media_type = "text/markdown; charset=utf-8"
        filename = f"report-{report.report_id}.md"
    else:
        # Default to HTML
        html_doc = report.html_content or ReportService._render_html_report(report.report_data.model_dump())
        content = html_doc
        media_type = "text/html; charset=utf-8"
        filename = f"report-{report.report_id}.html"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@report_router.delete(
    "/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permanently delete an investigation report",
)
def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Deletes an investigation report record. Restricted to Admins, Supervisors, or the report creator.
    """
    ReportService.delete_report(db=db, report_id_str=report_id, current_user=current_user)
    return None
