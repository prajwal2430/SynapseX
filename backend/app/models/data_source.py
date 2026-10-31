import datetime
import enum
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class SourceType(str, enum.Enum):
    FILE_UPLOAD = "file_upload"
    CCTV_STREAM = "cctv_stream"
    SYSTEM_LOG = "system_log"
    NETWORK_LOG = "network_log"
    CSV_SOURCE = "csv_source"
    JSON_SOURCE = "json_source"
    API = "api"
    WEBHOOK = "webhook"
    ENDPOINT = "endpoint"


class SourceStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PROCESSING = "processing"
    ERROR = "error"
    OFFLINE = "offline"
    DEGRADED = "degraded"


class DataSource(Base):
    """
    SQLAlchemy ORM model for connected forensic data sources.
    Tracks ingest feeds, telemetry connections, and log stream statuses.
    """
    __tablename__ = "data_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("investigation_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    source_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    configuration: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default=SourceStatus.ACTIVE, nullable=False, index=True)
    last_seen_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        default=datetime.datetime.utcnow,
        nullable=False,
    )

    # Relationships
    case = relationship("InvestigationCase", foreign_keys=[case_id], lazy="joined")

    def __repr__(self) -> str:
        return f"<DataSource id={self.id} name={self.source_name} type={self.source_type} status={self.status}>"
