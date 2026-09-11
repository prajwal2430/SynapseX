"""
Pydantic Schemas for SynapseX AI Service Requests and Responses.
Strictly defines typed payloads for internal evidence analysis, timeline reconstruction,
multi-signal correlation, and LangGraph multi-agent investigations.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.agents.state import (
    ExtractedEntity,
    TimelineEntry,
    CorrelationItem,
    InvestigationFinding,
    InvestigationRecommendation,
)


# ==============================================================================
# 1. Evidence Analysis Schemas (Entity Extraction & Normalization)
# ==============================================================================

class EvidenceAnalysisRequest(BaseModel):
    case_id: str = Field(..., description="Target Case identifier")
    evidence_id: str = Field(..., description="Target Evidence artifact identifier")
    file_name: str = Field(..., description="Original evidence file name")
    mime_type: str = Field(default="application/octet-stream", description="Validated MIME type")
    content_text: Optional[str] = Field(default=None, description="Extracted textual or log content")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Forensic metadata context")
    raw_events: List[Dict[str, Any]] = Field(default_factory=list, description="Extracted log/network events")


class EvidenceAnalysisResponse(BaseModel):
    case_id: str
    evidence_id: str
    file_name: str
    entities: List[ExtractedEntity]
    entity_counts: Dict[str, int]
    total_entities: int
    execution_time_ms: float


# ==============================================================================
# 2. Timeline Analysis Schemas (Chronological Reconstruction & Clustering)
# ==============================================================================

class TimelineAnalysisRequest(BaseModel):
    case_id: str = Field(..., description="Target Case identifier")
    events: List[Dict[str, Any]] = Field(..., description="List of multi-source raw events")
    window_seconds: int = Field(
        default=300,
        ge=10,
        le=86400,
        description="Temporal clustering window size in seconds (default 300s / 5m)",
    )


class TimelineAnalysisResponse(BaseModel):
    case_id: str
    timeline: List[TimelineEntry]
    clusters: List[Dict[str, Any]]
    total_events: int
    temporal_range: Dict[str, Any]
    execution_time_ms: float


# ==============================================================================
# 3. Correlation Analysis Schemas (Multi-Signal Cross-Evidence Matching)
# ==============================================================================

class CorrelationAnalysisRequest(BaseModel):
    case_id: str = Field(..., description="Target Case identifier")
    extracted_entities: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Structured entities extracted across evidence items",
    )
    timeline: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Chronologically sequenced timeline moments",
    )
    raw_events: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Optional raw event collection for contextual linking",
    )


class CorrelationAnalysisResponse(BaseModel):
    case_id: str
    correlations: List[CorrelationItem]
    total_correlations: int
    high_confidence_count: int
    disclaimer: str
    execution_time_ms: float


# ==============================================================================
# 4. Full Investigation Schemas (LangGraph Multi-Agent Orchestration)
# ==============================================================================

class InvestigationRequest(BaseModel):
    case_id: str = Field(..., description="Target Case identifier")
    case_info: Dict[str, Any] = Field(default_factory=dict, description="Case title, description, priority")
    evidence_items: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="All evidence artifacts belonging to the case",
    )
    raw_events: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Ingested log, event, or packet capture records",
    )


class InvestigationResponse(BaseModel):
    case_id: str
    status: str
    extracted_entities: List[ExtractedEntity]
    timeline: List[TimelineEntry]
    correlations: List[CorrelationItem]
    graph: Dict[str, Any]
    findings: List[InvestigationFinding]
    recommendations: List[InvestigationRecommendation]
    report_summary: Optional[Dict[str, Any]] = None
    agent_logs: List[Dict[str, Any]]
    errors: List[str]
    execution_time_ms: float


# ==============================================================================
# 5. Service Health Schema
# ==============================================================================

class HealthResponse(BaseModel):
    service: str
    status: str
    version: str
    timestamp: str
    dependencies: Dict[str, str]


# ==============================================================================
# 6. Legacy / Generic Agent & Graph Query Schemas
# ==============================================================================

class AgentRunRequest(BaseModel):
    case_id: str = Field(..., description="ID of the case being analyzed")
    agent_name: Optional[str] = Field(None, description="Specific agent name, or null for full workflow")
    evidence_ids: List[str] = Field(default_factory=list, description="List of evidence document IDs")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Custom parameters for agent execution")


class AgentRunResponse(BaseModel):
    run_id: str
    case_id: str
    status: str
    message: str
    findings_count: int = 0
    anomalies_detected: int = 0
    duration_ms: float = 0.0


class GraphQueryRequest(BaseModel):
    case_id: str
    cypher_query: Optional[str] = None
    node_label: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=500)


class GraphQueryResponse(BaseModel):
    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    relationships: List[Dict[str, Any]] = Field(default_factory=list)
    total_nodes: int = 0
    total_relationships: int = 0

