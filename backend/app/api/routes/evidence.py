from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_active_user
from app.api.dependencies.database import get_db
from app.models.user import User
from app.schemas.custody import ChainOfCustodyResponse
from app.schemas.evidence import (
    EvidenceDeleteResponse,
    EvidenceListResponse,
    EvidenceResponse,
    EvidenceUploadResponse,
    EvidenceVerificationResponse,
)
from app.services.custody_service import CustodyService
from app.services.evidence_service import EvidenceService

# Router 1: Case-scoped evidence routes (/api/cases/{case_id}/evidence)
case_evidence_router = APIRouter(prefix="/cases", tags=["Case Evidence"])

# Router 2: Direct evidence item routes (/api/evidence)
evidence_router = APIRouter(prefix="/evidence", tags=["Evidence Intelligence"])


# ─────────────────────────────────────────────────────────────────────────────
# CASE-SCOPED EVIDENCE ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@case_evidence_router.post(
    "/{case_id}/evidence",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Securely upload a forensic evidence artifact to a specific case",
)
async def upload_case_evidence(
    case_id: int,
    request: Request,
    file: UploadFile = File(..., description="Forensic evidence artifact"),
    agent_type: Optional[str] = Form(None, description="Investigative AI agent tag (e.g. cctv, timeline)"),
    file_type: Optional[str] = Form(None, description="Forensic type (e.g. Video Evidence, Forensic Document)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Streams and cryptographically validates (SHA-256) an evidence file into isolated persistent storage.
    Enforces file type allowlist, size boundaries, path traversal immunity, and audit logging.
    Automatically records chain-of-custody acquisition event.
    """
    client_ip = request.client.host if request.client else None
    return await EvidenceService.upload_evidence(
        db=db,
        case_id=case_id,
        file=file,
        current_user=current_user,
        agent_type=agent_type,
        file_type=file_type,
        client_ip=client_ip,
    )


@case_evidence_router.get(
    "/{case_id}/evidence",
    response_model=EvidenceListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all evidence items registered to a case",
)
async def list_case_evidence(
    case_id: int,
    agent_type: Optional[str] = Query(None, description="Filter by assigned AI agent"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves safe forensic metadata for all evidence artifacts attached to the specified case.
    """
    items = EvidenceService.list_evidence_for_case(
        db=db,
        case_id=case_id,
        current_user=current_user,
        agent_type=agent_type,
    )
    return EvidenceListResponse(items=items, total=len(items))


# ─────────────────────────────────────────────────────────────────────────────
# GENERAL EVIDENCE ENDPOINTS (/api/evidence)
# ─────────────────────────────────────────────────────────────────────────────

@evidence_router.post(
    "/upload",
    response_model=EvidenceUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="General evidence upload endpoint (persists physical file + database record)",
)
async def upload_evidence_general(
    request: Request,
    file: UploadFile = File(..., description="Forensic evidence file"),
    case_id: Optional[int] = Form(None, description="Case ID (defaults to 1 if not specified)"),
    agent_type: Optional[str] = Form(None, description="Associated AI Agent type"),
    file_type: Optional[str] = Form(None, description="Forensic evidence type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Direct upload endpoint for evidence files:
    1. Authenticates user.
    2. Validates safety, size, and extension.
    3. Persistently writes file to disk storage.
    4. Records metadata in database.
    5. Returns permanent evidence ID and fileUrl.
    """
    client_ip = request.client.host if request.client else None
    resolved_case_id = case_id or 1

    evidence_resp = await EvidenceService.upload_evidence(
        db=db,
        case_id=resolved_case_id,
        file=file,
        current_user=current_user,
        agent_type=agent_type,
        file_type=file_type,
        client_ip=client_ip,
    )

    return EvidenceUploadResponse(
        success=True,
        evidence=evidence_resp,
        message=f"Artifact '{evidence_resp.original_filename}' successfully stored and cryptographically sealed.",
    )


@evidence_router.get(
    "",
    response_model=EvidenceListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all evidence with optional filters for case, agent, or search",
)
async def list_all_evidence(
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    agent_type: Optional[str] = Query(None, description="Filter by agent type"),
    search: Optional[str] = Query(None, description="Search by filename or evidence number"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves evidence records from database, ordered from newest to oldest.
    Used by frontend on page load to display all persistent evidence artifacts.
    """
    items = EvidenceService.list_all_evidence(
        db=db,
        case_id=case_id,
        agent_type=agent_type,
        search=search,
        current_user=current_user,
    )
    return EvidenceListResponse(items=items, total=len(items))


@evidence_router.get(
    "/{evidence_id}",
    response_model=EvidenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get single evidence artifact metadata",
)
async def get_evidence_detail(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves safe metadata and processing status for an individual evidence artifact.
    """
    return EvidenceService.get_evidence(db=db, evidence_id=evidence_id, current_user=current_user)


@evidence_router.get(
    "/{evidence_id}/file",
    summary="Stream or download the persistent physical evidence file",
)
async def get_evidence_file(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Streams the physical evidence file from persistent storage with correct MIME type
    and Range request support for media playback (audio, video, PDF, images).
    """
    file_path, mime_type, original_name = EvidenceService.get_evidence_file_info(
        db=db,
        evidence_id=evidence_id,
        current_user=current_user,
    )

    # Return FileResponse with inline disposition and proper MIME type
    return FileResponse(
        path=file_path,
        media_type=mime_type,
        filename=original_name,
        headers={
            "Content-Disposition": f'inline; filename="{original_name}"',
            "Accept-Ranges": "bytes",
        },
    )


@evidence_router.delete(
    "/{evidence_id}",
    response_model=EvidenceDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Permanently delete an evidence artifact and its physical file",
)
async def delete_evidence(
    evidence_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Explicit deletion:
    1. Authenticates user and checks role permissions.
    2. Deletes physical file from persistent storage.
    3. Cascades deletion to child custody logs and jobs.
    4. Deletes database record.
    5. Returns success confirmation.
    """
    client_ip = request.client.host if request.client else None
    EvidenceService.delete_evidence(
        db=db,
        evidence_id=evidence_id,
        current_user=current_user,
        client_ip=client_ip,
    )

    return EvidenceDeleteResponse(
        success=True,
        message="Evidence artifact and physical storage file deleted successfully.",
        evidence_id=evidence_id,
    )


@evidence_router.post(
    "/{evidence_id}/verify",
    response_model=EvidenceVerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify cryptographic evidence integrity (SHA-256)",
)
async def verify_evidence_integrity(
    evidence_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Reads stored file in read-only mode, recalculates SHA-256 hash, and compares with original signature.
    """
    client_ip = request.client.host if request.client else None
    return EvidenceService.verify_evidence_integrity(
        db=db,
        evidence_id=evidence_id,
        current_user=current_user,
        client_ip=client_ip,
    )


@evidence_router.get(
    "/{evidence_id}/chain-of-custody",
    response_model=ChainOfCustodyResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve the complete chain-of-custody log for an evidence artifact",
)
async def get_chain_of_custody(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns all immutable chain-of-custody events for a forensic evidence artifact.
    """
    return CustodyService.get_chain_for_evidence(
        db=db,
        evidence_id=evidence_id,
        current_user=current_user,
    )
