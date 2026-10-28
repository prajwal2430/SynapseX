import datetime
import enum
from typing import Optional
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class CaseStatus(str, enum.Enum):
    ACTIVE = "active"
    UNDER_REVIEW = "under_review"
    CLOSED = "closed"
    ARCHIVED = "archived"


class CasePriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class InvestigationCase(Base, TimestampMixin):
    """
    SQLAlchemy ORM model for digital forensic investigation cases.
    Tracks case metadata, status lifecycle, priority, and ownership.
    """
    __tablename__ = "investigation_cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    case_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[CaseStatus] = mapped_column(
        Enum(CaseStatus, name="case_status_enum", values_callable=lambda x: [e.value for e in x]),
        default=CaseStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    priority: Mapped[CasePriority] = mapped_column(
        Enum(CasePriority, name="case_priority_enum", values_callable=lambda x: [e.value for e in x]),
        default=CasePriority.MEDIUM,
        nullable=False,
        index=True,
    )
    case_type: Mapped[Optional[str]] = mapped_column(String(128), default="Cybercrime", nullable=True)
    opened_date: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_by: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Prepared for future case assignment functionality
    assigned_to_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ORM Relationships
    creator = relationship("User", foreign_keys=[created_by], lazy="joined")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], lazy="joined")

    def __repr__(self) -> str:
        return f"<InvestigationCase id={self.id} case_number={self.case_number} status={self.status}>"
