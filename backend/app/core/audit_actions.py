import enum


class AuditAction(str, enum.Enum):
    """
    Canonical set of system-wide audit action identifiers for ADEIP.

    Every write-path event that the platform cares about must appear here.
    Using a central enum prevents typos and enforces a controlled vocabulary.
    """
    # Authentication
    LOGIN = "login"
    LOGIN_FAILED = "login_failed"

    # Investigation Cases
    CASE_CREATED = "case_created"
    CASE_UPDATED = "case_updated"
    CASE_DELETED = "case_deleted"
    CASE_VIEWED = "case_viewed"

    # Evidence Lifecycle
    EVIDENCE_UPLOADED = "evidence_uploaded"
    EVIDENCE_VERIFIED = "evidence_verified"
    EVIDENCE_VIEWED = "evidence_viewed"

    # Analysis & AI
    ANALYSIS_STARTED = "analysis_started"
    ANALYSIS_COMPLETED = "analysis_completed"

    # Findings
    FINDING_REVIEWED = "finding_reviewed"

    # Reports
    REPORT_GENERATED = "report_generated"
    REPORT_DELETED = "report_deleted"

    # Administration
    USER_CREATED = "user_created"
    USER_DEACTIVATED = "user_deactivated"


class AuditResourceType(str, enum.Enum):
    """
    Resource domain labels for audit events.
    Keeps resource_type values consistent across services.
    """
    AUTH = "auth"
    CASE = "case"
    EVIDENCE = "evidence"
    ANALYSIS = "analysis"
    FINDING = "finding"
    REPORT = "report"
    USER = "user"
    SYSTEM = "system"
