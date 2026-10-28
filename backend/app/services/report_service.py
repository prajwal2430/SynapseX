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
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from fpdf import FPDF

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
from app.models.user import User, UserRole
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


def _clean_pdf_text(val: Any) -> str:
    """Sanitizes text strings into clean Latin-1 for standard FPDF typography."""
    if val is None:
        return ""
    text = str(val)
    replacements = {
        "\u2014": " - ",
        "\u2013": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2022": "*",
        "\u2026": "...",
        "\u26a0": "[!]",
        "\ufe0f": "",
        "\u2714": "[OK]",
        "\u2716": "[X]",
        "\u2192": "->",
        "\u2190": "<-",
        "\u21d2": "=>",
        "\u00a0": " ",
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text.encode("latin-1", "replace").decode("latin-1")


class ForensicReportPDF(FPDF):
    """Custom FPDF2 subclass with digital forensics header and footer styling."""
    def __init__(self, report_id_str: str, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.report_id_str = report_id_str
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(100, 116, 139)
        self.cell(0, 5, _clean_pdf_text(f"SYNAPSEX FORENSIC INTELLIGENCE PLATFORM  |  REPORT: {self.report_id_str}"), align="L")
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 5, "LAW ENFORCEMENT & COMPLIANCE DOSSIER", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(203, 213, 225)
        self.line(10, 12, 200, 12)
        self.ln(6)

    def footer(self):
        self.set_y(-12)
        self.set_draw_color(226, 232, 240)
        self.line(10, 285, 200, 285)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(148, 163, 184)
        self.cell(100, 5, _clean_pdf_text(f"Report Ref: {self.report_id_str}  *  CONFIDENTIAL / RESTRICTED"), align="L")
        self.cell(90, 5, f"Page {self.page_no()} of {{nb}}", align="R")


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
            f"<div class='card'><h4>{f.get('finding_id')}: {f.get('title')}</h4><p>{f.get('description')}</p><p><b>Category:</b> {f.get('category')} | <b>Confidence:</b> {int((f.get('confidence') if f.get('confidence') is not None else 0.85)*100)}% | <b>Status:</b> <span class='badge'>{f.get('review_status')}</span></p><p><small><b>Referenced Evidence IDs:</b> {f.get('referenced_evidence_ids')} | <b>Event IDs:</b> {f.get('referenced_event_ids')}</small></p></div>"
            for f in findings
        ) or "<p>No AI findings formulated.</p>"

        correlations_cards = "".join(
            f"<div class='card'><h4>{c.get('correlation_id')}: {c.get('title')}</h4><p>{c.get('description')}</p><p><b>Signal:</b> {c.get('signal_type')} | <b>Score:</b> {int((c.get('score') if c.get('score') is not None else (c.get('correlation_score') if c.get('correlation_score') is not None else 0.85))*100)}%</p><small><b>Supporting Evidence:</b> {c.get('supporting_evidence_ids')}</small></div>"
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
  @media print {{
    @page {{ size: A4 portrait; margin: 15mm; }}
    body {{ background: #ffffff !important; color: #0f172a !important; padding: 0 !important; }}
    .container {{ background: #ffffff !important; color: #0f172a !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }}
    .disclaimer-banner {{ background: #b91c1c !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }}
    th {{ background: #e2e8f0 !important; color: #0f172a !important; -webkit-print-color-adjust: exact !important; }}
    tr:nth-child(even) {{ background: #f8fafc !important; }}
    tr:nth-child(odd) {{ background: #ffffff !important; }}
    th, td {{ border: 1px solid #cbd5e1 !important; color: #0f172a !important; }}
    .card {{ background: #f8fafc !important; border: 1px solid #cbd5e1 !important; color: #0f172a !important; break-inside: avoid; }}
    h1, h2, h3, h4 {{ color: #0f172a !important; border-bottom: 1px solid #cbd5e1 !important; }}
    .meta-item {{ background: #f8fafc !important; border: 1px solid #cbd5e1 !important; }}
    .badge {{ border: 1px solid #94a3b8 !important; -webkit-print-color-adjust: exact !important; }}
  }}
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
    def _render_pdf_report(cls, data: Dict[str, Any], title: str, report_id: str, case_id: int) -> bytes:
        """
        Renders an official, multi-page forensic PDF dossier using fpdf2.
        Includes mandatory disclaimer banner, case summary, evidence inventory,
        integrity hashes, AI findings, timeline, and investigator sign-off block.
        """
        pdf = ForensicReportPDF(report_id_str=report_id)
        pdf.add_page()

        # Disclaimer Banner
        pdf.set_fill_color(220, 38, 38)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(0, 7, _clean_pdf_text(f"[!] MANDATORY DISCLAIMER: {data.get('disclaimer', _MANDATORY_DISCLAIMER)}"), align="C", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)

        # Document Header
        pdf.set_text_color(15, 23, 42)
        pdf.set_font("Helvetica", "B", 15)
        pdf.cell(0, 8, _clean_pdf_text(title or f"Investigation Report {report_id}"), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

        # Metadata Grid
        case_summary = data.get("case_summary", {})
        pdf.set_fill_color(241, 245, 249)
        pdf.set_draw_color(203, 213, 225)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(30, 41, 59)

        col_w = 47.5
        row_h = 6

        # Row 1
        pdf.cell(col_w, row_h, _clean_pdf_text(f"Case Number: {case_summary.get('case_number', 'N/A')}"), border=1, fill=True)
        pdf.cell(col_w, row_h, _clean_pdf_text(f"Priority: {str(case_summary.get('priority', 'N/A')).upper()}"), border=1, fill=True)
        pdf.cell(col_w, row_h, _clean_pdf_text(f"Status: {str(case_summary.get('status', 'N/A')).upper()}"), border=1, fill=True)
        pdf.cell(col_w, row_h, _clean_pdf_text(f"Report ID: {report_id}"), border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

        # Row 2
        gen_time = data.get("generated_at") or datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        pdf.cell(col_w * 2, row_h, _clean_pdf_text(f"Generated At: {gen_time}"), border=1)
        pdf.cell(col_w * 2, row_h, _clean_pdf_text("Primary Record: SynapseX ADEIP Forensics Engine"), border=1, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

        # Helper for Section Title
        def add_sec_header(sec_num: str, sec_name: str):
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(30, 58, 138)
            pdf.cell(0, 7, _clean_pdf_text(f"{sec_num}. {sec_name}"), new_x="LMARGIN", new_y="NEXT")
            pdf.set_draw_color(191, 219, 254)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(2)

        # 1. Case Summary
        add_sec_header("1", "Case Summary & Executive Briefing")
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(51, 65, 85)
        desc = case_summary.get("description") or "No case narrative provided."
        pdf.multi_cell(0, 5, _clean_pdf_text(desc))
        pdf.ln(3)

        # 2. Evidence Inventory
        add_sec_header("2", "Evidence Artifact Inventory")
        evidence_inv = data.get("evidence_inventory", [])
        if evidence_inv:
            pdf.set_font("Helvetica", "B", 8)
            pdf.set_fill_color(226, 232, 240)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(15, 6, "ID", border=1, fill=True)
            pdf.cell(35, 6, "Evidence #", border=1, fill=True)
            pdf.cell(60, 6, "Filename", border=1, fill=True)
            pdf.cell(45, 6, "MIME Type", border=1, fill=True)
            pdf.cell(35, 6, "Status", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(51, 65, 85)
            for ev in evidence_inv[:25]:
                pdf.cell(15, 5, _clean_pdf_text(ev.get("id")), border=1)
                pdf.cell(35, 5, _clean_pdf_text(ev.get("evidence_number")), border=1)
                fname = str(ev.get("original_filename") or "")
                if len(fname) > 30: fname = fname[:27] + "..."
                pdf.cell(60, 5, _clean_pdf_text(fname), border=1)
                pdf.cell(45, 5, _clean_pdf_text(ev.get("mime_type")), border=1)
                pdf.cell(35, 5, _clean_pdf_text(ev.get("processing_status")), border=1, new_x="LMARGIN", new_y="NEXT")
        else:
            pdf.set_font("Helvetica", "I", 8)
            pdf.cell(0, 5, "No evidence artifacts recorded for this report.", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

        # 3. Evidence Integrity
        add_sec_header("3", "Evidence Integrity Status (SHA-256 Hashes)")
        integrity = data.get("evidence_integrity_status", [])
        if integrity:
            pdf.set_font("Helvetica", "B", 7)
            pdf.set_fill_color(226, 232, 240)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(20, 5, "Evidence ID", border=1, fill=True)
            pdf.cell(50, 5, "Filename", border=1, fill=True)
            pdf.cell(90, 5, "Cryptographic Hash (SHA-256)", border=1, fill=True)
            pdf.cell(30, 5, "Integrity Status", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

            pdf.set_font("Helvetica", "", 7)
            pdf.set_text_color(51, 65, 85)
            for it in integrity[:25]:
                pdf.cell(20, 5, _clean_pdf_text(it.get("evidence_id")), border=1)
                fn = str(it.get("original_filename") or "")
                if len(fn) > 25: fn = fn[:22] + "..."
                pdf.cell(50, 5, _clean_pdf_text(fn), border=1)
                pdf.cell(90, 5, _clean_pdf_text(it.get("sha256_hash")), border=1)
                pdf.cell(30, 5, _clean_pdf_text(it.get("integrity_status")), border=1, new_x="LMARGIN", new_y="NEXT")
        else:
            pdf.set_font("Helvetica", "I", 8)
            pdf.cell(0, 5, "No cryptographic hash verification records available.", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

        # 4. AI-Assisted Findings
        add_sec_header("4", "AI-Assisted Findings & Analytical Hypotheses")
        findings = data.get("ai_assisted_findings", [])
        if findings:
            for f in findings:
                pdf.set_fill_color(248, 250, 252)
                pdf.set_draw_color(203, 213, 225)
                pdf.set_font("Helvetica", "B", 9)
                pdf.set_text_color(15, 23, 42)
                fid = f.get("finding_id", "FND")
                ftitle = f.get("title", "")
                cat = f.get("category", "General")
                conf_val = f.get("confidence")
                if conf_val is None:
                    conf_val = 0.85
                conf = int(float(conf_val) * 100)
                rev = str(f.get("review_status", "pending")).upper()

                pdf.cell(0, 6, _clean_pdf_text(f"[{fid}] {ftitle}"), border="LTR", fill=True, new_x="LMARGIN", new_y="NEXT")
                pdf.set_font("Helvetica", "", 8)
                pdf.set_text_color(71, 85, 105)
                pdf.cell(0, 5, _clean_pdf_text(f"Category: {cat}  |  Confidence Score: {conf}%  |  Review Status: {rev}"), border="LR", fill=True, new_x="LMARGIN", new_y="NEXT")

                desc_text = f.get("description", "")
                if desc_text:
                    pdf.set_font("Helvetica", "", 8)
                    pdf.set_text_color(51, 65, 85)
                    pdf.multi_cell(0, 4.5, _clean_pdf_text(f"Description: {desc_text}"), border="LBR", fill=True)
                else:
                    pdf.cell(0, 1, "", border="LBR", fill=True, new_x="LMARGIN", new_y="NEXT")
                pdf.ln(2)
        else:
            pdf.set_font("Helvetica", "I", 8)
            pdf.cell(0, 5, "No AI findings formulated for this scope.", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

        # 5. Timeline Highlights
        timeline = data.get("investigation_timeline", [])
        if timeline:
            add_sec_header("5", "Investigation Timeline Highlights")
            pdf.set_font("Helvetica", "B", 7)
            pdf.set_fill_color(226, 232, 240)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(35, 5, "Timestamp (UTC)", border=1, fill=True)
            pdf.cell(35, 5, "Event Type", border=1, fill=True)
            pdf.cell(40, 5, "Source Artifact", border=1, fill=True)
            pdf.cell(80, 5, "Details / Activity", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")

            pdf.set_font("Helvetica", "", 7)
            pdf.set_text_color(51, 65, 85)
            for evt in timeline[:15]:
                pdf.cell(35, 5, _clean_pdf_text(evt.get("timestamp")), border=1)
                pdf.cell(35, 5, _clean_pdf_text(evt.get("event_type")), border=1)
                src = str(evt.get("source") or "")
                if len(src) > 22: src = src[:20] + "..."
                pdf.cell(40, 5, _clean_pdf_text(src), border=1)
                det = str(evt.get("details") or "")
                if len(det) > 50: det = det[:47] + "..."
                pdf.cell(80, 5, _clean_pdf_text(det), border=1, new_x="LMARGIN", new_y="NEXT")
            pdf.ln(4)

        # 6. Alternative Explanations & Limitations
        alternatives = data.get("alternative_explanations", [])
        limitations = data.get("limitations", [])
        if alternatives or limitations:
            add_sec_header("6", "Alternative Hypotheses & Forensic Limitations")
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(51, 65, 85)
            if alternatives:
                pdf.set_font("Helvetica", "B", 8)
                pdf.cell(0, 5, "Alternative Hypotheses Evaluated:", new_x="LMARGIN", new_y="NEXT")
                pdf.set_font("Helvetica", "", 8)
                for alt in alternatives:
                    pdf.cell(0, 4.5, _clean_pdf_text(f"  * {alt}"), new_x="LMARGIN", new_y="NEXT")
            if limitations:
                pdf.ln(2)
                pdf.set_font("Helvetica", "B", 8)
                pdf.cell(0, 5, "Scope & Evidence Limitations:", new_x="LMARGIN", new_y="NEXT")
                pdf.set_font("Helvetica", "", 8)
                for lim in limitations:
                    pdf.cell(0, 4.5, _clean_pdf_text(f"  * {lim}"), new_x="LMARGIN", new_y="NEXT")
            pdf.ln(4)

        # 7. Investigator Review & Certification
        add_sec_header("7", "Investigator Review & Certification Sign-Off")
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(71, 85, 105)
        pdf.cell(0, 5, _clean_pdf_text("I certify that I have reviewed the AI-assisted findings against primary evidence records:"), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

        box_w = 90
        pdf.cell(box_w, 6, "Lead Investigator Name: _______________________", align="L")
        pdf.cell(10, 6, "")
        pdf.cell(box_w, 6, "Supervisory Reviewer: _______________________", align="L", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)
        pdf.cell(box_w, 6, "Signature: ___________________________________", align="L")
        pdf.cell(10, 6, "")
        pdf.cell(box_w, 6, "Date (UTC): __________________________________", align="L", new_x="LMARGIN", new_y="NEXT")

        return bytes(pdf.output())

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

        # 1. Gather relational data (filtering by requested evidence and findings if provided)
        ev_stmt = select(Evidence).where(Evidence.case_id == case_id)
        if req.evidence_ids:
            ev_stmt = ev_stmt.where(Evidence.id.in_(req.evidence_ids))
        evidence_items = list(db.scalars(ev_stmt).all())

        ev_id_set = {ev.id for ev in evidence_items} if req.evidence_ids else None

        events_stmt = select(InvestigationEvent).where(InvestigationEvent.case_id == case_id)
        if ev_id_set is not None:
            events_stmt = events_stmt.where(
                (InvestigationEvent.evidence_id.in_(ev_id_set)) | (InvestigationEvent.evidence_id.is_(None))
            )
        events_records = list(
            db.scalars(
                events_stmt.order_by(InvestigationEvent.timestamp.asc().nullslast(), InvestigationEvent.id.asc())
            ).all()
        )

        entities_stmt = select(ExtractedEntityModel).where(ExtractedEntityModel.case_id == case_id)
        if ev_id_set is not None:
            entities_stmt = entities_stmt.where(
                (ExtractedEntityModel.evidence_id.in_(ev_id_set)) | (ExtractedEntityModel.evidence_id.is_(None))
            )
        entities_records = list(db.scalars(entities_stmt).all())

        findings_stmt = select(InvestigationFindingModel).where(InvestigationFindingModel.case_id == case_id)
        if req.finding_ids:
            conditions = [InvestigationFindingModel.finding_id.in_(req.finding_ids)]
            int_ids = [int(x) for x in req.finding_ids if str(x).isdigit()]
            if int_ids:
                conditions.append(InvestigationFindingModel.id.in_(int_ids))
            findings_stmt = findings_stmt.where(or_(*conditions))
        findings_records = list(db.scalars(findings_stmt).all())
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
                "uploaded_at": ev.uploaded_at.isoformat() if hasattr(ev, 'uploaded_at') and ev.uploaded_at else None,
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
            html_content=rendered_html,
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
            status="completed",
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
                status="completed",
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
    def list_all_reports(
        cls,
        db: Session,
        case_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> ReportListResponse:
        """Retrieves paginated list of reports, optionally filtered by case."""
        stmt = select(InvestigationReportModel)
        if case_id is not None:
            stmt = stmt.where(InvestigationReportModel.case_id == case_id)
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
                status="completed",
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

        html_content = model.html_content or cls._render_html_report(raw_data)

        return ReportDetailResponse(
            id=model.id,
            report_id=model.report_id,
            case_id=model.case_id,
            title=model.title,
            report_format=model.report_format,
            status="completed",
            disclaimer=model.disclaimer,
            generated_by=model.generated_by,
            author_name=author_name,
            created_at=model.created_at,
            report_data=StructuredReportData(**raw_data),
            html_content=html_content,
        )

    @classmethod
    def delete_report(cls, db: Session, report_id_str: str, current_user: User) -> None:
        """
        Permanently deletes an investigation report record.
        Allowed for Admins, Supervisors, and the investigator who generated the report.
        """
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

        is_privileged = current_user.role in (UserRole.ADMIN, UserRole.SUPERVISOR)
        is_author = model.generated_by == current_user.id

        if not (is_privileged or is_author):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this report.",
            )

        case_id = model.case_id
        report_uid = model.report_id

        db.delete(model)
        db.commit()

        AuditService.log(
            db=db,
            action=AuditAction.REPORT_DELETED,
            resource_type=AuditResourceType.REPORT,
            user_id=current_user.id,
            resource_id=report_uid,
            details={"case_id": case_id, "report_id": report_uid},
            flush=True,
        )
