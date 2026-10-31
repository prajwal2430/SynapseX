"""
Correlation Agent (Explainable Multi-Signal Forensic Correlation Engine).

Responsibilities:
- Ingests normalized events, extracted entities, and timeline sequences.
- Identifies potential correlations across:
  1. same_device
  2. same_user_account
  3. same_ip_address
  4. same_file (filename or cryptographic hash)
  5. shared_evidence_context (co-occurring entities)
  6. timestamp_proximity (cross-source temporal clustering)
  7. multi_signal_convergence (confluence of multiple indicators)
- Every correlation contains:
  correlation_id, related_event_ids, related_entity_ids, supporting_evidence_ids,
  reasons, correlation_score, and explicit non-proof disclaimer.
"""
from collections import defaultdict
import datetime
import logging
from typing import Any, Dict, List, Set, Tuple
import uuid
from app.agents.state import CorrelationItem, InvestigationState

logger = logging.getLogger("adeip.agents.correlation")

_DISCLAIMER = "Potential relationship detected. Observational correlation does not establish causation or definitive proof."


def correlation_agent(state: InvestigationState) -> Dict[str, Any]:
    """
    Correlation Agent: Evaluates extracted entities, events, and timeline
    to formulate explainable, score-weighted correlation signals.
    """
    case_id = state.get("case_id", 0)
    extracted_entities = state.get("extracted_entities", [])
    raw_events = state.get("raw_events", [])
    timeline = state.get("timeline", [])
    logs = list(state.get("agent_logs", []))

    logger.info(f"[CorrelationAgent] Running explainable correlation engine for Case #{case_id}.")

    correlations: List[Dict[str, Any]] = []
    seen_signatures: Set[str] = set()

    def add_correlation(
        signal_type: str,
        title: str,
        desc: str,
        reasons: List[str],
        event_ids: List[int],
        entity_ids: List[int],
        evidence_ids: List[int],
        score: float,
        entities_list: List[str],
    ):
        sig = f"{signal_type}:" + ",".join(sorted(entities_list)) + ":" + ",".join(map(str, sorted(evidence_ids)))
        if sig in seen_signatures:
            return
        seen_signatures.add(sig)

        corr_id = f"CORR-{case_id}-{uuid.uuid4().hex[:6].upper()}"
        item = CorrelationItem(
            correlation_id=corr_id,
            signal_type=signal_type,
            title=title,
            description=desc,
            reasons=reasons,
            related_event_ids=sorted(list(set(event_ids))),
            related_entity_ids=sorted(list(set(entity_ids))),
            supporting_evidence_ids=sorted(list(set(evidence_ids))),
            correlation_score=round(min(1.0, max(0.1, score)), 2),
            entities=entities_list,
            confidence=round(score, 2),
            disclaimer=_DISCLAIMER,
        )
        dumped = item.model_dump()
        dumped["correlation_type"] = "cross_evidence_match" if len(set(evidence_ids)) > 1 else signal_type
        dumped["evidence_ids"] = sorted(list(set(evidence_ids)))
        dumped["event_ids"] = sorted(list(set(event_ids)))
        correlations.append(dumped)

    # ── Map entities by normalized value and type ──────────────────────────
    entities_by_type_val = defaultdict(list)
    for idx, ent in enumerate(extracted_entities):
        e_type = ent.get("entity_type", "generic")
        norm_val = ent.get("normalized_value") or ent.get("entity_value", "").strip().lower()
        key = (e_type, norm_val)
        entities_by_type_val[key].append((idx, ent))

    # ── Signal 1: same_ip_address ──────────────────────────────────────────
    for (e_type, val), ent_tuples in entities_by_type_val.items():
        if e_type == "ip_address":
            all_ev_ids = {ent.get("evidence_id") for _, ent in ent_tuples if ent.get("evidence_id")}
            all_event_ids = set()
            for _, ent in ent_tuples:
                all_event_ids.update(ent.get("event_ids", []))
                if ent.get("event_id"):
                    all_event_ids.add(ent.get("event_id"))

            if len(all_ev_ids) > 1 or len(all_event_ids) >= 2:
                reasons = [
                    f"IP address '{val}' is referenced across {len(all_event_ids)} event(s) in {len(all_ev_ids)} evidence artifact(s).",
                    f"Supporting evidence IDs: {sorted(list(all_ev_ids))}.",
                    "Potential relationship detected showing network communication converging on this common IP identifier.",
                ]
                score = 0.90 if len(all_ev_ids) > 1 else 0.82
                add_correlation(
                    signal_type="same_ip_address",
                    title=f"Potential Relationship: Common IP Address '{val}'",
                    desc=f"Potential relationship detected: IP address '{val}' appears across multiple events/evidence files.",
                    reasons=reasons,
                    event_ids=list(all_event_ids),
                    entity_ids=[idx for idx, _ in ent_tuples],
                    evidence_ids=list(all_ev_ids),
                    score=score,
                    entities_list=[f"ip_address:{val}"],
                )

    # ── Signal 2: same_user_account ────────────────────────────────────────
    for (e_type, val), ent_tuples in entities_by_type_val.items():
        if e_type in ("user_account", "person"):
            all_ev_ids = {ent.get("evidence_id") for _, ent in ent_tuples if ent.get("evidence_id")}
            all_event_ids = set()
            for _, ent in ent_tuples:
                all_event_ids.update(ent.get("event_ids", []))
                if ent.get("event_id"):
                    all_event_ids.add(ent.get("event_id"))

            if len(all_ev_ids) > 1 or len(all_event_ids) >= 2:
                reasons = [
                    f"User/account identity '{val}' is present in {len(all_event_ids)} event(s) across evidence {sorted(list(all_ev_ids))}.",
                    "Potential relationship detected linking activities, access credentials, or session logs to this common identity.",
                ]
                score = 0.92 if len(all_ev_ids) > 1 else 0.85
                add_correlation(
                    signal_type="same_user_account",
                    title=f"Potential Relationship: Shared User Identity '{val}'",
                    desc=f"Potential relationship detected: User account or identity '{val}' observed across multiple sources.",
                    reasons=reasons,
                    event_ids=list(all_event_ids),
                    entity_ids=[idx for idx, _ in ent_tuples],
                    evidence_ids=list(all_ev_ids),
                    score=score,
                    entities_list=[f"{e_type}:{val}"],
                )

    # ── Signal 3: same_device / usb_device ─────────────────────────────────
    for (e_type, val), ent_tuples in entities_by_type_val.items():
        if e_type in ("device", "usb_device"):
            all_ev_ids = {ent.get("evidence_id") for _, ent in ent_tuples if ent.get("evidence_id")}
            all_event_ids = set()
            for _, ent in ent_tuples:
                all_event_ids.update(ent.get("event_ids", []))
                if ent.get("event_id"):
                    all_event_ids.add(ent.get("event_id"))

            if len(all_ev_ids) > 1 or len(all_event_ids) >= 2:
                reasons = [
                    f"Hardware/device identifier '{val}' ({e_type}) was recorded in {len(all_event_ids)} event(s).",
                    f"Evidence sources involved: {sorted(list(all_ev_ids))}.",
                    "Potential relationship detected indicating physical or virtual endpoint involvement across events.",
                ]
                score = 0.88 if len(all_ev_ids) > 1 else 0.80
                add_correlation(
                    signal_type="same_device",
                    title=f"Potential Relationship: Common Device '{val}'",
                    desc=f"Potential relationship detected: Device or hardware signature '{val}' observed across events.",
                    reasons=reasons,
                    event_ids=list(all_event_ids),
                    entity_ids=[idx for idx, _ in ent_tuples],
                    evidence_ids=list(all_ev_ids),
                    score=score,
                    entities_list=[f"{e_type}:{val}"],
                )

    # ── Signal 4: same_file (filename or hash) ─────────────────────────────
    for (e_type, val), ent_tuples in entities_by_type_val.items():
        if e_type in ("file", "file_hash"):
            all_ev_ids = {ent.get("evidence_id") for _, ent in ent_tuples if ent.get("evidence_id")}
            all_event_ids = set()
            for _, ent in ent_tuples:
                all_event_ids.update(ent.get("event_ids", []))
                if ent.get("event_id"):
                    all_event_ids.add(ent.get("event_id"))

            if len(all_ev_ids) > 1 or len(all_event_ids) >= 2:
                reasons = [
                    f"File artifact or cryptographic hash '{val}' is referenced across {len(all_event_ids)} event(s).",
                    "Potential relationship detected indicating identical payload staging, execution, or exfiltration.",
                ]
                score = 0.94 if e_type == "file_hash" else 0.87
                add_correlation(
                    signal_type="same_file",
                    title=f"Potential Relationship: Identical File Reference '{val}'",
                    desc=f"Potential relationship detected: File name or hash '{val}' appears in multiple investigation records.",
                    reasons=reasons,
                    event_ids=list(all_event_ids),
                    entity_ids=[idx for idx, _ in ent_tuples],
                    evidence_ids=list(all_ev_ids),
                    score=score,
                    entities_list=[f"{e_type}:{val}"],
                )

    # ── Signal 5: timestamp_proximity across distinct evidence ─────────────
    if len(timeline) >= 2:
        for i in range(len(timeline) - 1):
            ev1 = timeline[i]
            ev2 = timeline[i + 1]

            ts1_str = ev1.get("timestamp_utc") or ev1.get("timestamp")
            ts2_str = ev2.get("timestamp_utc") or ev2.get("timestamp")

            if ts1_str and ts2_str and ev1.get("evidence_id") != ev2.get("evidence_id"):
                try:
                    dt1 = datetime.datetime.fromisoformat(ts1_str)
                    dt2 = datetime.datetime.fromisoformat(ts2_str)
                    delta_sec = abs((dt2 - dt1).total_seconds())

                    if delta_sec <= 300:  # within 5 minutes
                        ev_ids = [ev1.get("evidence_id"), ev2.get("evidence_id")]
                        event_ids = [ev1.get("event_id"), ev2.get("event_id")]
                        reasons = [
                            f"Event #{ev1.get('event_id')} ({ev1.get('event_type')}) and Event #{ev2.get('event_id')} ({ev2.get('event_type')}) occurred within {int(delta_sec)}s.",
                            f"Observed across separate evidence artifacts (IDs: {ev_ids}).",
                            "Potential relationship detected based on synchronized timing across physical/digital sources.",
                        ]
                        add_correlation(
                            signal_type="timestamp_proximity",
                            title=f"Potential Relationship: Temporal Synchronization ({int(delta_sec)}s delta)",
                            desc=f"Potential relationship detected: Events #{ev1.get('event_id')} and #{ev2.get('event_id')} occurred within {int(delta_sec)} seconds.",
                            reasons=reasons,
                            event_ids=[e for e in event_ids if e],
                            entity_ids=[],
                            evidence_ids=[e for e in ev_ids if e],
                            score=0.80,
                            entities_list=ev1.get("entities", []) + ev2.get("entities", []),
                        )
                except Exception:
                    pass

    # ── Signal 6: multi_signal_convergence ─────────────────────────────────
    # If a case has both a shared IP/User and a temporal proximity correlation, formulate a convergence signal
    ip_corrs = [c for c in correlations if c["signal_type"] == "same_ip_address"]
    user_corrs = [c for c in correlations if c["signal_type"] == "same_user_account"]
    time_corrs = [c for c in correlations if c["signal_type"] == "timestamp_proximity"]

    if (ip_corrs or user_corrs) and time_corrs:
        converged_events = set()
        converged_evs = set()
        converged_entities = set()

        for c in ip_corrs + user_corrs + time_corrs[:2]:
            converged_events.update(c["related_event_ids"])
            converged_evs.update(c["supporting_evidence_ids"])
            converged_entities.update(c["entities"])

        reasons = [
            f"Multiple independent correlation signals converged across {len(converged_evs)} evidence files.",
            f"Signals involved: Shared Identifiers ({len(ip_corrs + user_corrs)}) and Temporal Synchronization ({len(time_corrs)}).",
            "Potential relationship detected indicating a coherent multi-stage investigation pattern.",
        ]
        add_correlation(
            signal_type="multi_signal_convergence",
            title="Potential Relationship: Multi-Signal Convergence",
            desc="Potential relationship detected: Confluence of shared network/user identifiers with temporal proximity.",
            reasons=reasons,
            event_ids=list(converged_events),
            entity_ids=[],
            evidence_ids=list(converged_evs),
            score=0.95,
            entities_list=list(converged_entities)[:6],
        )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    logs.append({
        "agent": "correlation_agent",
        "timestamp": now_iso,
        "details": f"Generated {len(correlations)} explainable correlation signals.",
        "status": "completed",
    })

    return {
        "correlations": correlations,
        "agent_logs": logs,
    }
