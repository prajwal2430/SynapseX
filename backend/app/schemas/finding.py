"""
Reasoning Agent & Finding Pydantic Schemas for ADEIP.
"""
import datetime
import json
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.finding import FindingReviewStatus


class ObservationItem(BaseModel):
    """Grounded observation linking analytical facts to specific evidence and events."""
    observation: str
    referenced_evidence_ids: List[int] = Field(default_factory=list)
    referenced_event_ids: List[int] = Field(default_factory=list)
    entities: List[str] = Field(default_factory=list)
    confidence: float = 0.90


class ReasoningOutput(BaseModel):
    """
    Standardized Reasoning Agent output format required by STEP 18.
    Strictly complies with the 7 key sections and non-guilt rules.
    """
    summary: str
    observations: List[Dict[str, Any]] = Field(default_factory=list)
    potential_hypotheses: List[str] = Field(default_factory=list)
    supporting_evidence: List[Dict[str, Any]] = Field(default_factory=list)
    alternative_explanations: List[str] = Field(default_factory=list)
    recommended_verification: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)


class FindingReviewRequest(BaseModel):
    """Investigator review action on an AI finding."""
    action: FindingReviewStatus = Field(
        ...,
        description="Review action: 'accepted_as_lead', 'rejected', or 'needs_more_analysis'",
    )
    notes: Optional[str] = Field(default=None, description="Investigator notes explaining the review decision.")


class FindingResponse(BaseModel):
    """Full representation of an evidence-grounded investigation finding."""
    id: int
    finding_id: str
    case_id: int
    title: str
    category: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    summary: str

    observations: List[Dict[str, Any]] = Field(default_factory=list)
    potential_hypotheses: List[str] = Field(default_factory=list)
    supporting_evidence_ids: List[int] = Field(default_factory=list)
    supporting_event_ids: List[int] = Field(default_factory=list)
    alternative_explanations: List[str] = Field(default_factory=list)
    recommended_verification: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)

    classification: str = Field(default="INFERENCE", description="FACT, CORRELATION, INFERENCE, CONTRADICTION, UNKNOWN")
    related_entities: List[str] = Field(default_factory=list)

    review_status: FindingReviewStatus
    reviewed_by: Optional[int] = None
    reviewer_name: Optional[str] = None
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[datetime.datetime] = None

    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class FindingListResponse(BaseModel):
    """Paginated list of investigation findings for a case."""
    case_id: int
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[FindingResponse]


class ReasoningRunResultResponse(BaseModel):
    """Result returned when executing the Reasoning Agent on a case."""
    case_id: int
    findings_generated: int
    reasoning_output: ReasoningOutput
    findings: List[FindingResponse]
