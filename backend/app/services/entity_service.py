"""
Deterministic Entity Extraction and Normalization Service for ADEIP.

Analyzes processed structured data:
- Evidence metadata (filename, hashes, storage specs)
- Investigation events (event type, entity value, metadata payload)
Identifies and normalizes entities:
- person, device, user_account, ip_address, file, usb_device, location, file_hash, domain

All extraction is 100% deterministic (no ungrounded speculation).
"""
import json
import logging
import math
import os
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.entity import EntityType, ExtractedEntityModel, ExtractionMethod
from app.models.evidence import Evidence
from app.models.investigation_event import InvestigationEvent
from app.schemas.entity import (
    EntityExtractionResultResponse,
    EntityListResponse,
    EntityResponse,
)

logger = logging.getLogger("adeip.services.entity")

# ─── Strict Deterministic Regex Patterns ──────────────────────────────────────────

IPV4_PATTERN = re.compile(
    r"\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b"
)
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b")
SHA256_PATTERN = re.compile(r"\b[A-Fa-f0-9]{64}\b")
MD5_PATTERN = re.compile(r"\b[A-Fa-f0-9]{32}\b")
USB_HARDWARE_PATTERN = re.compile(
    r"(?:USBSTOR\\[^\s\\]+|VID_[0-9A-Fa-f]{4}&PID_[0-9A-Fa-f]{4}|USB\\[^\s]+)",
    re.IGNORECASE,
)
FILE_EXT_PATTERN = re.compile(
    r"\b[A-Za-z0-9_\-\.]+\.(?:csv|json|txt|pdf|jpg|jpeg|png|mp4|evtx|exe|dll|sys|bat|ps1|sh|zip|tar|gz|docx|xlsx)\b",
    re.IGNORECASE,
)

# Structured JSON/Dict key mappings
_USER_KEYS = frozenset({
    "user", "username", "user_account", "account", "login_user",
    "subject_user", "target_user", "admin_user", "actor", "account_name",
    "source_account", "destination_account", "src_account", "dst_account",
    "sender_account", "receiver_account", "beneficiary_account",
    "account_number", "acc_no", "source_acc", "dest_acc",
})
ACCOUNT_PATTERN = re.compile(r"\bACC-[A-Za-z0-9-]+\b")
_IP_KEYS = frozenset({
    "ip", "src_ip", "dst_ip", "remote_ip", "client_ip", "host_ip",
    "ip_address", "source_ip", "dest_ip", "sourceip", "destip",
})
_PERSON_KEYS = frozenset({
    "person", "full_name", "employee_name", "officer_name",
    "suspect_name", "victim_name", "witness_name", "person_name",
})
_DEVICE_KEYS = frozenset({
    "device", "device_id", "hostname", "host", "computer_name",
    "machine_name", "workstation", "endpoint", "system_name",
})
_USB_KEYS = frozenset({
    "usb", "usb_device", "vendor_id", "product_id", "serial_number",
    "volume_serial", "usb_serial", "usb_id", "removable_device",
})
_FILE_KEYS = frozenset({
    "file", "filename", "file_path", "path", "file_name",
    "source_file", "target_file", "attachment", "document_name",
})
_LOCATION_KEYS = frozenset({
    "location", "country", "city", "region", "geo",
    "office_location", "site", "datacenter", "ip_location",
})


def _normalize_value(entity_type: EntityType, value: str) -> str:
    """
    Standardizes entity values for uniform cross-evidence comparison and indexing.
    """
    cleaned = value.strip().strip("'\"`")
    if entity_type in (EntityType.IP_ADDRESS, EntityType.USER_ACCOUNT, EntityType.FILE_HASH, EntityType.DOMAIN):
        return cleaned.lower()
    if entity_type == EntityType.FILE:
        # Standardize file path separators
        return cleaned.replace("\\", "/").strip().lower()
    if entity_type == EntityType.DEVICE:
        return cleaned.upper()
    return cleaned


