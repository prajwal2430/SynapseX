"""
Evidence Agent (Deterministic Entity Recognition & Normalization).

Responsibilities:
- Reads evidence metadata and extracted investigation events.
- Extracts and normalizes structured entities:
  person, device, user_account, ip_address, file, usb_device, location, file_hash, domain.
- Guarantees deterministic extraction without ungrounded LLM speculation.
- Tags every entity with entity_type, entity_value, normalized_value, evidence_id, event_id, and extraction_method.
"""
import datetime
import json
import logging
import re
from typing import Any, Dict, List, Set, Tuple
from app.agents.state import ExtractedEntity, InvestigationState

logger = logging.getLogger("adeip.agents.evidence")

# ─── Deterministic Patterns ───────────────────────────────────────────

IPV4_PATTERN = re.compile(
    r"\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b"
)
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b")
SHA256_PATTERN = re.compile(r"\b[A-Fa-f0-9]{64}\b")
USB_HARDWARE_PATTERN = re.compile(
    r"(?:USBSTOR\\[^\s\\]+|VID_[0-9A-Fa-f]{4}&PID_[0-9A-Fa-f]{4}|USB\\[^\s]+)",
    re.IGNORECASE,
)

_USER_KEYS = frozenset({
    "user", "username", "user_account", "account", "login_user",
    "subject_user", "target_user", "admin_user", "actor", "account_name",
})
_IP_KEYS = frozenset({
    "ip", "src_ip", "dst_ip", "remote_ip", "client_ip", "host_ip",
    "ip_address", "source_ip", "dest_ip",
})
_PERSON_KEYS = frozenset({
    "person", "full_name", "employee_name", "officer_name",
    "suspect_name", "victim_name", "witness_name",
})
_DEVICE_KEYS = frozenset({
    "device", "device_id", "hostname", "host", "computer_name",
    "machine_name", "workstation", "endpoint", "system_name",
})
_USB_KEYS = frozenset({
    "usb", "usb_device", "vendor_id", "product_id", "serial_number",
    "volume_serial", "usb_serial", "usb_id",
})
_FILE_KEYS = frozenset({
    "file", "filename", "file_path", "path", "file_name",
    "source_file", "target_file", "attachment",
})
_LOCATION_KEYS = frozenset({
    "location", "country", "city", "region", "geo",
    "office_location", "site", "datacenter",
})


def _normalize(entity_type: str, val: str) -> str:
    cleaned = val.strip().strip("'\"`")
    if entity_type in ("ip_address", "user_account", "file_hash", "domain"):
        return cleaned.lower()
    if entity_type == "file":
        return cleaned.replace("\\", "/").strip().lower()
    if entity_type == "device":
        return cleaned.upper()
    return cleaned


