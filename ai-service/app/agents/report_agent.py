"""
Report Agent (Investigation Report Synthesis).

Responsibilities:
- Synthesizes all analytical outputs into a comprehensive 12-section investigation report:
  1. Case Summary
  2. Evidence Inventory
  3. Evidence Integrity Status
  4. Investigation Timeline
  5. Entity Relationships
  6. Correlations
  7. AI-Assisted Findings
  8. Supporting Evidence
  9. Alternative Explanations
  10. Recommended Verification
  11. Investigator Review Status
  12. Limitations
- Enforces mandatory forensic disclaimer:
  "AI-Assisted Draft — Requires Human Investigator Review"
- Preserves explicit references to source evidence IDs and event IDs across every finding.
"""
import datetime
import logging
from typing import Any, Dict, List
from app.agents.state import InvestigationState

logger = logging.getLogger("adeip.agents.report")

_DISCLAIMER = "AI-Assisted Draft — Requires Human Investigator Review"


def report_agent(state: InvestigationState) -> Dict[str, Any]:
    """
    Report Agent: Compiles the 12-section investigation report data structure.
    """
    case_id = state.get("case_id", 0)
    case_info = state.get("case_info", {})
    evidence_items = state.get("evidence_items", [])
    raw_events = state.get("raw_events", [])
    extracted_entities = state.get("extracted_entities", [])
    timeline = state.get("timeline", [])
    correlations = state.get("correlations", [])
    findings = state.get("findings", [])
    recommendations = state.get("recommendations", [])
    reasoning_out = state.get("reasoning_output", {})
    logs = list(state.get("agent_logs", []))

    logger.info(f"[ReportAgent] Synthesizing comprehensive 12-section report for Case #{case_id}.")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # 1. Case Summary
    case_summary = {
        "case_id": case_id,
        "case_number": case_info.get("case_number", f"CASE-{case_id:04d}"),
        "title": case_info.get("title", f"Investigation #{case_id}"),
        "description": case_info.get("description", "Digital forensic intelligence case."),
        "executive_summary": case_info.get("description") or f"Forensic analysis and intelligence summary for Case #{case_id}.",
        "priority": case_info.get("priority", "medium"),
        "status": case_info.get("status", "open"),
        "created_at": case_info.get("created_at"),
        "generated_at": now_iso,
    }

    # 2. Evidence Inventory
    evidence_inventory = [
        {
            "id": ev.get("id"),
            "evidence_number": ev.get("evidence_number", f"EVD-{ev.get('id')}"),
            "original_filename": ev.get("original_filename"),
            "file_size": ev.get("file_size"),
            "mime_type": ev.get("mime_type"),
            "processing_status": ev.get("processing_status", "completed"),
            "created_at": ev.get("created_at"),
        }
        for ev in evidence_items
    ]

    # 3. Evidence Integrity Status
    evidence_integrity_status = [
        {
            "evidence_id": ev.get("id"),
            "original_filename": ev.get("original_filename"),
            "sha256_hash": ev.get("sha256_hash"),
            "integrity_status": ev.get("integrity_status", "unverified"),
            "last_verified_at": ev.get("last_verified_at"),
        }
        for ev in evidence_items
    ]

    # 4. Investigation Timeline
    investigation_timeline = [
        {
            "event_id": t.get("event_id") or t.get("id"),
            "timestamp": t.get("timestamp_utc") or t.get("timestamp"),
            "event_type": t.get("event_type"),
            "source": t.get("source"),
            "entity_type": t.get("entity_type"),
            "entity_value": t.get("entity_value"),
            "details": t.get("details") or str(t.get("metadata", "")),
        }
        for t in (timeline if timeline else raw_events[:50])
    ]

    # 5. Entity Relationships
    entity_relationships = {
        "total_entities": len(extracted_entities),
        "entities_by_type": {},
        "key_entities": [
            {
                "type": ent.get("entity_type"),
                "value": ent.get("entity_value"),
                "evidence_id": ent.get("evidence_id"),
                "confidence": ent.get("confidence", 1.0),
            }
            for ent in extracted_entities[:20]
        ],
    }
    for ent in extracted_entities:
        t = ent.get("entity_type", "other")
        entity_relationships["entities_by_type"][t] = entity_relationships["entities_by_type"].get(t, 0) + 1

    # 6. Correlations
    report_correlations = [
        {
            "correlation_id": c.get("correlation_id"),
            "signal_type": c.get("signal_type"),
            "title": c.get("title"),
            "description": c.get("description"),
            "reasons": c.get("reasons", []),
            "score": c.get("correlation_score", 0.85),
            "supporting_evidence_ids": c.get("supporting_evidence_ids", []),
            "related_event_ids": c.get("related_event_ids", []),
        }
        for c in correlations
    ]

    # 7. AI-Assisted Findings
    ai_assisted_findings = [
        {
            "finding_id": f.get("finding_id"),
            "title": f.get("title"),
            "category": f.get("category"),
            "description": f.get("description") or f.get("summary"),
            "confidence": f.get("confidence", 0.85),
            "referenced_evidence_ids": f.get("referenced_evidence_ids", []),
            "referenced_event_ids": f.get("referenced_event_ids", []),
            "review_status": f.get("review_status", "pending_review"),
        }
        for f in findings
    ]

    # 8. Supporting Evidence (Mapping per finding)
    supporting_evidence = []
    for f in findings:
        ev_ids = f.get("referenced_evidence_ids", [])
        matched_evs = [ev for ev in evidence_items if ev.get("id") in ev_ids]
        supporting_evidence.append({
            "finding_id": f.get("finding_id"),
            "finding_title": f.get("title"),
            "referenced_evidence_ids": ev_ids,
            "evidence_files": [
                {
                    "evidence_id": ev.get("id"),
                    "filename": ev.get("original_filename"),
                    "sha256_hash": ev.get("sha256_hash"),
                }
                for ev in matched_evs
            ],
        })

    # 9. Alternative Explanations
    alternative_explanations = reasoning_out.get("alternative_explanations") or [
        "Credential Sharing / Unauthorized Account Use: Recorded account activity may represent an unapproved third-party session.",
        "Automated Administrative Task: Observed telemetry may correlate with scheduled maintenance scripts or system backups.",
        "Shared Egress NAT / Proxy: Public IP traffic could encapsulate multiple unrelated internal nodes.",
    ]

    # 10. Recommended Verification
    recommended_verification = reasoning_out.get("recommended_verification") or [
        r.get("recommendation") for r in recommendations if r.get("recommendation")
    ] or [
        "Corroborate physical door swipe records with video surveillance cameras.",
        "Perform cryptographic SHA-256 hash checks on unverified evidence items.",
        "Conduct an investigator interview to confirm authorized administrative activities.",
    ]

    # 11. Investigator Review Status
    investigator_review_status = [
        {
            "finding_id": f.get("finding_id"),
            "title": f.get("title"),
            "review_status": f.get("review_status", "pending_review"),
            "reviewed_by": f.get("reviewed_by"),
            "reviewer_notes": f.get("reviewer_notes"),
            "reviewed_at": f.get("reviewed_at"),
        }
        for f in findings
    ]

    # 12. Limitations
    limitations = reasoning_out.get("limitations") or [
        "AI reasoning represents observational pattern recognition. Probabilistic confidence scores do NOT constitute legal proof.",
        "All analytical findings are advisory investigative leads and require verification by an authorized human investigator.",
    ]

    structured_report = {
        "disclaimer": _DISCLAIMER,
        "generated_at": now_iso,
        "case_summary": case_summary,
        "evidence_inventory": evidence_inventory,
        "evidence_integrity_status": evidence_integrity_status,
        "investigation_timeline": investigation_timeline,
        "entity_relationships": entity_relationships,
        "correlations": report_correlations,
        "ai_assisted_findings": ai_assisted_findings,
        "supporting_evidence": supporting_evidence,
        "alternative_explanations": alternative_explanations,
        "recommended_verification": recommended_verification,
        "investigator_review_status": investigator_review_status,
        "limitations": limitations,
    }

    logs.append({
        "agent": "report_agent",
        "timestamp": now_iso,
        "details": f"12-section investigation report synthesized for Case #{case_id}.",
        "status": "completed",
    })

    return {
        "structured_report": structured_report,
        "report_summary": case_summary,
        "status": "completed",
        "agent_logs": logs,
    }
