import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.models.data_source import SourceStatus, SourceType


class DataSourceCreateRequest(BaseModel):
    source_name: str = Field(..., min_length=2, max_length=255, description="Human-readable identifier for the data source")
    source_type: SourceType = Field(..., description="Type of data source (e.g. cctv_stream, system_log, api)")
    configuration: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Configuration parameters (URLs, credentials, headers)")
    enabled: bool = Field(True, description="Whether the data source is initially enabled")


class DataSourceUpdateRequest(BaseModel):
    source_name: Optional[str] = Field(None, min_length=2, max_length=255)
    configuration: Optional[Dict[str, Any]] = None
    status: Optional[SourceStatus] = None


class DataSourceResponse(BaseModel):
    id: int
    case_id: int
    source_name: str
    source_type: SourceType
    status: SourceStatus
    configuration_summary: Dict[str, Any] = Field(default_factory=dict, description="Safe configuration representation with credentials masked")
    last_seen_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class DataSourceListResponse(BaseModel):
    items: List[DataSourceResponse]
    total: int
