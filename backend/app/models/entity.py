"""
Extracted Entity ORM model for ADEIP Forensic Intelligence.
"""
import datetime
import enum
from typing import Any, Optional
from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class EntityType(str, enum.Enum):
    """
    Standardized entity classification taxonomy for forensic investigations.
    """
    PERSON        = "person"
    DEVICE        = "device"
    USER_ACCOUNT  = "user_account"
    IP_ADDRESS    = "ip_address"
    FILE          = "file"
    USB_DEVICE    = "usb_device"
    LOCATION      = "location"
    FILE_HASH     = "file_hash"
    DOMAIN        = "domain"
    NETWORK_PORT  = "network_port"
    GENERIC       = "generic"


class ExtractionMethod(str, enum.Enum):
    """
    Method through which an entity was identified (deterministic & transparent).
    """
    STRUCTURED_FIELD   = "structured_field"    # Directly mapped from structured event/log key
    REGEX_IPV4         = "regex_ipv4"          # IPv4 pattern match in text/payload
    REGEX_EMAIL        = "regex_email"         # Email identifier pattern match
    REGEX_HASH         = "regex_hash"          # Cryptographic hash pattern (SHA-256, MD5)
    REGEX_USB          = "regex_usb"           # USB device hardware identifier pattern (VID/PID)
    FILENAME_PARSER    = "filename_parser"     # Extracted from evidence filename or path
    METADATA_INSPECTOR = "metadata_inspector"  # Extracted from raw artifact header/metadata
    DETERMINISTIC_RULE = "deterministic_rule"  # Deterministic heuristic mapping


class ExtractedEntityModel(Base):
    """
    SQLAlchemy ORM model for storing normalized entities extracted from evidence and events.
    """
    __tablename__ = "extracted_entities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)

    case_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("investigation_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    evidence_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("evidence.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("investigation_events.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    entity_type: Mapped[EntityType] = mapped_column(
        Enum(EntityType, name="entity_type_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    entity_value: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    normalized_value: Mapped[str] = mapped_column(String(512), nullable=False, index=True)

    extraction_method: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    resolution_status: Mapped[str] = mapped_column(String(32), default="unresolved", nullable=False, index=True) # confirmed, probable, possible, unresolved

    context: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Mapped to underlying SQL column 'metadata'
    entity_metadata: Mapped[Optional[str]] = mapped_column("metadata", Text, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    case = relationship("InvestigationCase", foreign_keys=[case_id], lazy="select")
    evidence = relationship("Evidence", foreign_keys=[evidence_id], lazy="select")
    event = relationship("InvestigationEvent", foreign_keys=[event_id], lazy="select")

    def __init__(self, *args: Any, **kwargs: Any):
        if "metadata" in kwargs and "entity_metadata" not in kwargs:
            kwargs["entity_metadata"] = kwargs.pop("metadata")
        super().__init__(*args, **kwargs)

    def __repr__(self) -> str:
        return f"<ExtractedEntity id={self.id} type={self.entity_type} val={self.entity_value} ev={self.evidence_id}>"