class EntityService:
    """
    Forensic service executing deterministic entity recognition, normalization,
    and database storage from evidence artifacts and investigation events.
    """

    @classmethod
    def extract_entities_from_evidence(
        cls,
        db: Session,
        evidence_id: int,
        flush: bool = True,
    ) -> EntityExtractionResultResponse:
        """
        Scans an evidence artifact and its associated investigation events,
        extracts normalized entities, and persists them into the extracted_entities table.
        """
        evidence = db.scalars(select(Evidence).where(Evidence.id == evidence_id)).first()
        if not evidence:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Evidence artifact #{evidence_id} not found.",
            )

        # 1. Fetch already extracted entities to prevent duplicates
        existing_rows = db.scalars(
            select(ExtractedEntityModel).where(ExtractedEntityModel.evidence_id == evidence_id)
        ).all()
        seen_keys: Set[Tuple[Optional[int], str, str]] = {
            (r.event_id, r.entity_type.value, r.normalized_value) for r in existing_rows
        }

        new_entities_to_add: List[ExtractedEntityModel] = []
        breakdown: Dict[str, int] = {}

        def record_candidate(
            e_type: EntityType,
            raw_val: str,
            method: str,
            event_id: Optional[int] = None,
            confidence: float = 1.0,
            ctx: Optional[str] = None,
        ):
            if not raw_val or len(raw_val.strip()) < 2:
                return

            norm_val = _normalize_value(e_type, raw_val)
            key = (event_id, e_type.value, norm_val)

            if key not in seen_keys:
                seen_keys.add(key)
                entity_obj = ExtractedEntityModel(
                    case_id=evidence.case_id,
                    evidence_id=evidence.id,
                    event_id=event_id,
                    entity_type=e_type,
                    entity_value=raw_val.strip(),
                    normalized_value=norm_val,
                    extraction_method=method,
                    confidence=confidence,
                    context=ctx,
                )
                new_entities_to_add.append(entity_obj)
                breakdown[e_type.value] = breakdown.get(e_type.value, 0) + 1

        # ── Phase 1: Extract from Evidence Metadata ────────────────────────
        # File entity from original filename
        if evidence.original_filename:
            record_candidate(
                e_type=EntityType.FILE,
                raw_val=evidence.original_filename,
                method=ExtractionMethod.FILENAME_PARSER.value,
                confidence=1.0,
                ctx=f"Original filename of evidence artifact #{evidence.id}",
            )

        # File hash entity
        if evidence.sha256_hash:
            record_candidate(
                e_type=EntityType.FILE_HASH,
                raw_val=evidence.sha256_hash,
                method=ExtractionMethod.METADATA_INSPECTOR.value,
                confidence=1.0,
                ctx=f"Cryptographic SHA-256 integrity hash of evidence #{evidence.id}",
            )

        # ── Phase 2: Extract from Investigation Events ──────────────────────
        events = list(
            db.scalars(
                select(InvestigationEvent)
                .where(InvestigationEvent.evidence_id == evidence_id)
                .order_by(InvestigationEvent.id.asc())
            ).all()
        )

        for ev in events:
            ev_id = ev.id
            source_desc = f"Event #{ev_id} ({ev.event_type.value})"

            # Direct event entity
            if ev.entity_type and ev.entity_value:
                try:
                    mapped_type = EntityType(ev.entity_type.lower())
                except ValueError:
                    mapped_type = EntityType.GENERIC

                record_candidate(
                    e_type=mapped_type,
                    raw_val=ev.entity_value,
                    method=ExtractionMethod.STRUCTURED_FIELD.value,
                    event_id=ev_id,
                    confidence=0.95,
                    ctx=f"Explicit entity from {source_desc}",
                )

            # Inspect event_metadata JSON payload
            raw_meta = ev.event_metadata
            if raw_meta:
                try:
                    meta_dict = json.loads(raw_meta) if isinstance(raw_meta, str) else raw_meta
                    if isinstance(meta_dict, dict):
                        # Structured field inspection
                        for k, v in meta_dict.items():
                            k_lower = str(k).lower()
                            v_str = str(v)
                            if k_lower in _IP_KEYS:
                                record_candidate(EntityType.IP_ADDRESS, v_str, ExtractionMethod.STRUCTURED_FIELD.value, ev_id, 0.95, f"Key '{k}' in {source_desc}")
                            elif k_lower in _USER_KEYS:
                                record_candidate(EntityType.USER_ACCOUNT, v_str, ExtractionMethod.STRUCTURED_FIELD.value, ev_id, 0.95, f"Key '{k}' in {source_desc}")
                            elif k_lower in _PERSON_KEYS:
                                record_candidate(EntityType.PERSON, v_str, ExtractionMethod.STRUCTURED_FIELD.value, ev_id, 0.90, f"Person field '{k}' in {source_desc}")
                            elif k_lower in _DEVICE_KEYS:
                                record_candidate(EntityType.DEVICE, v_str, ExtractionMethod.STRUCTURED_FIELD.value, ev_id, 0.90, f"Device key '{k}' in {source_desc}")
                            elif k_lower in _USB_KEYS:
                                record_candidate(EntityType.USB_DEVICE, v_str, ExtractionMethod.STRUCTURED_FIELD.value, ev_id, 0.95, f"USB field '{k}' in {source_desc}")
                            elif k_lower in _FILE_KEYS:
                                record_candidate(EntityType.FILE, v_str, ExtractionMethod.STRUCTURED_FIELD.value, ev_id, 0.90, f"File field '{k}' in {source_desc}")
                            elif k_lower in _LOCATION_KEYS:
                                record_candidate(EntityType.LOCATION, v_str, ExtractionMethod.STRUCTURED_FIELD.value, ev_id, 0.85, f"Location field '{k}' in {source_desc}")

                        meta_text = json.dumps(meta_dict)
                    else:
                        meta_text = str(meta_dict)

                except Exception:
                    meta_text = str(raw_meta)

                # Regex pattern scans on metadata text
                # 1. IP addresses
                for ip in IPV4_PATTERN.findall(meta_text):
                    if ip not in {"0.0.0.0", "255.255.255.255", "255.255.255.0"}:
                        record_candidate(EntityType.IP_ADDRESS, ip, ExtractionMethod.REGEX_IPV4.value, ev_id, 0.90, f"Regex match in {source_desc}")

                # 2. Email accounts
                for email in EMAIL_PATTERN.findall(meta_text):
                    record_candidate(EntityType.USER_ACCOUNT, email, ExtractionMethod.REGEX_EMAIL.value, ev_id, 0.90, f"Regex email in {source_desc}")

                # 3. Cryptographic hashes
                for h_sha in SHA256_PATTERN.findall(meta_text):
                    if h_sha != evidence.sha256_hash:  # avoid duplicating evidence hash on events
                        record_candidate(EntityType.FILE_HASH, h_sha, ExtractionMethod.REGEX_HASH.value, ev_id, 0.95, f"SHA-256 in {source_desc}")

                # 4. USB hardware signatures
                for usb_match in USB_HARDWARE_PATTERN.findall(meta_text):
                    record_candidate(EntityType.USB_DEVICE, usb_match, ExtractionMethod.REGEX_USB.value, ev_id, 0.95, f"Hardware signature in {source_desc}")

                # 5. Financial account patterns
                for acc_match in ACCOUNT_PATTERN.findall(meta_text):
                    record_candidate(EntityType.USER_ACCOUNT, acc_match, ExtractionMethod.STRUCTURED_FIELD.value, ev_id, 0.95, f"Account pattern in {source_desc}")

        # Persist new entities
        if new_entities_to_add:
            db.add_all(new_entities_to_add)
            if flush:
                db.commit()

        logger.info(
            f"[EntityService] Extracted {len(new_entities_to_add)} new entities for Evidence #{evidence_id} "
            f"across {len(events)} events."
        )

        sample_entities = [
            EntityResponse.model_validate(e) for e in new_entities_to_add[:10]
        ]

        return EntityExtractionResultResponse(
            evidence_id=evidence.id,
            case_id=evidence.case_id,
            total_events_scanned=len(events),
            entities_extracted=len(existing_rows) + len(new_entities_to_add),
            new_entities_persisted=len(new_entities_to_add),
            breakdown_by_type=breakdown,
            sample_entities=sample_entities,
        )

    @classmethod
    def list_entities_for_evidence(
        cls,
        db: Session,
        evidence_id: int,
        entity_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> EntityListResponse:
        """Paginated list of entities associated with an evidence artifact."""
        stmt = select(ExtractedEntityModel).where(ExtractedEntityModel.evidence_id == evidence_id)
        if entity_type:
            stmt = stmt.where(ExtractedEntityModel.entity_type == entity_type.strip().lower())

        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        offset = (max(1, page) - 1) * page_size
        items = list(
            db.scalars(
                stmt.order_by(ExtractedEntityModel.entity_type.asc(), ExtractedEntityModel.id.asc())
                .offset(offset)
                .limit(page_size)
            ).all()
        )

        return EntityListResponse(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total > 0 else 0,
            items=[EntityResponse.model_validate(e) for e in items],
        )

    @classmethod
    def list_entities_for_case(
        cls,
        db: Session,
        case_id: int,
        entity_type: Optional[str] = None,
        search_query: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> EntityListResponse:
        """Paginated, searchable list of all entities identified across a case."""
        stmt = select(ExtractedEntityModel).where(ExtractedEntityModel.case_id == case_id)
        if entity_type:
            stmt = stmt.where(ExtractedEntityModel.entity_type == entity_type.strip().lower())
        if search_query:
            q = f"%{search_query.strip().lower()}%"
            stmt = stmt.where(ExtractedEntityModel.normalized_value.like(q))

        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        offset = (max(1, page) - 1) * page_size
        items = list(
            db.scalars(
                stmt.order_by(ExtractedEntityModel.entity_type.asc(), ExtractedEntityModel.id.asc())
                .offset(offset)
                .limit(page_size)
            ).all()
        )

        return EntityListResponse(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total > 0 else 0,
            items=[EntityResponse.model_validate(e) for e in items],
        )
