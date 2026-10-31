import pytest
from pydantic import ValidationError
from app.models.case import CasePriority, CaseStatus
from app.schemas.case import CaseCreateRequest, CaseUpdateRequest


def test_case_create_schema_valid():
    """Verify CaseCreateRequest accepts valid inputs and sets default status/priority."""
    payload = CaseCreateRequest(
        title="Unauthorized Cyber Infiltration - Operation Alpha",
        description="Suspected exfiltration of encrypted forensic databases.",
    )
    assert payload.title == "Unauthorized Cyber Infiltration - Operation Alpha"
    assert payload.status == CaseStatus.ACTIVE
    assert payload.priority == CasePriority.MEDIUM
    assert payload.case_number is None


def test_case_create_schema_invalid_status():
    """Verify CaseCreateRequest rejects illegal status strings."""
    with pytest.raises(ValidationError):
        CaseCreateRequest(
            title="Invalid Case",
            status="non_existent_status",  # type: ignore
        )


def test_case_create_schema_invalid_priority():
    """Verify CaseCreateRequest rejects illegal priority strings."""
    with pytest.raises(ValidationError):
        CaseCreateRequest(
            title="Invalid Priority Case",
            priority="urgent_now",  # type: ignore
        )


def test_case_update_schema_partial():
    """Verify CaseUpdateRequest allows optional partial updates."""
    payload = CaseUpdateRequest(
        status=CaseStatus.UNDER_REVIEW,
        priority=CasePriority.CRITICAL,
    )
    assert payload.status == CaseStatus.UNDER_REVIEW
    assert payload.priority == CasePriority.CRITICAL
    assert payload.title is None


def test_get_case_dashboard_with_findings_and_events():
    """Verify get_case_dashboard executes cleanly with findings and events without AttributeError."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.database.base import Base
    from app.models.case import InvestigationCase
    from app.models.user import User, UserRole
    from app.models.finding import InvestigationFindingModel, FindingReviewStatus
    from app.models.investigation_event import InvestigationEvent, EventType
    from app.models.evidence import Evidence, ProcessingStatus, IntegrityStatus
    from app.services.case_service import CaseService

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    user = User(id=1, email="admin@synapsex.ai", full_name="Admin User", role=UserRole.ADMIN, password_hash="dummy")
    db.add(user)
    db.commit()

    case = InvestigationCase(id=1, case_number="CASE-2026-001", title="Test Case", created_by=user.id)
    db.add(case)
    db.commit()

    ev = Evidence(
        id=1,
        evidence_number="EV-001",
        case_id=case.id,
        original_filename="auth.log",
        stored_filename="auth_uuid.log",
        storage_path="/tmp/auth.log",
        mime_type="text/plain",
        file_size=1024,
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        processing_status=ProcessingStatus.COMPLETED,
        integrity_status=IntegrityStatus.VERIFIED,
        uploaded_by=user.id,
    )
    db.add(ev)
    db.commit()

    event = InvestigationEvent(
        id=1,
        case_id=case.id,
        evidence_id=ev.id,
        event_type=EventType.AUTH_EVENT,
        source="auth.log",
        entity_type="ip_address",
        entity_value="192.168.1.50",
    )
    db.add(event)

    finding = InvestigationFindingModel(
        id=1,
        finding_id="FIND-001",
        case_id=case.id,
        title="Unauthorized Admin Escalation",
        category="privilege_escalation",
        confidence_score=0.88,
        summary="Test summary",
        observations="[]",
        potential_hypotheses="[]",
        supporting_evidence_ids="[1]",
        supporting_event_ids="[1]",
        alternative_explanations="[]",
        recommended_verification="[]",
        limitations="[]",
        review_status=FindingReviewStatus.PENDING_REVIEW,
    )
    db.add(finding)
    db.commit()

    res = CaseService.get_case_dashboard(db=db, case_id=case.id, current_user=user)
    assert res.case_id == 1
    assert res.case_title == "Test Case"
    assert res.total_evidence == 1
    assert res.processed_evidence == 1
    assert len(res.recent_findings) == 1
    assert "High (88%)" in res.recent_findings[0]["value"]
    assert len(res.latest_events) == 1
    assert res.latest_events[0]["source"] == "auth.log"

