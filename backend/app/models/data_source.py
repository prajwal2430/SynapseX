import datetime
import enum
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class SourceType(str, enum.Enum):
    SYSTEM_LOG = "system_log"
    NETWORK_LOG = "network_log"
    CCTV_STREAM = "cctv_stream"
    FILE_UPLOAD = "file_upload"
    ENDPOINT = "endpoint"


class SourceStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEGRADED = "degraded"
    ERROR = "error"


class DataSource(Base):
    """
    SQLAlchemy ORM model for connected forensic data sources.
    Tracks ingest feeds, telemetry connections, and log stream statuses.
    """
    __tablename__ = "data_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("investigation_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(11), nullable=False)
    configuration: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(10), default=SourceStatus.ACTIVE, nullable=False)
    last_seen_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        default=datetime.datetime.utcnow,
        nullable=False,
    )
