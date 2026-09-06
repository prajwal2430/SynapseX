"""
JSON Evidence Parser.

Strategy:
  - Accept either a JSON array or a single JSON object.
  - Each item in an array → one JSON_RECORD event.
  - A top-level object → one JSON_RECORD event.
  - Nested objects are serialized as metadata.
  - Attempt timestamp extraction from common timestamp-like key names.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.processing.base import BaseParser, ParsedEvent

logger = logging.getLogger("adeip.parser.json")

_TIMESTAMP_HINTS = frozenset({
    "timestamp", "time", "datetime", "date", "created_at", "updated_at",
    "event_time", "log_time", "ts", "recorded_at",
})

_MAX_RECORDS = 5000


def _try_parse_timestamp(value: Any) -> Optional[datetime]:
    if isinstance(value, (int, float)):
        # Unix epoch
        try:
            return datetime.fromtimestamp(value, tz=timezone.utc)
        except (OSError, OverflowError, ValueError):
            return None
    if isinstance(value, str):
        for fmt in [
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
        ]:
            try:
                return datetime.strptime(value.strip(), fmt).replace(tzinfo=timezone.utc)
            except (ValueError, AttributeError):
                continue
    return None


def _find_timestamp(obj: Dict[str, Any]) -> Optional[datetime]:
    for key, val in obj.items():
        if key.lower() in _TIMESTAMP_HINTS:
            result = _try_parse_timestamp(val)
            if result:
                return result
    return None


class JSONParser(BaseParser):
    """Parses JSON evidence files — array or single object — into JSON_RECORD events."""

    @property
    def supported_extensions(self) -> List[str]:
        return [".json"]

    def parse(self, file_path: str, original_filename: str) -> List[ParsedEvent]:
        events: List[ParsedEvent] = []
        try:
            with open(file_path, encoding="utf-8", errors="replace") as fh:
                data = json.load(fh)

            records = data if isinstance(data, list) else [data]

            for idx, record in enumerate(records[:_MAX_RECORDS], start=1):
                if not isinstance(record, dict):
                    # Scalar or array item — wrap it
                    record = {"value": record, "index": idx}

                ts = _find_timestamp(record)
                events.append(ParsedEvent(
                    event_type="json_record",
                    source=original_filename,
                    timestamp=ts,
                    entity_type="record_index",
                    entity_value=str(idx),
                    metadata=record,
                ))

            if len(records) > _MAX_RECORDS:
                logger.warning(
                    f"JSON parser: truncated at {_MAX_RECORDS} records for {original_filename}"
                )

        except json.JSONDecodeError as exc:
            logger.error(f"JSON parser: invalid JSON in {original_filename}: {exc}")
        except Exception as exc:
            logger.error(f"JSON parser failed on {original_filename}: {exc}", exc_info=True)

        return events
