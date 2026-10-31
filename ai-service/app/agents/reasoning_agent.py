"""
Reasoning Agent (Structured Forensic Reasoning Engine).

Responsibilities:
- Evaluates timeline, correlations, entities, and evidence artifacts.
- Emits structured output matching the strict 7-element forensic schema:
  {
    "summary": "...",
    "observations": [],
    "potential_hypotheses": [],
    "supporting_evidence": [],
    "alternative_explanations": [],
    "recommended_verification": [],
    "limitations": []
  }

STRICT COMPLIANCE RULES:
1. Do not declare a person guilty.
2. Do not treat probability or AI confidence as proof.
3. Every observation must reference supporting evidence or events.
4. Include alternative explanations where reasonable.
5. Clearly identify uncertainty.
6. If evidence is insufficient, explicitly say so.
"""
import datetime
import logging
from typing import Any, Dict, List
import uuid
from app.agents.state import InvestigationFinding, InvestigationState

logger = logging.getLogger("adeip.agents.reasoning")


def reasoning_agent(state: InvestigationState) -> Dict[str, Any]:
    """
    Reasoning Agent: Generates structured, evidence-grounded hypotheses,
    observations, alternative explanations, and verification steps.
    """
    case_id = state.get("case_id", 0)
    case_info = state.get("case_info", {})
    evidence_items = state.get("evidence_items", [])
    raw_events = state.get("raw_events", [])
    extracted_entities = state.get("extracted_entities", [])
    correlations = state.get("correlations", [])
    timeline = state.get("timeline", [])
    logs = list(state.get("agent_logs", []))

    logger.info(f"[ReasoningAgent] Executing forensic reasoning engine for Case #{case_id}.")

    evidence_ids = [ev.get("id") for ev in evidence_items if ev.get("id")]
    event_ids = [e.get("id") for e in raw_events if e.get("id")]

    # ── 1. Synthesize Observations (Strictly Evidence-Referenced) ────────────
    observations: List[Dict[str, Any]] = []

    # Observation from correlations
    for corr in correlations:
        corr_evs = corr.get("supporting_evidence_ids", [])
        corr_events = corr.get("related_event_ids", [])
        observations.append({
            "observation": f"Documented correlation ({corr.get('signal_type')}): {corr.get('title')}",
            "details": corr.get("description"),
            "referenced_evidence_ids": corr_evs,
            "referenced_event_ids": corr_events[:10],
            "entities": corr.get("entities", []),
            "confidence": corr.get("correlation_score", 0.85),
        })

    # Observations from Timeline clusters
    if len(timeline) >= 2:
        observations.append({
            "observation": f"Chronological event sequence identified across {len(timeline)} timeline moments.",
            "details": f"Events span from {timeline[0].get('timestamp')} to {timeline[-1].get('timestamp')}.",
            "referenced_evidence_ids": evidence_ids,
            "referenced_event_ids": event_ids[:15],
            "entities": [f"{e.get('entity_type')}:{e.get('entity_value')}" for e in extracted_entities[:5]],
            "confidence": 0.90,
        })

    # Observations from Unverified Evidence
    unverified_evs = [ev for ev in evidence_items if ev.get("integrity_status") != "verified"]
    if unverified_evs:
        unverified_ids = [ev.get("id") for ev in unverified_evs]
        observations.append({
            "observation": f"{len(unverified_ids)} evidence item(s) have unverified cryptographic integrity.",
            "details": f"Evidence IDs {unverified_ids} have not completed cryptographic SHA-256 integrity verification.",
            "referenced_evidence_ids": unverified_ids,
            "referenced_event_ids": [],
            "entities": [],
            "confidence": 1.0,
        })

    # Baseline observation if few events exist
    if not observations:
        observations.append({
            "observation": f"Baseline ingestion recorded for {len(evidence_items)} evidence artifact(s).",
            "details": "Evidence files registered; awaiting additional parsed events or supplementary sources.",
            "referenced_evidence_ids": evidence_ids,
            "referenced_event_ids": event_ids[:5],
            "entities": [],
            "confidence": 0.80,
        })

    # ── 2. Potential Hypotheses (Investigative Leads, NEVER Guilt Declarations) ──
    potential_hypotheses: List[str] = []

    ip_corrs = [c for c in correlations if c.get("signal_type") == "same_ip_address"]
    user_corrs = [c for c in correlations if c.get("signal_type") == "same_user_account"]
    device_corrs = [c for c in correlations if c.get("signal_type") == "same_device"]
    file_corrs = [c for c in correlations if c.get("signal_type") == "same_file"]

    if ip_corrs and user_corrs:
        potential_hypotheses.append(
            "Hypothesis 1 (Coordinated Interactive Session): Observational convergence between external IP traffic "
            "and user authentication records suggests an active remote or local interactive session occurred during the event window."
        )

    if device_corrs or file_corrs:
        potential_hypotheses.append(
            "Hypothesis 2 (Local Staging / Artifact Movement): Multiple events referencing the same host terminal or file payload "
            "suggest local staging or file duplication occurred across endpoints."
        )

    if not potential_hypotheses:
        potential_hypotheses.append(
            "Hypothesis (Initial Ingestion State): Initial data points establish a baseline activity log. "
            "Further triage is required to confirm whether anomalies represent intentional activity or standard operations."
        )

    # ── 3. Supporting Evidence References ────────────────────────────────────
    supporting_evidence: List[Dict[str, Any]] = [
        {
            "evidence_id": ev.get("id"),
            "original_filename": ev.get("original_filename"),
            "sha256_hash": ev.get("sha256_hash"),
            "integrity_status": ev.get("integrity_status", "unverified"),
        }
        for ev in evidence_items
    ]

    # ── 4. Alternative Explanations (Crucial Forensic Balance) ───────────────
    alternative_explanations: List[str] = [
        "Alternative 1 (Credential Sharing or Compromise): The recorded user account may have been utilized by an unauthorized third party without the legitimate account owner's knowledge or consent.",
        "Alternative 2 (Automated / Scheduled Administrative Task): The observed data transfers or service authentications could be the result of scheduled maintenance scripts, remote backups, or monitoring agents.",
        "Alternative 3 (Shared Endpoint / NAT Proxying): Network events linking to a single IP address may represent multiple independent endpoints behind a Network Address Translation (NAT) router or forward proxy.",
    ]

    # ── 5. Recommended Verification Steps (Actionable for Investigator) ───────
    recommended_verification: List[str] = [
        "Verify physical access badge swipe logs against independent CCTV recordings for the corresponding timestamps.",
        "Perform cryptographic SHA-256 hash verification on all unverified evidence items (POST /api/evidence/{id}/verify).",
        "Inspect host volatile memory dump (RAM) or endpoint MFT/USN journals to confirm process execution trees.",
        "Request border firewall connection state tables and NetFlow records to measure exact egress byte volumes.",
        "Conduct an investigator interview to confirm authorized administrative activity during the identified time window.",
    ]

    # ── 6. Limitations & Explicit Uncertainty ────────────────────────────────
    limitations: List[str] = []
    if len(evidence_items) < 3:
        limitations.append(
            f"Evidence sample size is limited ({len(evidence_items)} file(s)). Additional corroborating telemetry is recommended."
        )
    if unverified_evs:
        limitations.append(
            f"Integrity verification is incomplete for {len(unverified_evs)} evidence item(s). Custody validity must be confirmed."
        )
    limitations.append(
        "AI reasoning represents observational pattern recognition. Probabilistic confidence scores do NOT constitute legal proof."
    )
    if not raw_events:
        limitations.append(
            "No structured events have been parsed for this case. Ingestion is insufficient for definitive sequencing."
        )

    # ── 7. Executive Summary ─────────────────────────────────────────────────
    summary_text = (
        f"Forensic reasoning assessment conducted for Case #{case_id} ({case_info.get('title', 'Investigation')}). "
        f"Synthesized {len(observations)} grounded observation(s) across {len(evidence_items)} evidence artifact(s) "
        f"and {len(timeline)} timeline event(s). Formulated {len(potential_hypotheses)} tentative investigative lead(s) "
        f"with {len(alternative_explanations)} alternative non-malicious scenarios. "
        "All findings are observational and require investigator validation."
    )

    reasoning_payload: Dict[str, Any] = {
        "summary": summary_text,
        "observations": observations,
        "potential_hypotheses": potential_hypotheses,
        "supporting_evidence": supporting_evidence,
        "alternative_explanations": alternative_explanations,
        "recommended_verification": recommended_verification,
        "limitations": limitations,
    }

    # ── Formulate structured InvestigationFinding records for DB storage ────
    findings_list: List[Dict[str, Any]] = []
    for idx, hyp in enumerate(potential_hypotheses, start=1):
        fnd_id = f"FND-{case_id}-{uuid.uuid4().hex[:6].upper()}"
        finding = InvestigationFinding(
            finding_id=fnd_id,
            title=f"Investigative Lead #{idx}: {hyp.split(':')[0]}",
            description=hyp,
            confidence=0.85,
            category="reasoning_lead",
            referenced_evidence_ids=evidence_ids,
            referenced_event_ids=event_ids[:15],
            supporting_entities=[f"{e.get('entity_type')}:{e.get('entity_value')}" for e in extracted_entities[:5]],
        )
        findings_list.append(finding.model_dump())

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    logs.append({
        "agent": "reasoning_agent",
        "timestamp": now_iso,
        "details": f"Synthesized reasoning assessment with {len(observations)} observations and {len(potential_hypotheses)} hypotheses.",
        "status": "completed",
    })

    return {
        "reasoning_output": reasoning_payload,
        "findings": findings_list,
        "agent_logs": logs,
    }
