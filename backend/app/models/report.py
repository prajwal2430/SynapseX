"""
Investigation Report ORM model for ADEIP Forensic Intelligence.

Stores generated structured investigation reports containing:
1. Case Summary
2. Evidence Inventory
3. Evidence Integrity Status
4. Investigation Timeline
5. Entity Relationships
6. Correlations
7. AI-Assisted Findings
8. Supporting Evidence
9. Alternative Explanations
10. Recommended Verification
11. Investigator Review Status
12. Limitations

CRITICAL REQUIREMENT:
Must clearly include: "AI-Assisted Draft — Requires Human Investigator Review"
"""
import datetime
import enum
from typing import Optional
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ReportFormat(str, enum.Enum):
    JSON = "json"
    HTML = "html"
    MARKDOWN = "markdown"
    PDF = "pdf"


class InvestigationReportModel(Base):
    """
    SQLAlchemy ORM model for generated investigation reports.
    """
    __tablename__ = "investigation_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)

    report_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    case_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("investigation_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    report_format: Mapped[ReportFormat] = mapped_column(
        Enum(ReportFormat, name="report_format_enum", values_callable=lambda x: [e.value for e in x]),
        default=ReportFormat.HTML,
        nullable=False,
    )

    disclaimer: Mapped[str] = mapped_column(
        String(255),
        default="AI-Assisted Draft — Requires Human Investigator Review",
        nullable=False,
    )

    # Full structured 12-section JSON payload
    report_data: Mapped[str] = mapped_column(Text, nullable=False)

    # Standalone rendered HTML document
    html_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    generated_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    case = relationship("InvestigationCase", foreign_keys=[case_id], lazy="select")
    author = relationship("User", foreign_keys=[generated_by], lazy="joined")

    def __repr__(self) -> str:
        return f"<InvestigationReport id={self.id} report_id={self.report_id} case_id={self.case_id}>"
