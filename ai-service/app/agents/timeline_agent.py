"""
Timeline Agent (Deterministic Chronological Reconstruction & Sequencing).

Responsibilities:
1. Normalizes timestamps to UTC while strictly preserving original timestamps.
2. Sorts multi-source investigation events chronologically.
3. Groups events into configurable temporal clusters/windows.
4. Identifies possible event sequences using deterministic rule patterns.
5. Strictly separates observed facts from possible causal relationships.
"""
import datetime
import logging
from typing import Any, Dict, List, Optional, Tuple
import uuid
from app.agents.state import InvestigationState

logger = logging.getLogger("adeip.agents.timeline")


def parse_and_normalize_timestamp(ts_input: Any) -> Tuple[Optional[datetime.datetime], Optional[str]]:
    """
    Parses timestamp into UTC timezone-aware datetime while preserving the original string.
    Returns: (normalized_utc_datetime, original_timestamp_string)
    """
    if ts_input is None:
        return None, None

    orig_str = str(ts_input).strip()
    if not orig_str:
        return None, None

    if isinstance(ts_input, datetime.datetime):
        if ts_input.tzinfo is None:
            return ts_input.replace(tzinfo=datetime.timezone.utc), orig_str
        return ts_input.astimezone(datetime.timezone.utc), orig_str

    # Common forensic timestamp formats
    formats = [
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S%z",
        "%Y-%m-%d %H:%M:%S",
        "%Y/%m/%d %H:%M:%S",
        "%d/%m/%Y %H:%M:%S",
        "%m/%d/%Y %H:%M:%S",
        "%Y-%m-%d",
    ]

    # Handle 'Z' suffix
    clean_str = orig_str.replace("Z", "+00:00") if "T" in orig_str and orig_str.endswith("Z") else orig_str

    for fmt in formats:
        try:
            dt = datetime.datetime.strptime(clean_str, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=datetime.timezone.utc)
            else:
                dt = dt.astimezone(datetime.timezone.utc)
            return dt, orig_str
        except (ValueError, TypeError):
            continue

    # Attempt ISO fromisoformat fallback
    try:
        dt = datetime.datetime.fromisoformat(clean_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        else:
            dt = dt.astimezone(datetime.timezone.utc)
        return dt, orig_str
    except Exception:
        pass

    return None, orig_str


def cluster_events_by_window(
    events: List[Dict[str, Any]],
    window_seconds: int = 300,
) -> List[Dict[str, Any]]:
    """
    Groups chronologically sorted events into temporal window clusters.
    """
    timestamped_events = [e for e in events if e.get("timestamp_utc") is not None]
    if not timestamped_events:
        return []

    clusters: List[Dict[str, Any]] = []
    current_cluster_events = [timestamped_events[0]]
    cluster_start = timestamped_events[0]["timestamp_utc"]

    for ev in timestamped_events[1:]:
        ev_ts = ev["timestamp_utc"]
        delta = (ev_ts - cluster_start).total_seconds()

        if delta <= window_seconds:
            current_cluster_events.append(ev)
        else:
            # Finalize previous cluster
            c_start = current_cluster_events[0]["timestamp_utc"]
            c_end = current_cluster_events[-1]["timestamp_utc"]
            ev_ids = list({e["evidence_id"] for e in current_cluster_events if e.get("evidence_id")})

            clusters.append({
                "cluster_id": f"CLUST-{len(clusters)+1:03d}",
                "window_start": c_start.isoformat(),
                "window_end": c_end.isoformat(),
                "event_count": len(current_cluster_events),
                "evidence_ids": ev_ids,
                "events": [
                    {
                        **e,
                        "timestamp_utc": e["timestamp_utc"].isoformat() if e.get("timestamp_utc") else None,
                        "timestamp": e["timestamp_utc"].isoformat() if e.get("timestamp_utc") else e.get("original_timestamp"),
                    }
                    for e in current_cluster_events
                ],
                "summary": (
                    f"Cluster of {len(current_cluster_events)} event(s) spanning {int((c_end - c_start).total_seconds())}s "
                    f"across evidence {ev_ids}."
                ),
            })
            current_cluster_events = [ev]
            cluster_start = ev_ts

    # Finalize last cluster
    if current_cluster_events:
        c_start = current_cluster_events[0]["timestamp_utc"]
        c_end = current_cluster_events[-1]["timestamp_utc"]
        ev_ids = list({e["evidence_id"] for e in current_cluster_events if e.get("evidence_id")})

        clusters.append({
            "cluster_id": f"CLUST-{len(clusters)+1:03d}",
            "window_start": c_start.isoformat(),
            "window_end": c_end.isoformat(),
            "event_count": len(current_cluster_events),
            "evidence_ids": ev_ids,
            "events": [
                {
                    **e,
                    "timestamp_utc": e["timestamp_utc"].isoformat() if e.get("timestamp_utc") else None,
                    "timestamp": e["timestamp_utc"].isoformat() if e.get("timestamp_utc") else e.get("original_timestamp"),
                }
                for e in current_cluster_events
            ],
            "summary": (
                f"Cluster of {len(current_cluster_events)} event(s) spanning {int((c_end - c_start).total_seconds())}s "
                f"across evidence {ev_ids}."
            ),
        })

    return clusters


def detect_deterministic_sequences(
    events: List[Dict[str, Any]],
    max_gap_seconds: int = 600,
) -> List[Dict[str, Any]]:
    """
    Identifies notable deterministic event sequences (e.g. cross-source temporal proximity).
    CRITICAL RULE: Explicitly includes disclaimer that sequence != causation.
    """
    timestamped = [e for e in events if e.get("timestamp_utc") is not None]
    if len(timestamped) < 2:
        return []

    sequences: List[Dict[str, Any]] = []

    # Sequence Rule 1: Multi-source temporal proximity (events across >=2 distinct evidence files within window)
    window_events: List[Dict[str, Any]] = []
    for i in range(len(timestamped)):
        cur = timestamped[i]
        cur_ts = cur["timestamp_utc"]
        seq_group = [cur]

        for j in range(i + 1, len(timestamped)):
            next_ev = timestamped[j]
            next_ts = next_ev["timestamp_utc"]
            gap = (next_ts - cur_ts).total_seconds()

            if gap <= max_gap_seconds:
                seq_group.append(next_ev)
            else:
                break

        distinct_evidence = {e["evidence_id"] for e in seq_group if e.get("evidence_id")}
        if len(distinct_evidence) >= 2 and len(seq_group) >= 2:
            time_span = (seq_group[-1]["timestamp_utc"] - seq_group[0]["timestamp_utc"]).total_seconds()
            seq_id = f"SEQ-{uuid.uuid4().hex[:6].upper()}"

            # Avoid duplicate sequences with identical event IDs
            event_id_set = [e["event_id"] for e in seq_group]
            if not any(s["event_ids"] == event_id_set for s in sequences):
                desc_events = " → ".join([
                    f"{e.get('timestamp_utc').strftime('%H:%M:%S')} ({e.get('event_type')})"
                    for e in seq_group[:4]
                ])
                sequences.append({
                    "sequence_id": seq_id,
                    "rule_name": "cross_source_temporal_proximity",
                    "description": f"Cross-evidence activity sequence observed within {int(time_span)}s: {desc_events}",
                    "event_ids": event_id_set,
                    "evidence_ids": sorted(list(distinct_evidence)),
                    "time_span_seconds": time_span,
                    "confidence": 0.85,
                    "disclaimer": "Note: Chronological sequence is an observational correlation and does not automatically establish causation.",
                })

    return sequences[:10]  # Cap at top 10 sequences


def timeline_agent(state: InvestigationState) -> Dict[str, Any]:
    """
    Timeline Agent: Processes raw events from multiple evidence sources,
    normalizes UTC timestamps, preserves original timestamps, clusters by window,
    and identifies possible sequences with explicit non-causation disclaimers.
    """
    case_id = state.get("case_id", 0)
    raw_events = state.get("raw_events", [])
    extracted_entities = state.get("extracted_entities", [])
    logs = list(state.get("agent_logs", []))

    logger.info(f"[TimelineAgent] Processing timeline for Case #{case_id} across {len(raw_events)} events.")

    # 1. Map extracted entities to event IDs
    event_entity_map: Dict[int, List[str]] = {}
    for ent in extracted_entities:
        for ev_id in ent.get("event_ids", []):
            event_entity_map.setdefault(ev_id, []).append(f"{ent.get('entity_type')}:{ent.get('entity_value')}")

    # 2. Build normalized observed events
    observed_events: List[Dict[str, Any]] = []

    for ev in raw_events:
        event_id = ev.get("id") if ev.get("id") is not None else ev.get("event_id")
        raw_ts = ev.get("timestamp")
        utc_dt, orig_ts_str = parse_and_normalize_timestamp(raw_ts)

        desc = ev.get("description") or f"Observed event ({ev.get('event_type')}) from source '{ev.get('source')}'"
        if not ev.get("description") and ev.get("entity_type") and ev.get("entity_value"):
            desc += f" involving {ev.get('entity_type')}='{ev.get('entity_value')}'"

        observed_events.append({
            "event_id": event_id,
            "evidence_id": ev.get("evidence_id"),
            "source": ev.get("source"),
            "event_type": ev.get("event_type") or "generic",
            "timestamp_utc": utc_dt,
            "original_timestamp": orig_ts_str,
            "description": desc,
            "entities": event_entity_map.get(event_id, []),
            "metadata": ev.get("metadata") if isinstance(ev.get("metadata"), dict) else None,
        })

    # 3. Sort chronologically: Timestamped events first (ascending by UTC), followed by un-timestamped
    def sort_key(item: Dict[str, Any]):
        ts = item.get("timestamp_utc")
        return (0, ts) if ts is not None else (1, datetime.datetime.max.replace(tzinfo=datetime.timezone.utc))

    observed_events.sort(key=sort_key)

    # 4. Group events into temporal clusters
    window_seconds = int(state.get("window_seconds", 300) or 300)
    time_clusters = cluster_events_by_window(observed_events, window_seconds=window_seconds)

    # 5. Detect deterministic sequences with disclaimers
    possible_sequences = detect_deterministic_sequences(observed_events, max_gap_seconds=600)

    # Serialize observed events for state storage
    serializable_timeline = [
        {
            **e,
            "timestamp_utc": e["timestamp_utc"].isoformat() if e.get("timestamp_utc") else None,
            "timestamp": e["timestamp_utc"].isoformat() if e.get("timestamp_utc") else e.get("original_timestamp"),
        }
        for e in observed_events
    ]

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    logs.append({
        "agent": "timeline_agent",
        "timestamp": now_iso,
        "details": (
            f"Normalized {len(observed_events)} events, identified {len(time_clusters)} time cluster(s), "
            f"and detected {len(possible_sequences)} possible sequence(s)."
        ),
        "status": "completed",
    })

    return {
        "timeline": serializable_timeline,
        "time_clusters": time_clusters,
        "timeline_clusters": time_clusters,
        "possible_sequences": possible_sequences,
        "agent_logs": logs,
    }
