import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TimelineObservedEvent(BaseModel):
    """
    Direct, observed factual event from forensic evidence.
    Distinguished strictly from speculative or derived relationships.
    """
    event_id: int
    evidence_id: int
    source: Optional[str] = None
    event_type: str
    timestamp_utc: Optional[datetime.datetime] = None
    original_timestamp: Optional[str] = None
    description: str
    entities: List[str] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class TimelineCluster(BaseModel):
    """
    Temporal grouping of observed events occurring within a configurable time window.
    """
    cluster_id: str
    window_start: Optional[datetime.datetime] = None
    window_end: Optional[datetime.datetime] = None
    event_count: int
    evidence_ids: List[int] = Field(default_factory=list)
    events: List[TimelineObservedEvent] = Field(default_factory=list)
    summary: str


class PossibleSequence(BaseModel):
    """
    Hypothetical or deterministic sequence detected based on temporal proximity.
    Rule: Chronological sequence does NOT automatically establish causation.
    """
    sequence_id: str
    rule_name: str
    description: str
    event_ids: List[int] = Field(default_factory=list)
    evidence_ids: List[int] = Field(default_factory=list)
    time_span_seconds: float
    confidence: float = 0.80
    disclaimer: str = "Note: Chronological proximity is an observational correlation and does not automatically establish causation."


class CaseTimelineResponse(BaseModel):
    """
    Comprehensive structured timeline response for a forensic case.
    Separates grounded observed events from possible temporal relationships.
    """
    case_id: int
    total_events: int
    page: int
    page_size: int
    total_pages: int
    observed_events: List[TimelineObservedEvent] = Field(default_factory=list)
    events: List[TimelineObservedEvent] = Field(default_factory=list)
    time_clusters: List[TimelineCluster] = Field(default_factory=list)
    possible_sequences: List[PossibleSequence] = Field(default_factory=list)
