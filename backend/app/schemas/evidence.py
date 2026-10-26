import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.evidence import IntegrityStatus, ProcessingStatus


class EvidenceResponse(BaseModel):
    """
    Public representation of uploaded evidence artifact.
    Omits raw internal server filesystem paths to maintain security while providing
    permanent access URL, cryptographic integrity hash, and agent association.
    """
    id: int
    evidence_number: str
    case_id: int
    original_filename: str
    stored_filename: Optional[str] = None
    file_url: str = Field(..., description="Permanent API endpoint to retrieve/stream the physical file")
    mime_type: str
    file_size: int = Field(..., description="File size in bytes")
    sha256_hash: str = Field(..., description="Cryptographic SHA-256 integrity hash")
    agent_type: Optional[str] = Field(None, description="Investigative AI agent associated with this evidence")
    file_type: Optional[str] = Field(None, description="Forensic category (e.g., Forensic Document, Video Evidence)")
    storage_status: str = Field("stored", description="Physical persistence status: stored, failed, etc.")
    processing_status: ProcessingStatus
    integrity_status: IntegrityStatus
    last_verified_at: Optional[datetime.datetime] = None
    uploaded_by: int
    uploader_name: Optional[str] = None
    uploaded_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EvidenceUploadResponse(BaseModel):
    """Payload returned after an evidence artifact is successfully ingested and persisted."""
    success: bool = True
    evidence: EvidenceResponse
    message: Optional[str] = "Evidence uploaded and securely stored."


class EvidenceDeleteResponse(BaseModel):
    """Payload returned when an evidence artifact and its physical file are deleted."""
    success: bool = True
    message: str
    evidence_id: int


class EvidenceListResponse(BaseModel):
    """Collection of evidence items associated with an investigation case or agent."""
    items: List[EvidenceResponse]
    total: int


class EvidenceVerificationResponse(BaseModel):
    """Result of cryptographic on-disk SHA-256 integrity verification."""
    evidence_id: int
    evidence_number: str
    original_filename: str
    integrity_status: IntegrityStatus
    stored_hash: str
    computed_hash: Optional[str] = None
    is_valid: bool = Field(..., description="True if computed hash matches stored hash; False if mismatch or file missing")
    verified_at: datetime.datetime
    verified_by: int
    verifier_name: Optional[str] = None
    message: str
