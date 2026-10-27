import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models.case import CasePriority, CaseStatus


class CaseBase(BaseModel):
    """Shared base fields for an investigation case."""
    title: str = Field(..., min_length=3, max_length=255, description="Case title / headline")
    description: Optional[str] = Field(None, description="Detailed case background or incident notes")
    status: CaseStatus = Field(default=CaseStatus.ACTIVE, description="Lifecycle status")
    priority: CasePriority = Field(default=CasePriority.MEDIUM, description="Investigation priority level")
    case_type: Optional[str] = Field(default="Cybercrime", description="Category of investigation (e.g. Data Exfiltration, Financial Fraud)")
    opened_date: Optional[datetime.datetime] = Field(None, description="Date when case was formally opened")


class CaseCreateRequest(BaseModel):
    """Payload to initialize a new investigation case."""
    title: str = Field(..., min_length=3, max_length=255, description="Case title / headline")
    case_number: Optional[str] = Field(
        None,
        min_length=3,
        max_length=64,
        description="Optional custom identifier (e.g., 'CASE-2026-0042'). Auto-generated if omitted.",
    )
    description: Optional[str] = Field(None, description="Detailed case background or incident notes")
    status: Optional[CaseStatus] = Field(default=CaseStatus.ACTIVE)
    priority: Optional[CasePriority] = Field(default=CasePriority.MEDIUM)
    case_type: Optional[str] = Field(default="Cybercrime")
    opened_date: Optional[datetime.datetime] = None
    assigned_to_id: Optional[int] = Field(None, description="User ID to assign the case to")


class CaseUpdateRequest(BaseModel):
    """Payload for partial updates to an existing case."""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    case_type: Optional[str] = None
    opened_date: Optional[datetime.datetime] = None
    assigned_to_id: Optional[int] = None


class CaseResponse(CaseBase):
    """Detailed case representation returned by API endpoints."""
    id: int
    case_number: str
    created_by: int
    assigned_to_id: Optional[int] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    # Counts
    evidence_count: int = 0
    entity_count: int = 0
    finding_count: int = 0

    # Computed fields for readable creator and assignee names
    creator_name: Optional[str] = None
    assigned_to_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CaseListResponse(BaseModel):
    """Paginated collection of investigation cases."""
    items: List[CaseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