def evidence_agent(state: InvestigationState) -> Dict[str, Any]:
    """
    Evidence Agent: Deterministically identifies, extracts, and normalizes entities
    spanning person, device, user_account, ip_address, file, usb_device, location, file_hash.
    """
    case_id = state.get("case_id", 0)
    raw_events = state.get("raw_events", [])
    evidence_items = state.get("evidence_items", [])
    logs = list(state.get("agent_logs", []))

    logger.info(f"[EvidenceAgent] Running deterministic entity extraction for Case #{case_id}.")

    extracted_entities: List[Dict[str, Any]] = []
    seen_entities: Set[Tuple[Any, str, str]] = set()

    def add_entity(
        e_type: str,
        val: str,
        method: str,
        ev_id: Any,
        event_id: Any = None,
        conf: float = 1.0,
        source: str = "",
        context: str = "",
    ):
        if not val or len(str(val).strip()) < 2:
            return
        val_str = str(val).strip()
        norm_val = _normalize(e_type, val_str)
        key = (ev_id, e_type, norm_val)

        if key not in seen_entities:
            seen_entities.add(key)
            entity = ExtractedEntity(
                entity_type=e_type,
                entity_value=val_str,
                normalized_value=norm_val,
                evidence_id=ev_id,
                event_id=event_id,
                event_ids=[event_id] if event_id else [],
                extraction_method=method,
                source=source,
                confidence=conf,
                context=context,
            )
            extracted_entities.append(entity.model_dump())
        else:
            # Append event_id to existing entity
            if event_id:
                for item in extracted_entities:
                    if item.get("evidence_id") == ev_id and item.get("entity_type") == e_type and item.get("normalized_value") == norm_val:
                        if event_id not in item.get("event_ids", []):
                            item["event_ids"].append(event_id)

    def scan_dict_and_text(data_dict: Dict[str, Any], text: str, ev_id: Any, event_id: Any = None, source: str = ""):
        # 1. Structured key inspection
        if data_dict and isinstance(data_dict, dict):
            for k, v in data_dict.items():
                if not isinstance(v, (str, int, float)):
                    continue
                v_str = str(v).strip()
                k_lower = k.lower()

                if k_lower in _IP_KEYS:
                    add_entity("ip_address", v_str, "structured_field", ev_id, event_id, 0.95, source, f"Field '{k}'")
                elif k_lower in _USER_KEYS:
                    add_entity("user_account", v_str, "structured_field", ev_id, event_id, 0.95, source, f"Field '{k}'")
                elif k_lower in _PERSON_KEYS:
                    add_entity("person", v_str, "structured_field", ev_id, event_id, 0.90, source, f"Person field '{k}'")
                elif k_lower in _DEVICE_KEYS:
                    add_entity("device", v_str, "structured_field", ev_id, event_id, 0.90, source, f"Device field '{k}'")
                elif k_lower in _USB_KEYS:
                    add_entity("usb_device", v_str, "structured_field", ev_id, event_id, 0.95, source, f"USB field '{k}'")
                elif k_lower in _FILE_KEYS:
                    add_entity("file", v_str, "structured_field", ev_id, event_id, 0.90, source, f"File field '{k}'")
                elif k_lower in _LOCATION_KEYS:
                    add_entity("location", v_str, "structured_field", ev_id, event_id, 0.85, source, f"Location field '{k}'")

        # 2. Text regex extraction
        if text:
            for ip in IPV4_PATTERN.findall(text):
                if ip not in {"0.0.0.0", "255.255.255.255", "255.255.255.0"}:
                    add_entity("ip_address", ip, "regex_ipv4", ev_id, event_id, 0.90, source, "Regex IPv4 match")
            for email in EMAIL_PATTERN.findall(text):
                add_entity("user_account", email, "regex_email", ev_id, event_id, 0.90, source, "Regex email match")
            for sha in SHA256_PATTERN.findall(text):
                add_entity("file_hash", sha, "regex_sha256", ev_id, event_id, 0.95, source, "Regex SHA-256 match")
            for usb_dev in USB_HARDWARE_PATTERN.findall(text):
                add_entity("usb_device", usb_dev, "regex_usb", ev_id, event_id, 0.95, source, "USB hardware identifier")

    # 1. Extract from Evidence Items & Metadata
    for ev in evidence_items:
        ev_id = ev.get("id") or ev.get("evidence_id")
        orig_name = ev.get("original_filename") or ev.get("filename")
        sha256 = ev.get("sha256_hash") or ev.get("sha256")
        meta = ev.get("metadata") or {}
        content_text = ev.get("content_text") or ""

        if orig_name:
            add_entity(
                e_type="file",
                val=orig_name,
                method="filename_parser",
                ev_id=ev_id,
                source=orig_name,
                context=f"Original filename of evidence #{ev_id}",
            )
        if sha256:
            add_entity(
                e_type="file_hash",
                val=sha256,
                method="metadata_inspector",
                ev_id=ev_id,
                source=orig_name or "evidence_hash",
                context=f"SHA-256 integrity hash of evidence #{ev_id}",
            )

        scan_dict_and_text(meta, content_text, ev_id, source=orig_name or f"Evidence #{ev_id}")

    # 2. Extract from Raw Investigation Events
    for event in raw_events:
        ev_id = event.get("evidence_id")
        event_id = event.get("id") if event.get("id") is not None else event.get("event_id")
        source = event.get("source") or f"Event #{event_id}"
        explicit_type = event.get("entity_type")
        explicit_val = event.get("entity_value")
        meta_raw = event.get("metadata")
        desc = event.get("description") or ""

        # Explicit entity from event parser
        if explicit_type and explicit_val:
            add_entity(
                e_type=explicit_type.lower(),
                val=explicit_val,
                method="structured_field",
                ev_id=ev_id,
                event_id=event_id,
                conf=0.95,
                source=source,
                context=f"Explicit entity in event #{event_id}",
            )

        # Inspect direct event fields
        scan_dict_and_text(event, desc, ev_id, event_id=event_id, source=source)

        # Inspect metadata payload
        if meta_raw:
            meta_dict = meta_raw if isinstance(meta_raw, dict) else {}
            meta_str = ""
            if isinstance(meta_raw, str):
                try:
                    meta_dict = json.loads(meta_raw)
                except Exception:
                    meta_str = meta_raw
            scan_dict_and_text(meta_dict, meta_str, ev_id, event_id=event_id, source=source)

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    logs.append({
        "agent": "evidence_agent",
        "timestamp": now_iso,
        "details": f"Extracted {len(extracted_entities)} normalized entities across evidence items.",
        "status": "completed",
    })

    return {
        "extracted_entities": extracted_entities,
        "agent_logs": logs,
    }
