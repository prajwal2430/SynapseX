import datetime
import math
import random
import string
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.case import CasePriority, CaseStatus, InvestigationCase
from app.models.user import User, UserRole
from app.schemas.case import CaseCreateRequest, CaseResponse, CaseUpdateRequest
from app.services.auth_service import AuthService


class CaseService:
    """Service handling CRUD operations, search, pagination, and authorization for investigation cases."""

    @staticmethod
    def _generate_case_number(db: Session) -> str:
        """Generates a collision-resistant unique case identifier: CASE-YYYY-XXXXX"""
        year = datetime.datetime.now(datetime.timezone.utc).year
        for _ in range(10):
            suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
            candidate = f"CASE-{year}-{suffix}"
            exists = db.scalars(select(InvestigationCase).where(InvestigationCase.case_number == candidate)).first()
            if not exists:
                return candidate
        # Fallback with timestamp
        ts = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
        return f"CASE-{year}-{ts}"

    @classmethod
    def _to_case_response(cls, case: InvestigationCase, db: Optional[Session] = None) -> CaseResponse:
        """Helper to convert ORM model to API response schema with author/assignee metadata and live counts."""
        creator_name = case.creator.full_name if case.creator else None
        assigned_name = case.assigned_to.full_name if case.assigned_to else None
        
        evidence_count = 0
        entity_count = 0
        finding_count = 0
        if db:
            from app.models.evidence import Evidence
            from app.models.entity import ExtractedEntityModel
            from app.models.finding import InvestigationFindingModel
            evidence_count = db.scalar(select(func.count()).where(Evidence.case_id == case.id)) or 0
            entity_count = db.scalar(select(func.count()).where(ExtractedEntityModel.case_id == case.id)) or 0
            finding_count = db.scalar(select(func.count()).where(InvestigationFindingModel.case_id == case.id)) or 0

        return CaseResponse(
            id=case.id,
            case_number=case.case_number,
            title=case.title,
            description=case.description,
            status=case.status,
            priority=case.priority,
            case_type=getattr(case, "case_type", None) or "Cybercrime",
            opened_date=getattr(case, "opened_date", None) or case.created_at,
            evidence_count=evidence_count,
            entity_count=entity_count,
            finding_count=finding_count,
            created_by=case.created_by,
            assigned_to_id=case.assigned_to_id,
            created_at=case.created_at,
            updated_at=case.updated_at,
            creator_name=creator_name,
            assigned_to_name=assigned_name,
        )

    @classmethod
    def create_case(cls, db: Session, case_in: CaseCreateRequest, current_user: User) -> CaseResponse:
        """
        Creates a new investigation case.
        Automatically associates created_by with the authenticated user.
        """
        # Role check: Only investigators, supervisors, and admins can initialize cases
        if current_user.role not in (UserRole.INVESTIGATOR, UserRole.SUPERVISOR, UserRole.ADMIN):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' is not authorized to create investigation cases.",
            )

        # Handle custom or auto-generated case number
        if case_in.case_number:
            case_num = case_in.case_number.strip().upper()
            existing = db.scalars(select(InvestigationCase).where(InvestigationCase.case_number == case_num)).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Case number '{case_num}' is already in use.",
                )
        else:
            case_num = cls._generate_case_number(db)

        # Validate assignee if specified
        if case_in.assigned_to_id:
            assignee = AuthService.get_by_id(db, case_in.assigned_to_id)
            if not assignee:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Assigned user with ID {case_in.assigned_to_id} does not exist.",
                )

        db_case = InvestigationCase(
            case_number=case_num,
            title=case_in.title.strip(),
            description=case_in.description.strip() if case_in.description else None,
            status=case_in.status or CaseStatus.ACTIVE,
            priority=case_in.priority or CasePriority.MEDIUM,
            case_type=case_in.case_type or "Cybercrime",
            opened_date=case_in.opened_date or datetime.datetime.now(datetime.timezone.utc),
            created_by=current_user.id,
            assigned_to_id=case_in.assigned_to_id,
        )
        db.add(db_case)
        db.commit()
        db.refresh(db_case)
        return cls._to_case_response(db_case, db=db)

    @classmethod
    def get_case(cls, db: Session, case_id: Any, current_user: User) -> CaseResponse:
        """
        Retrieves a single case by ID or case_number with RBAC evaluation.
        """
        case = None
        s_id = str(case_id).strip()
        if s_id.isdigit():
            case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == int(s_id))).first()
        if not case:
            case = db.scalars(select(InvestigationCase).where(InvestigationCase.case_number == s_id)).first()

        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case '{case_id}' not found.",
            )

        return cls._to_case_response(case, db=db)

    @classmethod
    def list_cases(
        cls,
        db: Session,
        current_user: User,
        search: Optional[str] = None,
        status_filter: Optional[CaseStatus] = None,
        priority_filter: Optional[CasePriority] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[CaseResponse], int, int]:
        """
        Lists cases with pagination, multi-field search, and status/priority filters.
        Returns (items, total_count, total_pages).
        """
        stmt = select(InvestigationCase)

        # Apply search on case_number and title
        if search:
            search_term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    InvestigationCase.case_number.ilike(search_term),
                    InvestigationCase.title.ilike(search_term),
                    InvestigationCase.description.ilike(search_term),
                )
            )

        # Apply filters
        if status_filter:
            stmt = stmt.where(InvestigationCase.status == status_filter)
        if priority_filter:
            stmt = stmt.where(InvestigationCase.priority == priority_filter)

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_count = db.scalar(count_stmt) or 0

        # Calculate pagination
        total_pages = math.ceil(total_count / page_size) if total_count > 0 else 1
        page_clamped = max(1, page)
        offset = (page_clamped - 1) * page_size

        # Order by newest first
        stmt = stmt.order_by(InvestigationCase.created_at.desc()).offset(offset).limit(page_size)
        results = db.scalars(stmt).all()

        items = [cls._to_case_response(c, db=db) for c in results]
        return items, total_count, total_pages

    @classmethod
    def update_case(
        cls,
        db: Session,
        case_id: int,
        case_in: CaseUpdateRequest,
        current_user: User,
    ) -> CaseResponse:
        """
        Updates an existing case. Only creators, supervisors, and admins can edit.
        """
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        # RBAC Check: Admins and Supervisors can edit any case; Investigators can edit their own/assigned cases
        is_creator = case.created_by == current_user.id
        is_assignee = case.assigned_to_id == current_user.id
        is_privileged = current_user.role in (UserRole.ADMIN, UserRole.SUPERVISOR)

        if not (is_privileged or ((is_creator or is_assignee) and current_user.role == UserRole.INVESTIGATOR)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this investigation case.",
            )

        if case_in.title is not None:
            case.title = case_in.title.strip()
        if case_in.description is not None:
            case.description = case_in.description.strip() if case_in.description else None
        if case_in.status is not None:
            case.status = case_in.status
        if case_in.priority is not None:
            case.priority = case_in.priority
        if case_in.case_type is not None:
            case.case_type = case_in.case_type
        if case_in.opened_date is not None:
            case.opened_date = case_in.opened_date
        if case_in.assigned_to_id is not None:
            if case_in.assigned_to_id > 0:
                assignee = AuthService.get_by_id(db, case_in.assigned_to_id)
                if not assignee:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Assigned user with ID {case_in.assigned_to_id} does not exist.",
                    )
                case.assigned_to_id = case_in.assigned_to_id
            else:
                case.assigned_to_id = None

        db.commit()
        db.refresh(case)
        return cls._to_case_response(case, db=db)

    @classmethod
    def delete_case(cls, db: Session, case_id: Any, current_user: User) -> None:
        """
        Deletes a case and all associated child entities, events, findings, and evidence artifacts.
        """
        case = None
        s_id = str(case_id).strip()
        if s_id.isdigit():
            case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == int(s_id))).first()
        if not case:
            case = db.scalars(select(InvestigationCase).where(InvestigationCase.case_number == s_id)).first()

        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case '{case_id}' not found.",
            )

        # RBAC Check: Admins, Supervisors, Investigators, or Creator can delete case
        is_creator = case.created_by == current_user.id
        is_authorized = (
            current_user.role in (UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.INVESTIGATOR)
            or is_creator
        )
        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this investigation case.",
            )

        cid = case.id
        from sqlalchemy import delete
        from app.models.evidence import Evidence
        from app.models.investigation_event import InvestigationEvent
        from app.models.entity import ExtractedEntityModel
        from app.models.correlation import InvestigationCorrelation
        from app.models.finding import InvestigationFindingModel
        from app.models.report import InvestigationReportModel

        # Cascade clean all child tables for this case
        db.execute(delete(InvestigationFindingModel).where(InvestigationFindingModel.case_id == cid))
        db.execute(delete(InvestigationCorrelation).where(InvestigationCorrelation.case_id == cid))
        db.execute(delete(ExtractedEntityModel).where(ExtractedEntityModel.case_id == cid))
        db.execute(delete(InvestigationEvent).where(InvestigationEvent.case_id == cid))
        db.execute(delete(Evidence).where(Evidence.case_id == cid))
        db.execute(delete(InvestigationReportModel).where(InvestigationReportModel.case_id == cid))

        db.delete(case)
        db.commit()
