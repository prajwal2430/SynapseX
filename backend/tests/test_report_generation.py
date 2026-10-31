"""
Unit tests for ADEIP Investigation Report Generation System (12-Section Forensic Synthesis).
"""
import pytest
from app.agents.report_agent import report_agent
from app.agents.state import InvestigationState
from app.models.report import ReportFormat
from app.schemas.report import StructuredReportData
from app.services.report_service import ReportService


@pytest.fixture
def rich_investigation_state() -> InvestigationState:
    """Fixture providing a complete multi-evidence case state for report generation."""
    return {
        "case_id": 101,
        "case_info": {
            "id": 101,
            "case_number": "CASE-2026-0101",
            "title": "Operation Vanguard Data Leak",
            "description": "Unauthorized exfiltration of sensitive payroll assets.",
            "priority": "critical",
            "status": "active",
            "created_at": "2026-08-20T10:00:00Z",
        },
        "evidence_items": [
            {
                "id": 1,
                "evidence_number": "EVD-101-01",
                "original_filename": "firewall_logs.csv",
                "file_size": 2048500,
                "mime_type": "text/csv",
                "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "processing_status": "completed",
                "integrity_status": "verified",
                "last_verified_at": "2026-08-21T12:00:00Z",
                "created_at": "2026-08-20T10:15:00Z",
            }
        ],
        "raw_events": [
            {
                "id": 501,
                "evidence_id": 1,
                "event_type": "network_connection",
                "timestamp": "2026-08-20T10:30:00Z",
                "source": "firewall_logs.csv",
                "entity_type": "ip_address",
                "entity_value": "185.220.101.47",
                "metadata": {"dst_ip": "185.220.101.47", "bytes": 1450000},
            }
        ],
        "extracted_entities": [
            {"id": 1, "entity_type": "ip_address", "entity_value": "185.220.101.47", "evidence_id": 1, "confidence": 1.0}
        ],
        "timeline": [
            {
                "event_id": 501,
                "timestamp_utc": "2026-08-20T10:30:00Z",
                "event_type": "network_connection",
                "source": "firewall_logs.csv",
                "details": "Outbound egress to 185.220.101.47",
            }
        ],
        "correlations": [
            {
                "correlation_id": "CORR-101-01",
                "signal_type": "same_ip_address",
                "title": "Egress Traffic Convergence",
                "description": "Repeated egress sessions targeting external IP",
                "reasons": ["Co-occurrence of network flow"],
                "correlation_score": 0.92,
                "supporting_evidence_ids": [1],
            }
        ],
        "findings": [
            {
                "finding_id": "FND-101-AA",
                "title": "Hypothesis 1: Data Exfiltration Attempt",
                "category": "data_exfiltration",
                "description": "Outbound data transfer observed across external IP.",
                "confidence": 0.88,
                "referenced_evidence_ids": [1],
                "referenced_event_ids": [501],
                "review_status": "accepted_as_lead",
                "reviewed_by": 1,
                "reviewer_notes": "Corroborated by NetFlow records.",
                "reviewed_at": "2026-08-21T14:00:00Z",
            }
        ],
        "recommendations": [
            {
                "recommendation_id": "REC-101-01",
                "recommendation": "Review cloud storage access logs",
                "reason": "Verify destination cloud bucket.",
                "priority": "high",
            }
        ],
        "reasoning_output": {
            "alternative_explanations": [
                "Automated scheduled off-site backup routine."
            ],
            "recommended_verification": [
                "Verify firewall byte counters against border router NetFlow."
            ],
            "limitations": [
                "AI reasoning represents observational pattern recognition and is not legal proof."
            ],
        },
        "agent_logs": [],
    }


def test_report_agent_compiles_all_twelve_sections(rich_investigation_state):
    """
    Report Agent must compile all 12 specified forensic sections:
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
    12. Limitations
    """
    res = report_agent(rich_investigation_state)
    report = res["structured_report"]

    required_sections = [
        "case_summary",
        "evidence_inventory",
        "evidence_integrity_status",
        "investigation_timeline",
        "entity_relationships",
        "correlations",
        "ai_assisted_findings",
        "supporting_evidence",
        "alternative_explanations",
        "recommended_verification",
        "investigator_review_status",
        "limitations",
    ]

    for sec in required_sections:
        assert sec in report, f"Missing required report section: {sec}"


def test_report_disclaimer_and_evidence_id_preservation(rich_investigation_state):
    """
    Mandatory Requirements:
    1. Must include 'AI-Assisted Draft — Requires Human Investigator Review'
    2. Every finding must preserve references to source evidence IDs.
    """
    res = report_agent(rich_investigation_state)
    report = res["structured_report"]

    assert report["disclaimer"] == "AI-Assisted Draft — Requires Human Investigator Review"

    findings = report["ai_assisted_findings"]
    assert len(findings) >= 1
    for f in findings:
        assert "referenced_evidence_ids" in f
        assert isinstance(f["referenced_evidence_ids"], list)
        assert len(f["referenced_evidence_ids"]) > 0


