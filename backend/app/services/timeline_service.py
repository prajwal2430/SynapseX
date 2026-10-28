"""
Case Timeline Service for ADEIP Forensic Investigations.

Retrieves and organizes multi-source investigation events into:
1. Observed Events (Chronologically sorted, UTC normalized, original timestamp preserved)
2. Time Window Clusters
3. Possible Sequences (Deterministic cross-source correlations with strict causation disclaimer)
"""
import datetime
import json
import logging
import math
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.agents.timeline_agent import (
    cluster_events_by_window,
    detect_deterministic_sequences,
    parse_and_normalize_timestamp,
)
from app.models.case import InvestigationCase
from app.models.entity import ExtractedEntityModel
from app.models.evidence import Evidence
from app.models.investigation_event import InvestigationEvent
from app.models.user import User
from app.schemas.timeline import (
    CaseTimelineResponse,
    PossibleSequence,
    TimelineCluster,
    TimelineObservedEvent,
)

logger = logging.getLogger("adeip.services.timeline")


class TimelineService:
    """
    Forensic service delivering structured, chronologically sequenced investigation timelines.
    """

    @classmethod
    def get_case_timeline(
        cls,
        db: Session,
        case_id: int,
        current_user: User,
        start_time: Optional[datetime.datetime] = None,
        end_time: Optional[datetime.datetime] = None,
        evidence_id: Optional[int] = None,
        event_type: Optional[str] = None,
        window_minutes: int = 5,
        page: int = 1,
        page_size: int = 100,
    ) -> CaseTimelineResponse:
        """
        Retrieves, normalizes, sequences, and clusters investigation events for a case.
        """
        # 1. Verify case exists
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        # 2. Build Event Query with filters
        stmt = select(InvestigationEvent).where(InvestigationEvent.case_id == case_id)

        if evidence_id is not None:
            stmt = stmt.where(InvestigationEvent.evidence_id == evidence_id)
        if event_type:
            stmt = stmt.where(InvestigationEvent.event_type == event_type.strip().lower())
        if start_time:
            stmt = stmt.where(InvestigationEvent.timestamp >= start_time)
        if end_time:
            stmt = stmt.where(InvestigationEvent.timestamp <= end_time)

        # Count total matching events
        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

        # Fetch all matching events to perform global chronological sort and cluster analysis
        events_records = list(
            db.scalars(
                stmt.order_by(
                    InvestigationEvent.timestamp.asc().nullslast(),
                    InvestigationEvent.id.asc(),
                )
            ).all()
        )

        # 3. Fetch associated entities to enrich event representations
        entities_records = list(
            db.scalars(select(ExtractedEntityModel).where(ExtractedEntityModel.case_id == case_id)).all()
        )
        event_entity_map: Dict[int, List[str]] = {}
        for ent in entities_records:
            if ent.event_id:
                event_entity_map.setdefault(ent.event_id, []).append(f"{ent.entity_type.value}:{ent.entity_value}")

        # 4. Build observed events list
        raw_observed_events: List[Dict[str, Any]] = []
        for ev in events_records:
            utc_dt, orig_ts = parse_and_normalize_timestamp(ev.timestamp)
            meta_dict = None
            if ev.event_metadata:
                try:
                    meta_dict = json.loads(ev.event_metadata) if isinstance(ev.event_metadata, str) else ev.event_metadata
                except Exception:
                    meta_dict = {"raw": ev.event_metadata}

            desc = f"Observed event ({ev.event_type.value}) from source '{ev.source}'"
            if ev.entity_type and ev.entity_value:
                desc += f" involving {ev.entity_type}='{ev.entity_value}'"

            raw_observed_events.append({
                "event_id": ev.id,
                "evidence_id": ev.evidence_id,
                "source": ev.source,
                "event_type": ev.event_type.value,
                "timestamp_utc": utc_dt,
                "original_timestamp": orig_ts,
                "description": desc,
                "entities": event_entity_map.get(ev.id, []),
                "metadata": meta_dict,
            })

        # 5. Global Chronological Sort: Timestamped events in ascending order, then un-timestamped
        def sort_key(item: Dict[str, Any]):
            ts = item.get("timestamp_utc")
            return (0, ts) if ts is not None else (1, datetime.datetime.max.replace(tzinfo=datetime.timezone.utc))

        raw_observed_events.sort(key=sort_key)

        # 6. Window Clustering (window_minutes converted to seconds)
        window_seconds = max(60, window_minutes * 60)
        time_clusters_data = cluster_events_by_window(raw_observed_events, window_seconds=window_seconds)

        # 7. Deterministic Sequences
        sequences_data = detect_deterministic_sequences(raw_observed_events, max_gap_seconds=window_seconds * 2)

        # 8. Pagination on observed events
        offset = (max(1, page) - 1) * page_size
        paginated_events = raw_observed_events[offset : offset + page_size]

        observed_event_models = [
            TimelineObservedEvent(
                event_id=e["event_id"],
                evidence_id=e["evidence_id"],
                source=e["source"],
                event_type=e["event_type"],
                timestamp_utc=e["timestamp_utc"],
                original_timestamp=e["original_timestamp"],
                description=e["description"],
                entities=e["entities"],
                metadata=e["metadata"],
            )
            for e in paginated_events
        ]

        cluster_models = [
            TimelineCluster(
                cluster_id=c["cluster_id"],
                window_start=c["window_start"],
                window_end=c["window_end"],
                event_count=c["event_count"],
                evidence_ids=c["evidence_ids"],
                events=[
                    TimelineObservedEvent(
                        event_id=ev["event_id"],
                        evidence_id=ev["evidence_id"],
                        source=ev["source"],
                        event_type=ev["event_type"],
                        timestamp_utc=ev["timestamp_utc"],
                        original_timestamp=ev["original_timestamp"],
                        description=ev["description"],
                        entities=ev["entities"],
                        metadata=ev["metadata"],
                    )
                    for ev in c["events"][:10]  # sample of events per cluster
                ],
                summary=c["summary"],
            )
            for c in time_clusters_data
        ]

        sequence_models = [
            PossibleSequence(
                sequence_id=s["sequence_id"],
                rule_name=s["rule_name"],
                description=s["description"],
                event_ids=s["event_ids"],
                evidence_ids=s["evidence_ids"],
                time_span_seconds=s["time_span_seconds"],
                confidence=s["confidence"],
                disclaimer=s["disclaimer"],
            )
            for s in sequences_data
        ]

        return CaseTimelineResponse(
            case_id=case_id,
            total_events=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total > 0 else 0,
            observed_events=observed_event_models,
            events=observed_event_models,
            time_clusters=cluster_models,
            possible_sequences=sequence_models,
        )
