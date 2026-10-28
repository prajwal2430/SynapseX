from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_active_user
from app.api.dependencies.database import get_db
from app.models.case import CasePriority, CaseStatus
from app.models.user import User
from app.schemas.case import (
    CaseCreateRequest,
    CaseListResponse,
    CaseResponse,
    CaseUpdateRequest,
)
from app.services.case_service import CaseService

router = APIRouter(prefix="/cases", tags=["Investigation Cases"])


@router.post(
    "",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new investigation case",
)
async def create_case(
    case_in: CaseCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Creates a new digital forensic case.
    Automatically assigns created_by to the current authenticated investigator/admin.
    """
    return CaseService.create_case(db=db, case_in=case_in, current_user=current_user)


@router.get(
    "",
    response_model=CaseListResponse,
    status_code=status.HTTP_200_OK,
    summary="List investigation cases with search and pagination",
)
async def list_cases(
    search: Optional[str] = Query(None, description="Search keyword in case number, title, or description"),
    case_status: Optional[CaseStatus] = Query(None, alias="status", description="Filter by case lifecycle status"),
    priority: Optional[CasePriority] = Query(None, description="Filter by priority level"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves a paginated list of cases matching search criteria and filters.
    """
    items, total, total_pages = CaseService.list_cases(
        db=db,
        current_user=current_user,
        search=search,
        status_filter=case_status,
        priority_filter=priority,
        page=page,
        page_size=page_size,
    )
    return CaseListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{case_id}",
    response_model=CaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Get case details by ID or case_number",
)
async def get_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns full details of an authorized investigation case by ID or case_number.
    """
    return CaseService.get_case(db=db, case_id=case_id, current_user=current_user)


@router.patch(
    "/{case_id}",
    response_model=CaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Update case metadata, status, or priority",
)
async def update_case(
    case_id: int,
    case_in: CaseUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Applies partial updates to a case. Restricted to case creator, assigned investigator, or supervisors/admins.
    """
    return CaseService.update_case(
        db=db,
        case_id=case_id,
        case_in=case_in,
        current_user=current_user,
    )


@router.delete(
    "/{case_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an investigation case",
)
async def delete_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Deletes an investigation case record and cascades child artifacts.
    """
    CaseService.delete_case(db=db, case_id=case_id, current_user=current_user)
    return None


@router.get(
    "/{case_id}/summary",
    status_code=status.HTTP_200_OK,
    summary="Get comprehensive real dashboard statistics and metrics for a case",
)
async def get_case_summary(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns real investigation metrics derived directly from the database for this case:
    evidence count, extracted entity count, event count, finding count, and recent activity.
    No hardcoded mock numbers.
    """
    from app.models.case import InvestigationCase
    from app.models.evidence import Evidence, IntegrityStatus
    from app.models.entity import ExtractedEntityModel
    from app.models.investigation_event import InvestigationEvent
    from app.models.finding import InvestigationFindingModel
    from sqlalchemy import func, select

    case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case #{case_id} not found.")

    evidence_count = db.scalar(select(func.count()).where(Evidence.case_id == case_id)) or 0
    entity_count = db.scalar(select(func.count()).where(ExtractedEntityModel.case_id == case_id)) or 0
    event_count = db.scalar(select(func.count()).where(InvestigationEvent.case_id == case_id)) or 0
    finding_count = db.scalar(select(func.count()).where(InvestigationFindingModel.case_id == case_id)) or 0
    unverified_count = db.scalar(
        select(func.count()).where(Evidence.case_id == case_id, Evidence.integrity_status != IntegrityStatus.VERIFIED)
    ) or 0
    total_size_bytes = db.scalar(select(func.sum(Evidence.file_size)).where(Evidence.case_id == case_id)) or 0

    recent_evidence_rows = db.scalars(
        select(Evidence).where(Evidence.case_id == case_id).order_by(Evidence.uploaded_at.desc()).limit(5)
    ).all()
    recent_events_rows = db.scalars(
        select(InvestigationEvent).where(InvestigationEvent.case_id == case_id).order_by(InvestigationEvent.created_at.desc()).limit(8)
    ).all()
    recent_findings_rows = db.scalars(
        select(InvestigationFindingModel).where(InvestigationFindingModel.case_id == case_id).order_by(InvestigationFindingModel.created_at.desc()).limit(5)
    ).all()

    return {
        "case": {
            "id": case.id,
            "case_number": case.case_number,
            "title": case.title,
            "description": case.description,
            "status": case.status.value,
            "priority": case.priority.value,
            "case_type": getattr(case, "case_type", None) or "Cybercrime",
            "opened_date": getattr(case, "opened_date", None) or case.created_at,
        },
        "stats": {
            "evidence_count": evidence_count,
            "entity_count": entity_count,
            "event_count": event_count,
            "finding_count": finding_count,
            "unverified_count": unverified_count,
            "total_size_bytes": total_size_bytes,
        },
        "recent_evidence": [
            {
                "id": ev.id,
                "evidence_number": ev.evidence_number,
                "original_filename": ev.original_filename,
                "file_type": ev.file_type or "Digital Artifact",
                "file_size": ev.file_size,
                "processing_status": ev.processing_status.value,
                "integrity_status": ev.integrity_status.value,
                "uploaded_at": ev.uploaded_at.isoformat() if ev.uploaded_at else None,
            }
            for ev in recent_evidence_rows
        ],
        "recent_events": [
            {
                "id": e.id,
                "evidence_id": e.evidence_id,
                "event_type": e.event_type.value,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                "source": e.source,
                "entity_type": e.entity_type,
                "entity_value": e.entity_value,
            }
            for e in recent_events_rows
        ],
        "recent_findings": [
            {
                "id": f.id,
                "finding_id": f.finding_id,
                "title": f.title,
                "category": f.category,
                "classification": getattr(f, "classification", "INFERENCE"),
                "confidence_score": f.confidence_score,
                "summary": f.summary,
                "review_status": f.review_status.value,
            }
            for f in recent_findings_rows
        ],
    }
