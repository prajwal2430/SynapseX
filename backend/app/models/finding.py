"""
Investigation Finding ORM model for ADEIP Forensic Intelligence.

Stores structured, evidence-grounded hypotheses and analytical findings.
Maintains human-in-the-loop review state (accepted_as_lead, rejected, needs_more_analysis).
"""
import datetime
import enum
from typing import Optional
from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class FindingReviewStatus(str, enum.Enum):
    """
    Human-in-the-loop review status for AI reasoning findings.
    The final investigative decision strictly remains with the investigator.
    """
    PENDING_REVIEW       = "pending_review"
    ACCEPTED_AS_LEAD     = "accepted_as_lead"
    REJECTED             = "rejected"
    NEEDS_MORE_ANALYSIS  = "needs_more_analysis"


class InvestigationFindingModel(Base):
    """
    SQLAlchemy ORM model for AI-generated reasoning findings.

    STRICT COMPLIANCE RULES:
    1. Must NOT declare a person guilty.
    2. Must NOT treat AI confidence or probability as proof.
    3. Every observation must reference supporting evidence IDs or event IDs.
    4. Must include alternative explanations where reasonable.
    5. Must clearly identify limitations and uncertainty.
    """
    __tablename__ = "investigation_findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)

    finding_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    case_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("investigation_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    classification: Mapped[str] = mapped_column(String(32), default="INFERENCE", nullable=False, index=True)  # FACT, CORRELATION, INFERENCE, CONTRADICTION, UNKNOWN
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.85)

    summary: Mapped[str] = mapped_column(Text, nullable=False)
    related_entities: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of entity strings

    # Structured JSON payloads
    observations: Mapped[str] = mapped_column(Text, nullable=False)               # List of observation items
    potential_hypotheses: Mapped[str] = mapped_column(Text, nullable=False)       # List of hypotheses
    supporting_evidence_ids: Mapped[str] = mapped_column(Text, nullable=False)    # List of evidence IDs
    supporting_event_ids: Mapped[str] = mapped_column(Text, nullable=False)       # List of event IDs
    alternative_explanations: Mapped[str] = mapped_column(Text, nullable=False)   # List of alternative non-malicious scenarios
    recommended_verification: Mapped[str] = mapped_column(Text, nullable=False)   # Actionable verification steps
    limitations: Mapped[str] = mapped_column(Text, nullable=False)                # Uncertainty and evidence gaps

    # Human-in-the-loop review lifecycle
    review_status: Mapped[FindingReviewStatus] = mapped_column(
        Enum(FindingReviewStatus, name="finding_review_status_enum", values_callable=lambda x: [e.value for e in x]),
        default=FindingReviewStatus.PENDING_REVIEW,
        nullable=False,
        index=True,
    )
    reviewed_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    reviewer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    case = relationship("InvestigationCase", foreign_keys=[case_id], lazy="select")
    reviewer = relationship("User", foreign_keys=[reviewed_by], lazy="joined")

    def __repr__(self) -> str:
        return f"<InvestigationFinding id={self.id} finding_id={self.finding_id} status={self.review_status}>"