def test_report_html_renderer(rich_investigation_state):
    """
    Verify that standalone HTML renderer outputs print-ready HTML with disclaimer banner.
    """
    res = report_agent(rich_investigation_state)
    report_data = res["structured_report"]

    html = ReportService._render_html_report(report_data)

    assert "<!DOCTYPE html>" in html
    assert "AI-Assisted Draft — Requires Human Investigator Review" in html
    assert "1. Case Summary" in html
    assert "2. Evidence Inventory" in html
    assert "3. Evidence Integrity Status" in html
    assert "4. Investigation Timeline" in html
    assert "7. AI-Assisted Findings" in html
    assert "11. Investigator Review Status" in html
    assert "12. Limitations &amp; Uncertainty" in html or "12. Limitations" in html


def test_report_generate_request_schema_and_status():
    """Verify ReportGenerateRequest supports evidence/findings filters and ReportResponse includes status."""
    from app.schemas.report import ReportGenerateRequest, ReportResponse
    import datetime

    req = ReportGenerateRequest(
        title="Custom Report Title",
        report_format=ReportFormat.HTML,
        evidence_ids=[1, 2],
        finding_ids=["FND-101-AA"],
    )
    assert req.title == "Custom Report Title"
    assert req.evidence_ids == [1, 2]
    assert req.finding_ids == ["FND-101-AA"]

    resp = ReportResponse(
        id=1,
        report_id="RPT-1-ABC",
        case_id=101,
        title="Custom Report Title",
        report_format=ReportFormat.HTML,
        status="completed",
        created_at=datetime.datetime.now(datetime.timezone.utc),
    )
    assert resp.status == "completed"
    assert resp.report_id == "RPT-1-ABC"


def test_pdf_report_rendering(rich_investigation_state):
    """Verify that ReportService._render_pdf_report compiles a valid PDF binary with all sections."""
    from app.services.report_service import ReportService
    from app.agents.report_agent import report_agent

    rep_res = report_agent(rich_investigation_state)
    structured_data = rep_res.get("structured_report", {})

    pdf_bytes = ReportService._render_pdf_report(
        data=structured_data,
        title="Automated Forensic Report",
        report_id="RPT-TEST-001",
        case_id=1,
    )

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b"%PDF")


def test_renderer_resilience_with_none_values_and_unicode():
    """Verify that _render_html_report and _render_pdf_report gracefully handle None confidence, None scores, and unicode symbols."""
    from app.services.report_service import ReportService

    edge_data = {
        "disclaimer": "AI-Assisted Draft — Requires Human Investigator Review",
        "case_summary": {
            "case_number": "CASE-TEST-001",
            "title": "Unicode Test: Process Injection → Exfiltration",
            "description": "Observed lateral movement with arrows: 10.0.0.1 -> 10.0.0.2.",
            "priority": "high",
            "status": "active",
        },
        "evidence_inventory": [
            {
                "id": 1,
                "evidence_number": "EVD-001",
                "original_filename": "artifact_log.evtx",
                "mime_type": "application/octet-stream",
                "processing_status": "completed",
            }
        ],
        "evidence_integrity_status": [],
        "investigation_timeline": [],
        "entity_relationships": {"total_entities": 0, "entities_by_type": {}},
        "correlations": [
            {
                "correlation_id": "CORR-01",
                "title": "Time Correlation",
                "description": "Suspicious login correlation",
                "signal_type": "auth_anomaly",
                "score": None,  # None score test
                "supporting_evidence_ids": [1],
            }
        ],
        "ai_assisted_findings": [
            {
                "finding_id": "FND-01",
                "title": "Unusual Process Execution → PowerShell",
                "category": "Execution",
                "description": "PowerShell invoked with encoded arguments.",
                "confidence": None,  # None confidence test
                "review_status": "pending_review",
            }
        ],
        "supporting_evidence": [],
        "alternative_explanations": ["Scheduled maintenance script."],
        "recommended_verification": ["Verify scheduled tasks on host."],
        "investigator_review_status": [],
        "limitations": ["Limited forensic telemetry."],
    }

    # Verify HTML does not throw TypeError on None * 100
    html = ReportService._render_html_report(edge_data)
    assert "Unusual Process Execution" in html
    assert "85%" in html  # fallback default

    # Verify PDF does not throw TypeError on float(None) or FPDF UnicodeEncodeError
    pdf_bytes = ReportService._render_pdf_report(
        data=edge_data,
        title="Resilience Test Dossier",
        report_id="RPT-EDGE-001",
        case_id=1,
    )
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF")
