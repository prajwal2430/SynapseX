"""
Shared InvestigationState schema for ADEIP LangGraph Multi-Agent Orchestration.

All intelligence agents operate on this shared typed state.
Every agent receives the state, performs a discrete analysis step,
and returns an updated dictionary of fields.
"""
from typing import Any, Dict, List, Optional, TypedDict
from pydantic import BaseModel, Field


class ExtractedEntity(BaseModel):
    """Normalized entity identified across evidence items."""
    entity_type: str        # e.g., "person", "device", "user_account", "ip_address", "file", "usb_device", "location"
    entity_value: str
    normalized_value: Optional[str] = None
    evidence_id: Optional[int] = None
    event_id: Optional[int] = None
    event_ids: List[int] = Field(default_factory=list)
    extraction_method: str = "deterministic_rule"
    source: Optional[str] = None
    confidence: float = 1.0
    context: Optional[str] = None


class TimelineEntry(BaseModel):
    """Chronologically sequenced investigation event entry."""
    event_id: Optional[int] = None
    evidence_id: Optional[int] = None
    timestamp: Optional[str] = None
    source: Optional[str] = None
    event_type: str
    description: str
    entities: List[str] = Field(default_factory=list)


class CorrelationItem(BaseModel):
    """
    Explainable correlation signal identified across events, entities, and evidence artifacts.
    Rule: Never labeled as definitive proof. Uses non-proof wording ("Potential relationship detected").
    """
    correlation_id: str
    signal_type: str        # e.g., "same_device", "same_user_account", "same_ip_address", "same_file", "shared_evidence_context", "timestamp_proximity"
    title: str
    description: str
    reasons: List[str] = Field(default_factory=list)
    related_event_ids: List[int] = Field(default_factory=list)
    related_entity_ids: List[int] = Field(default_factory=list)
    supporting_evidence_ids: List[int] = Field(default_factory=list)
    correlation_score: float = Field(default=0.75, ge=0.0, le=1.0)
    entities: List[str] = Field(default_factory=list)
    confidence: Optional[float] = None
    disclaimer: str = "Potential relationship detected. Observational correlation does not establish causation or definitive proof."


class InvestigationFinding(BaseModel):
    """
    Evidence-backed forensic finding.
    Rule: Must be strictly grounded in evidence artifacts and must not declare guilt.
    """
    finding_id: str
    title: str
    description: str
    confidence: float = 0.85
    category: str           # e.g., "authentication_anomaly", "data_exfiltration", "persistence"
    referenced_evidence_ids: List[int] = Field(default_factory=list)
    referenced_event_ids: List[int] = Field(default_factory=list)
    supporting_entities: List[str] = Field(default_factory=list)


class InvestigationRecommendation(BaseModel):
    """
    Actionable advisory recommendation for identifying and filling investigation gaps.
    Rule: Never presented as a mandatory conclusion; framed as advisory acquisition guidance.
    """
    recommendation_id: str
    recommendation: str
    title: Optional[str] = None
    reason: str
    rationale: Optional[str] = None
    related_finding_id: Optional[str] = None
    related_evidence_ids: List[int] = Field(default_factory=list)
    referenced_evidence_ids: List[int] = Field(default_factory=list)
    priority: str = "medium"          # "critical", "high", "medium", "low"
    gap_type: Optional[str] = "missing_context"  # "timeline_gap", "incomplete_correlation", "missing_context", "unsupported_hypothesis"
    suggested_source: Optional[str] = None
    disclaimer: str = "Advisory recommendation. Presented as investigative acquisition guidance and not as a mandatory conclusion."


class GraphNode(BaseModel):
    """Knowledge graph node."""
    id: str
    label: str
    node_type: str         # "Case", "Evidence", "Event", "Entity", "Finding"
    properties: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    """Knowledge graph directed edge."""
    source: str
    target: str
    relationship: str     # "CONTAINS_EVIDENCE", "PRODUCED_EVENT", "MENTIONS_ENTITY", "SUPPORTS_FINDING"
    properties: Dict[str, Any] = Field(default_factory=dict)


class GraphState(BaseModel):
    """Graph structure produced by graph_agent."""
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)


class InvestigationState(TypedDict, total=False):
    """
    Shared LangGraph Investigation State dictionary.
    Passed sequentially across all specialized agents.
    """
    # Core identifiers
    case_id: int
    evidence_ids: List[int]
    event_ids: List[int]

    # Context & metadata
    case_info: Dict[str, Any]
    evidence_items: List[Dict[str, Any]]
    raw_events: List[Dict[str, Any]]

    # Agent outputs
    extracted_entities: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]
    correlations: List[Dict[str, Any]]
    graph: Dict[str, Any]
    findings: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    report_summary: Optional[Dict[str, Any]]

    # Pipeline diagnostics & logs
    agent_logs: List[Dict[str, Any]]
    errors: List[str]
    status: str
