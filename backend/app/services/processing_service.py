"""
Evidence Processing Service — Orchestrator.

Responsibilities:
  1. Detect evidence type from file extension.
  2. Route to the appropriate parser.
  3. Persist ParsedEvent results as InvestigationEvent rows.
  4. Update Evidence.processing_status throughout.
  5. Append chain-of-custody and audit events.
  6. Never crash the API — all parser failures are caught and logged.
"""
import json
import logging
import os
from typing import List, Optional, Type

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.audit_actions import AuditAction, AuditResourceType
from app.models.custody import CustodyAction
from app.models.evidence import Evidence, ProcessingStatus
from app.models.investigation_event import EventType, InvestigationEvent
from app.models.user import User
from app.processing.base import BaseParser, ParsedEvent
from app.processing.csv_parser import CSVParser
from app.processing.evtx_parser import EVTXParser
from app.processing.json_parser import JSONParser
from app.processing.media_parser import MediaParser
from app.processing.txt_parser import TXTParser
from app.schemas.processing import ProcessingResultResponse
from app.services.audit_service import AuditService
from app.services.custody_service import CustodyService

logger = logging.getLogger("adeip.processing")


from app.processing.doc_parser import DocParser

# Extension → Parser class registry
_PARSER_REGISTRY: dict[str, Type[BaseParser]] = {
    ".csv":   CSVParser,
    ".tsv":   CSVParser,
    ".json":  JSONParser,
    ".txt":   DocParser,
    ".log":   DocParser,
    ".audit": DocParser,
    ".ini":   DocParser,
    ".conf":  DocParser,
    ".cfg":   DocParser,
    ".xml":   DocParser,
    ".yaml":  DocParser,
    ".yml":   DocParser,
    ".sql":   DocParser,
    ".pdf":   DocParser,
    ".docx":  DocParser,
    ".doc":   DocParser,
    ".rtf":   DocParser,
    ".evtx":  EVTXParser,
    ".jpg":   MediaParser,
    ".jpeg":  MediaParser,
    ".png":   MediaParser,
    ".webp":  MediaParser,
    ".mp4":   MediaParser,
    ".mov":   MediaParser,
    ".mkv":   MediaParser,
    ".mp3":   MediaParser,
    ".wav":   MediaParser,
    ".m4a":   MediaParser,
}


def _resolve_parser(extension: str) -> Optional[BaseParser]:
    """Return an instantiated parser for the given extension, or fallback to DocParser."""
    ext = extension.lower() if extension else ""
    cls = _PARSER_REGISTRY.get(ext)
    if cls:
        return cls()
    # Safe fallback for arbitrary text/document files
    return DocParser()


