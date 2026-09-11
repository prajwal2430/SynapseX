"""
Missing Evidence Agent (Forensic Gap Analysis & Acquisition Guidance).

Responsibilities:
- Analyzes:
  1. Timeline gaps (unmonitored intervals between observed events)
  2. Incomplete correlations (one-sided network flows, unverified destination activity)
  3. Missing context (absent auth logs, missing CCTV, unmonitored USB volumes)
  4. Unsupported hypotheses (leads lacking corroborating telemetry)
- Emits structured recommendations containing:
  recommendation, reason, related_finding_id, related_evidence_ids, priority, gap_type.
- STRICT RULE: Does not present recommendations as mandatory conclusions.
"""
import datetime
import logging
from typing import Any, Dict, List, Set
import uuid
from app.agents.state import InvestigationRecommendation, InvestigationState

logger = logging.getLogger("adeip.agents.missing_evidence")

_DISCLAIMER = "Advisory recommendation. Presented as investigative acquisition guidance and not as a mandatory conclusion."


def missing_evidence_agent(state: InvestigationState) -> Dict[str, Any]:
    """
    Missing Evidence Agent: Identifies timeline gaps, incomplete correlations,
    missing context, and unsupported hypotheses.
    """
    case_id = state.get("case_id", 0)
    evidence_items = state.get("evidence_items", [])
    raw_events = state.get("raw_events", [])
    extracted_entities = state.get("extracted_entities", [])
    correlations = state.get("correlations", [])
    timeline = state.get("timeline", [])
    findings = state.get("findings", [])
    logs = list(state.get("agent_logs", []))

    logger.info(f"[MissingEvidenceAgent] Running forensic gap analysis for Case #{case_id}.")

    recommendations: List[Dict[str, Any]] = []
    seen_recommendations: Set[str] = set()

    evidence_ids = [ev.get("id") for ev in evidence_items if ev.get("id")]
    extensions_present = {
        ev.get("original_filename", "").split(".")[-1].lower()
        for ev in evidence_items
        if "." in ev.get("original_filename", "")
    }

    def add_recommendation(
        rec_title: str,
        reason_text: str,
        gap_type: str,
        priority: str = "medium",
        finding_id: Any = None,
        ev_ids: Any = None,
        source_hint: Any = None,
    ):
        sig = f"{gap_type}:{rec_title}"
        if sig in seen_recommendations:
            return
        seen_recommendations.add(sig)

        rec_id = f"REC-{case_id}-{uuid.uuid4().hex[:6].upper()}"
        target_ev_ids = [e for e in (ev_ids or evidence_ids) if e]

        item = InvestigationRecommendation(
            recommendation_id=rec_id,
            recommendation=rec_title,
            title=rec_title,
            reason=reason_text,
            rationale=reason_text,
            gap_type=gap_type,
            priority=priority,
            related_finding_id=finding_id,
            related_evidence_ids=target_ev_ids,
            referenced_evidence_ids=target_ev_ids,
            suggested_source=source_hint,
            disclaimer=_DISCLAIMER,
        )
        recommendations.append(item.model_dump())

    # ── Gap Analysis 1: Incomplete Correlations (Network Transfer / Cloud) ────
    ip_entities = [e for e in extracted_entities if e.get("entity_type") == "ip_address"]
    traffic_events = [e for e in raw_events if "traffic" in str(e.get("event_type", "")).lower() or "egress" in str(e.get("metadata", "")).lower()]

    if ip_entities or traffic_events:
        related_fnd = next((f.get("finding_id") for f in findings if "convergence" in str(f.get("category", "")).lower()), None)
        add_recommendation(
            rec_title="Review cloud audit logs and SaaS storage access records",
            reason_text="A network transfer or external IP activity was observed, but destination cloud storage and account session activity are not present in the available evidence.",
            gap_type="incomplete_correlation",
            priority="high",
            finding_id=related_fnd,
            ev_ids=[e.get("evidence_id") for e in ip_entities if e.get("evidence_id")],
            source_hint="Cloud Service Provider Audit Logs (AWS CloudTrail / Azure Activity / Google Cloud Audit)",
        )

    # ── Gap Analysis 2: Incomplete Correlations (USB Device Without File I/O) ──
    usb_entities = [e for e in extracted_entities if e.get("entity_type") == "usb_device"]
    file_events = [e for e in raw_events if e.get("entity_type") == "file" or "file" in str(e.get("event_type", "")).lower()]

    if usb_entities and not file_events:
        add_recommendation(
            rec_title="Acquire endpoint file-system journal and USB file copy telemetry",
            reason_text="A mass storage USB device insertion was recorded, but specific file read/write audit logs on the removable volume are absent.",
            gap_type="incomplete_correlation",
            priority="critical",
            ev_ids=[u.get("evidence_id") for u in usb_entities if u.get("evidence_id")],
            source_hint="NTFS $UsnJrnl / $LogFile or Endpoint Detection and Response (EDR) telemetry",
        )

    # ── Gap Analysis 3: Timeline Gaps (> 15 Minutes Between Consecutive Events) ──
    if len(timeline) >= 2:
        for i in range(len(timeline) - 1):
            t1_str = timeline[i].get("timestamp_utc") or timeline[i].get("timestamp")
            t2_str = timeline[i + 1].get("timestamp_utc") or timeline[i + 1].get("timestamp")

            if t1_str and t2_str:
                try:
                    dt1 = datetime.datetime.fromisoformat(t1_str)
                    dt2 = datetime.datetime.fromisoformat(t2_str)
                    gap_mins = int((dt2 - dt1).total_seconds() / 60)

                    if gap_mins >= 15:
                        ev_a = timeline[i].get("event_id")
                        ev_b = timeline[i + 1].get("event_id")
                        add_recommendation(
                            rec_title=f"Acquire intermediate host activity logs for {gap_mins}-minute timeline gap",
                            reason_text=f"A timeline gap of {gap_mins} minutes was detected between Event #{ev_a} and Event #{ev_b} with no recorded system telemetry.",
                            gap_type="timeline_gap",
                            priority="medium",
                            ev_ids=[timeline[i].get("evidence_id"), timeline[i + 1].get("evidence_id")],
                            source_hint="System Event Logs / Windows System.evtx / Linux Syslog",
                        )
                        break  # Report primary gap
                except Exception:
                    pass

    # ── Gap Analysis 4: Missing Context (Authentication & Host Security) ──────
    if "evtx" not in extensions_present:
        add_recommendation(
            rec_title="Acquire Windows Security Event Log (Security.evtx)",
            reason_text="Current evidence inventory lacks dedicated Windows Security Event Logs to corroborate interactive logon sessions (Event IDs 4624, 4625, 4672).",
            gap_type="missing_context",
            priority="high",
            source_hint="C:\\Windows\\System32\\winevt\\Logs\\Security.evtx",
        )

    # ── Gap Analysis 5: Missing Context (Unverified Evidence Integrity) ────────
    unverified_evs = [ev for ev in evidence_items if ev.get("integrity_status") != "verified"]
    if unverified_evs:
        unverified_ids = [ev.get("id") for ev in unverified_evs if ev.get("id")]
        add_recommendation(
            rec_title="Execute cryptographic SHA-256 integrity verification on evidence artifacts",
            reason_text=f"{len(unverified_ids)} evidence item(s) (IDs: {unverified_ids}) have not undergone cryptographic hash verification, leaving chain-of-custody validity unconfirmed.",
            gap_type="missing_context",
            priority="high",
            ev_ids=unverified_ids,
            source_hint="ADEIP Cryptographic Verification API (POST /api/evidence/{id}/verify)",
        )

    # ── Gap Analysis 6: Unsupported Hypotheses (Exfiltration Byte Confirmation) ─
    exfil_findings = [f for f in findings if "exfiltration" in str(f.get("title", "")).lower() or "convergence" in str(f.get("category", "")).lower()]
    if exfil_findings and "pcap" not in extensions_present:
        add_recommendation(
            rec_title="Acquire perimeter NetFlow telemetry or full packet capture (PCAP)",
            reason_text="Investigative hypotheses identify potential data staging/egress, but raw flow counters or PCAP bytes are required to verify exact payload volume.",
            gap_type="unsupported_hypothesis",
            priority="medium",
            finding_id=exfil_findings[0].get("finding_id"),
            source_hint="Border Firewall Flow Logs (IPFIX / NetFlow v9) or Network TAP PCAP",
        )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    logs.append({
        "agent": "missing_evidence_agent",
        "timestamp": now_iso,
        "details": f"Formulated {len(recommendations)} advisory evidence gap recommendations.",
        "status": "completed",
    })

    return {
        "recommendations": recommendations,
        "agent_logs": logs,
    }
