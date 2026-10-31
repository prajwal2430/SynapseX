from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class UserSettings(Base, TimestampMixin):
    """
    Stores personal settings and preferences for a platform user.
    Each user has at most one settings record.
    """
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Workspace preferences
    theme: Mapped[str] = mapped_column(
        String(20),
        default="system",
        nullable=False,
    )
    language: Mapped[str] = mapped_column(
        String(10),
        default="en",
        nullable=False,
    )
    timezone: Mapped[str] = mapped_column(
        String(64),
        default="UTC",
        nullable=False,
    )
    date_time_format: Mapped[str] = mapped_column(
        String(32),
        default="YYYY-MM-DD HH:mm",
        nullable=False,
    )
    default_dashboard: Mapped[str] = mapped_column(
        String(64),
        default="dashboard",
        nullable=False,
    )

    # AI preferences
    ai_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    ai_finding_notifications: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    evidence_correlation_suggestions: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    ai_confidence_threshold: Mapped[int] = mapped_column(
        Integer,
        default=70,
        nullable=False,
    )
    ai_reasoning_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Notification preferences
    investigation_updates: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    evidence_processing_status: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    security_alerts: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    report_generation_status: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    system_notifications: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Account preferences
    email_preferences: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    user = relationship(
        "User",
        foreign_keys=[user_id],
        lazy="joined",
    )

    def __repr__(self) -> str:
        return f"<UserSettings id={self.id} user_id={self.user_id}>"