class ProcessingService:
    """
    Orchestrates end-to-end evidence processing for ADEIP.
    Stateless — all state lives in the database session.
    """

    @classmethod
    def process_evidence(
        cls,
        db: Session,
        evidence_id: int,
        current_user: User,
        client_ip: Optional[str] = None,
    ) -> ProcessingResultResponse:
        """
        Main entry point. Fetches evidence, selects parser, runs it,
        persists results, and returns a summary.
        """
        # 1. Load evidence record
        evidence = db.scalars(
            select(Evidence).where(Evidence.id == evidence_id)
        ).first()
        if not evidence:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Evidence artifact #{evidence_id} not found.",
            )

        # 2. Guard against re-processing completed items without explicit intent
        if evidence.processing_status == ProcessingStatus.PROCESSING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Evidence is already being processed. Wait for it to complete.",
            )

        # 3. Mark as PROCESSING
        evidence.processing_status = ProcessingStatus.PROCESSING
        db.flush()

        # 4. Detect extension and resolve parser
        ext = os.path.splitext(evidence.original_filename)[1].lower()
        parser = _resolve_parser(ext)

        if parser is None:
            evidence.processing_status = ProcessingStatus.FAILED
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"No parser registered for evidence type '{ext}'.",
            )

        # 5. Audit — processing started
        AuditService.log(
            db=db,
            action=AuditAction.ANALYSIS_STARTED,
            resource_type=AuditResourceType.EVIDENCE,
            user_id=current_user.id,
            resource_id=str(evidence.id),
            details={
                "evidence_number": evidence.evidence_number,
                "extension": ext,
                "parser": type(parser).__name__,
            },
            ip_address=client_ip,
            flush=True,
        )
        CustodyService.record_event(
            db=db,
            evidence_id=evidence.id,
            action=CustodyAction.PROCESSING_STARTED,
            actor_id=current_user.id,
            details={"parser": type(parser).__name__, "extension": ext},
            flush=True,
        )

        # 6. Run parser — failures are contained here
        parsed_events: List[ParsedEvent] = []
        error_message: Optional[str] = None
        try:
            parsed_events = parser.parse(
                file_path=evidence.storage_path,
                original_filename=evidence.original_filename,
            )
            logger.info(
                f"Processing: {type(parser).__name__} produced {len(parsed_events)} events "
                f"for evidence #{evidence_id}"
            )
        except Exception as exc:
            error_message = str(exc)
            logger.error(
                f"Parser {type(parser).__name__} raised an unhandled exception "
                f"for evidence #{evidence_id}: {exc}",
                exc_info=True,
            )

        # 7. Persist InvestigationEvent rows
        saved_count = 0
        if parsed_events and not error_message:
            # Clean up any existing events and entities for this evidence item (reprocessing safety)
            from sqlalchemy import delete
            from app.models.entity import ExtractedEntityModel
            db.execute(delete(InvestigationEvent).where(InvestigationEvent.evidence_id == evidence.id))
            db.execute(delete(ExtractedEntityModel).where(ExtractedEntityModel.evidence_id == evidence.id))
            db.flush()

            for pe in parsed_events:
                try:
                    event_type_val = EventType(pe.event_type)
                except ValueError:
                    event_type_val = EventType.OTHER

                ie = InvestigationEvent(
                    case_id=evidence.case_id,
                    evidence_id=evidence.id,
                    event_type=event_type_val,
                    timestamp=pe.timestamp,
                    source=pe.source,
                    entity_type=pe.entity_type,
                    entity_value=pe.entity_value,
                    metadata=json.dumps(pe.metadata) if pe.metadata else None,
                )
                db.add(ie)
                saved_count += 1
            db.flush()

            # Automatically extract structured entities from newly created events and metadata
            try:
                from app.services.entity_service import EntityService
                EntityService.extract_entities_from_evidence(db=db, evidence_id=evidence.id, flush=True)
            except Exception as ent_exc:
                logger.warning(f"Entity extraction warning for Evidence #{evidence.id}: {ent_exc}")

        # 8. Update evidence processing status
        if error_message:
            evidence.processing_status = ProcessingStatus.FAILED
        else:
            evidence.processing_status = ProcessingStatus.COMPLETED

        # 9. Audit — processing completed
        AuditService.log(
            db=db,
            action=AuditAction.ANALYSIS_COMPLETED,
            resource_type=AuditResourceType.EVIDENCE,
            user_id=current_user.id,
            resource_id=str(evidence.id),
            details={
                "evidence_number": evidence.evidence_number,
                "events_extracted": saved_count,
                "status": evidence.processing_status.value,
                "error": error_message,
            },
            ip_address=client_ip,
            flush=True,
        )
        CustodyService.record_event(
            db=db,
            evidence_id=evidence.id,
            action=CustodyAction.PROCESSING_COMPLETED,
            actor_id=current_user.id,
            details={
                "events_extracted": saved_count,
                "status": evidence.processing_status.value,
            },
            flush=True,
        )

        db.commit()
        db.refresh(evidence)

        return ProcessingResultResponse(
            evidence_id=evidence.id,
            evidence_number=evidence.evidence_number,
            original_filename=evidence.original_filename,
            processing_status=evidence.processing_status.value,
            parser_used=type(parser).__name__,
            events_extracted=saved_count,
            error=error_message,
        )
