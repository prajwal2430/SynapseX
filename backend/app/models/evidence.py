import enum
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class IntegrityStatus(str, enum.Enum):
    UNVERIFIED = "unverified"
    VERIFIED = "verified"
    HASH_MISMATCH = "hash_mismatch"
    FILE_MISSING = "file_missing"


class Evidence(Base):
    """
    SQLAlchemy ORM model for uploaded forensic digital evidence artifacts.
    Stores cryptographically hashed file references, integrity status, and audit timestamps.
    """
    __tablename__ = "evidence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    evidence_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    case_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("investigation_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(128), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    processing_status: Mapped[ProcessingStatus] = mapped_column(
        Enum(ProcessingStatus, name="processing_status_enum", values_callable=lambda x: [e.value for e in x]),
        default=ProcessingStatus.PENDING,
        nullable=False,
        index=True,
    )
    integrity_status: Mapped[IntegrityStatus] = mapped_column(
        Enum(IntegrityStatus, name="integrity_status_enum", values_callable=lambda x: [e.value for e in x]),
        default=IntegrityStatus.UNVERIFIED,
        nullable=False,
        index=True,
    )
    last_verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Agent & Storage Metadata
    agent_type: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    file_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    storage_status: Mapped[str] = mapped_column(String(32), default="stored", nullable=False)

    uploaded_by: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True,
    )

    # Relationships
    case = relationship("InvestigationCase", foreign_keys=[case_id], lazy="joined")
    uploader = relationship("User", foreign_keys=[uploaded_by], lazy="joined")

    @property
    def file_url(self) -> str:
        """Returns standard file streaming endpoint URL."""
        return f"/api/evidence/{self.id}/file"

    def __repr__(self) -> str:
        return f"<Evidence id={self.id} evidence_number={self.evidence_number} integrity={self.integrity_status}>"
