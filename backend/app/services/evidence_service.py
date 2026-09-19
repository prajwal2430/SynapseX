import datetime
import hashlib
import json
import logging
import os
import random
import string
import uuid
from typing import List, Optional, Tuple
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.audit import AuditEvent
from app.models.case import InvestigationCase
from app.models.custody import CustodyAction, ChainOfCustody
from app.models.entity import ExtractedEntityModel
from app.models.evidence import Evidence, IntegrityStatus, ProcessingStatus
from app.models.investigation_event import InvestigationEvent
from app.models.processing_job import ProcessingJob
from app.models.user import User, UserRole
from app.schemas.evidence import EvidenceResponse, EvidenceVerificationResponse
from app.services.storage_service import get_storage_service

logger = logging.getLogger("adeip.evidence_service")


class EvidenceService:
    """
    Forensic service managing secure evidence file ingestion, persistent storage abstraction,
    integrity hashing (SHA-256), path sanitization, periodic integrity auditing,
    streaming file retrieval, chain-of-custody logs, and safe physical deletion.
    """

    @staticmethod
    def _generate_evidence_number(db: Session) -> str:
        """Generates a collision-resistant unique identifier: EVD-YYYY-XXXXX"""
        year = datetime.datetime.now(datetime.timezone.utc).year
        for _ in range(10):
            suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
            candidate = f"EVD-{year}-{suffix}"
            exists = db.scalars(select(Evidence).where(Evidence.evidence_number == candidate)).first()
            if not exists:
                return candidate
        ts = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
        return f"EVD-{year}-{ts}"

    @classmethod
    def _detect_file_type(cls, filename: str) -> str:
        """Categorizes evidence into forensic domain based on extension."""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext in ["mp4", "avi", "mkv", "mov", "webm", "m4v", "wmv"]:
            return "Video Evidence"
        if ext in ["evtx", "log", "txt", "audit"]:
            return "System Logs"
        if ext in ["pcap", "pcapng", "cap"]:
            return "Network Evidence"
        if ext in ["csv", "xlsx", "xls", "tsv"]:
            return "Device Activity"
        if ext in ["raw", "mem", "dmp", "vmem"]:
            return "Memory Dump"
        if ext in ["pdf", "docx", "doc", "rtf", "odt"]:
            return "Forensic Document"
        if ext in ["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff", "svg"]:
            return "Forensic Image"
        if ext in ["mp3", "wav", "aac", "ogg", "m4a", "flac", "wma"]:
            return "Audio Evidence"
        if ext in ["json", "xml", "yaml", "yml", "sql"]:
            return "Structured Data"
        if ext in ["e01", "dd", "iso", "img", "zip", "tar", "gz", "7z"]:
            return "Disk / Archive"
        return "Digital Artifact"

    @staticmethod
    def _to_evidence_response(evidence: Evidence) -> EvidenceResponse:
        """Converts Evidence model to public response without leaking raw host filesystem paths."""
        uploader_name = evidence.uploader.full_name if evidence.uploader else None
        return EvidenceResponse(
            id=evidence.id,
            evidence_number=evidence.evidence_number,
            case_id=evidence.case_id,
            original_filename=evidence.original_filename,
            stored_filename=evidence.stored_filename,
            file_url=evidence.file_url,
            mime_type=evidence.mime_type,
            file_size=evidence.file_size,
            sha256_hash=evidence.sha256_hash,
            agent_type=evidence.agent_type,
            file_type=evidence.file_type or "Digital Artifact",
            storage_status=evidence.storage_status or "stored",
            processing_status=evidence.processing_status,
            integrity_status=evidence.integrity_status,
            last_verified_at=evidence.last_verified_at,
            uploaded_by=evidence.uploaded_by,
            uploader_name=uploader_name,
            uploaded_at=evidence.uploaded_at,
            updated_at=evidence.updated_at,
        )

    @classmethod
    def _sanitize_extension(cls, filename: str) -> str:
        """Extracts and validates lowercased file extension against forensic allowlist."""
        _, ext = os.path.splitext(filename)
        ext_lower = ext.lower().strip()
        if not ext_lower or ext_lower not in settings.ALLOWED_EVIDENCE_EXTENSIONS:
            allowed = ", ".join(settings.ALLOWED_EVIDENCE_EXTENSIONS)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported or forbidden file type '{ext_lower}'. Allowed forensic formats: {allowed}",
            )
        return ext_lower

    @classmethod
    async def upload_evidence(
        cls,
        db: Session,
        case_id: int,
        file: UploadFile,
        current_user: User,
        agent_type: Optional[str] = None,
        file_type: Optional[str] = None,
        client_ip: Optional[str] = None,
    ) -> EvidenceResponse:
        """
        Securely streams an uploaded forensic artifact to isolated persistent storage,
        computes SHA-256 on the fly, validates boundaries, and creates the database records.
        If any database operation fails, the physical file is removed to prevent orphan files.
        """
        # 1. Authorization check
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        if current_user.role not in (UserRole.INVESTIGATOR, UserRole.SUPERVISOR, UserRole.ADMIN):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You lack authorization to upload evidence to this investigation.",
            )

        # 2. Filename sanitization & safety validation
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing original filename in upload payload.",
            )

        from app.core.file_security import sanitize_filename, validate_file_safety
        original_basename = sanitize_filename(file.filename)
        validate_file_safety(original_basename)
        cls._sanitize_extension(original_basename)

        # 3. Stream to persistent storage via StorageService
        storage_service = get_storage_service()
        stored_filename, destination_path, total_bytes, calculated_hash = await storage_service.save_upload_file(
            file=file,
            case_id=case_id,
            max_bytes=settings.MAX_UPLOAD_SIZE_BYTES,
        )

        detected_mime = file.content_type or "application/octet-stream"
        evidence_num = cls._generate_evidence_number(db)
        resolved_file_type = file_type or cls._detect_file_type(original_basename)

        # 4. Save to Database with rollback protection for storage consistency
        try:
            evidence_record = Evidence(
                evidence_number=evidence_num,
                case_id=case_id,
                original_filename=original_basename,
                stored_filename=stored_filename,
                storage_path=destination_path,
                mime_type=detected_mime,
                file_size=total_bytes,
                sha256_hash=calculated_hash,
                agent_type=agent_type,
                file_type=resolved_file_type,
                storage_status="stored",
                processing_status=ProcessingStatus.PENDING,
                integrity_status=IntegrityStatus.UNVERIFIED,
                uploaded_by=current_user.id,
            )
            db.add(evidence_record)
            db.flush()

            # Record forensic audit event
            audit_entry = AuditEvent(
                user_id=current_user.id,
                action="EVIDENCE_UPLOAD",
                resource_type="evidence",
                resource_id=str(evidence_record.id),
                details=json.dumps({
                    "evidence_number": evidence_num,
                    "case_id": case_id,
                    "original_filename": original_basename,
                    "stored_filename": stored_filename,
                    "file_size": total_bytes,
                    "sha256_hash": calculated_hash,
                    "agent_type": agent_type,
                    "file_type": resolved_file_type,
                    "mime_type": detected_mime,
                }),
                ip_address=client_ip,
            )
            db.add(audit_entry)

            # Append immutable chain-of-custody upload event
            from app.services.custody_service import CustodyService
            CustodyService.record_event(
                db=db,
                evidence_id=evidence_record.id,
                action=CustodyAction.EVIDENCE_UPLOADED,
                actor_id=current_user.id,
                details={
                    "evidence_number": evidence_num,
                    "original_filename": original_basename,
                    "sha256_hash": calculated_hash,
                    "file_size": total_bytes,
                    "agent_type": agent_type,
                },
                flush=True,
            )

            db.commit()
            db.refresh(evidence_record)

        except Exception as db_exc:
            db.rollback()
            # Atomically delete stored file to prevent orphan files
            storage_service.delete_file(destination_path)
            logger.error(f"Database error during evidence upload, cleaned up {destination_path}: {db_exc}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to record evidence in database: {str(db_exc)}",
            )

        # 5. Optional background task dispatch (non-blocking when Redis worker is offline)
        try:
            from app.models.processing_job import JobStatus, ProcessingJob
            job = ProcessingJob(
                evidence_id=evidence_record.id,
                requested_by=current_user.id,
                status=JobStatus.QUEUED,
            )
            db.add(job)
            db.commit()

            # Fast check if Redis broker is reachable before attempting Celery dispatch
            redis_online = False
            try:
                import socket
                with socket.create_connection(("127.0.0.1", 6379), timeout=0.08):
                    redis_online = True
            except Exception:
                redis_online = False

            if redis_online:
                try:
                    from app.tasks.evidence_tasks import process_evidence_task
                    task = process_evidence_task.delay(evidence_id=evidence_record.id, job_id=job.id)
                    job.celery_task_id = task.id
                    db.commit()
                    logger.info(f"Enqueued background task {task.id} for Evidence #{evidence_record.id}")
                except Exception as task_err:
                    logger.warning(f"Could not enqueue background task: {task_err}")
            else:
                logger.info(f"Redis offline: ProcessingJob #{job.id} saved as QUEUED for Evidence #{evidence_record.id}")

            try:
                from app.core.websocket import InvestigationWebSocketEvent, broadcast_case_event
                broadcast_case_event(
                    case_id=case_id,
                    event_type=InvestigationWebSocketEvent.EVIDENCE_UPLOADED.value,
                    data={
                        "evidence_id": evidence_record.id,
                        "evidence_number": evidence_record.evidence_number,
                        "original_filename": evidence_record.original_filename,
                        "file_size": evidence_record.file_size,
                        "sha256_hash": evidence_record.sha256_hash,
                        "agent_type": evidence_record.agent_type,
                        "file_url": evidence_record.file_url,
                        "processing_job_id": job.id,
                    },
                )
            except Exception:
                pass

        except Exception as queue_exc:
            logger.warning(f"Evidence #{evidence_record.id} stored, background job tracking skipped: {queue_exc}")

        return cls._to_evidence_response(evidence_record)

    @classmethod
    def list_all_evidence(
        cls,
        db: Session,
        case_id: Optional[int] = None,
        agent_type: Optional[str] = None,
        search: Optional[str] = None,
        current_user: Optional[User] = None,
    ) -> List[EvidenceResponse]:
        """
        Retrieves evidence items filtered by case, agent type, or search term.
        Ordered by most recent upload first.
        """
        stmt = select(Evidence)
        if case_id is not None:
            stmt = stmt.where(Evidence.case_id == case_id)
        if agent_type:
            stmt = stmt.where(Evidence.agent_type == agent_type)
        if search:
            search_pattern = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    Evidence.original_filename.ilike(search_pattern),
                    Evidence.evidence_number.ilike(search_pattern),
                )
            )

        records = db.scalars(stmt.order_by(Evidence.uploaded_at.desc())).all()
        return [cls._to_evidence_response(e) for e in records]

    @classmethod
    def list_evidence_for_case(
        cls,
        db: Session,
        case_id: int,
        current_user: Optional[User] = None,
        agent_type: Optional[str] = None,
    ) -> List[EvidenceResponse]:
        """Retrieves all evidence records registered under a specific case."""
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        stmt = select(Evidence).where(Evidence.case_id == case_id)
        if agent_type:
            stmt = stmt.where(Evidence.agent_type == agent_type)
        records = db.scalars(stmt.order_by(Evidence.uploaded_at.desc())).all()
        return [cls._to_evidence_response(e) for e in records]

    @classmethod
    def get_evidence(cls, db: Session, evidence_id: int, current_user: Optional[User] = None) -> EvidenceResponse:
        """Retrieves metadata for a specific evidence item."""
        evidence = db.scalars(select(Evidence).where(Evidence.id == evidence_id)).first()
        if not evidence:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Evidence artifact #{evidence_id} not found.",
            )
        return cls._to_evidence_response(evidence)

    @classmethod
    def get_evidence_file_info(
        cls,
        db: Session,
        evidence_id: int,
        current_user: Optional[User] = None,
    ) -> Tuple[str, str, str]:
        """
        Locates the physical file for streaming/downloading.
        Returns: (physical_file_path, mime_type, original_filename)
        """
        evidence = db.scalars(select(Evidence).where(Evidence.id == evidence_id)).first()
        if not evidence:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Evidence artifact #{evidence_id} not found.",
            )

        storage_service = get_storage_service()
        if not storage_service.file_exists(evidence.storage_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Physical evidence file not found in storage.",
            )

        abs_path = storage_service.get_file_path(evidence.storage_path)
        return abs_path, evidence.mime_type, evidence.original_filename

    @classmethod
    def delete_evidence(
        cls,
        db: Session,
        evidence_id: int,
        current_user: User,
        client_ip: Optional[str] = None,
    ) -> bool:
        """
        Explicitly and permanently removes evidence:
        1. Authenticates user access.
        2. Deletes physical file from persistent storage.
        3. Deletes associated custody logs, jobs, extracted entities, and events.
        4. Deletes database evidence record.
        5. Logs forensic audit event.
        """
        evidence = db.scalars(select(Evidence).where(Evidence.id == evidence_id)).first()
        if not evidence:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Evidence artifact #{evidence_id} not found.",
            )

        if current_user.role not in (UserRole.INVESTIGATOR, UserRole.SUPERVISOR, UserRole.ADMIN):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You lack authorization to delete this evidence artifact.",
            )

        storage_path = evidence.storage_path
        ev_num = evidence.evidence_number
        orig_name = evidence.original_filename
        case_id = evidence.case_id

        # 1. Delete physical file from storage
        storage_service = get_storage_service()
        deleted_file_ok = storage_service.delete_file(storage_path)
        if not deleted_file_ok and storage_service.file_exists(storage_path):
            logger.error(f"Failed to delete physical file {storage_path}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete physical file from storage. Evidence record retained for consistency.",
            )

        # 2. Delete related records explicitly to prevent orphaned FKs
        db.execute(delete(ChainOfCustody).where(ChainOfCustody.evidence_id == evidence_id))
        db.execute(delete(ProcessingJob).where(ProcessingJob.evidence_id == evidence_id))
        db.execute(delete(ExtractedEntityModel).where(ExtractedEntityModel.evidence_id == evidence_id))
        db.execute(delete(InvestigationEvent).where(InvestigationEvent.evidence_id == evidence_id))

        # 3. Log audit event
        audit_entry = AuditEvent(
            user_id=current_user.id,
            action="EVIDENCE_DELETE",
            resource_type="evidence",
            resource_id=str(evidence_id),
            details=json.dumps({
                "evidence_number": ev_num,
                "case_id": case_id,
                "original_filename": orig_name,
                "deleted_by": current_user.id,
            }),
            ip_address=client_ip,
        )
        db.add(audit_entry)

        # 4. Delete evidence record
        db.delete(evidence)
        db.commit()

        logger.info(f"Evidence #{evidence_id} ({ev_num} - {orig_name}) deleted permanently by User #{current_user.id}")
        return True

    @classmethod
    def verify_evidence_integrity(
        cls,
        db: Session,
        evidence_id: int,
        current_user: User,
        client_ip: Optional[str] = None,
    ) -> EvidenceVerificationResponse:
        """
        Recalculates cryptographic SHA-256 hash of on-disk file in strictly read-only mode,
        compares with original stored hash, logs audit verification attempt, and updates status.
        """
        evidence = db.scalars(select(Evidence).where(Evidence.id == evidence_id)).first()
        if not evidence:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Evidence artifact #{evidence_id} not found.",
            )

        now_utc = datetime.datetime.now(datetime.timezone.utc)
        verifier_name = current_user.full_name
        storage_service = get_storage_service()

        if not storage_service.file_exists(evidence.storage_path):
            evidence.integrity_status = IntegrityStatus.FILE_MISSING
            evidence.last_verified_at = now_utc
            db.commit()
            return EvidenceVerificationResponse(
                evidence_id=evidence.id,
                evidence_number=evidence.evidence_number,
                original_filename=evidence.original_filename,
                integrity_status=IntegrityStatus.FILE_MISSING,
                stored_hash=evidence.sha256_hash,
                computed_hash=None,
                is_valid=False,
                verified_at=now_utc,
                verified_by=current_user.id,
                verifier_name=verifier_name,
                message="Integrity check FAILED: The evidence file is missing from persistent storage.",
            )

        sha256 = hashlib.sha256()
        chunk_size = 64 * 1024
        abs_path = storage_service.get_file_path(evidence.storage_path)

        try:
            with open(abs_path, "rb") as f_in:
                while True:
                    chunk = f_in.read(chunk_size)
                    if not chunk:
                        break
                    sha256.update(chunk)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read evidence artifact during verification: {str(exc)}",
            )

        computed_hash = sha256.hexdigest()
        if computed_hash.lower() == evidence.sha256_hash.lower():
            evidence.integrity_status = IntegrityStatus.VERIFIED
            is_valid = True
            message = "Integrity VERIFIED: Computed SHA-256 hash matches the original cryptographic signature."
        else:
            evidence.integrity_status = IntegrityStatus.HASH_MISMATCH
            is_valid = False
            message = "CRITICAL ALERT: Evidence hash mismatch! Stored file has been altered or corrupted."

        evidence.last_verified_at = now_utc
        db.commit()
        db.refresh(evidence)

        return EvidenceVerificationResponse(
            evidence_id=evidence.id,
            evidence_number=evidence.evidence_number,
            original_filename=evidence.original_filename,
            integrity_status=evidence.integrity_status,
            stored_hash=evidence.sha256_hash,
            computed_hash=computed_hash,
            is_valid=is_valid,
            verified_at=now_utc,
            verified_by=current_user.id,
            verifier_name=verifier_name,
            message=message,
        )
