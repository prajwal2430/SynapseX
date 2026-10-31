"""
CSV Evidence Parser.

Strategy:
  - Read using Python's built-in csv module (no pandas dependency).
  - Detect timestamp-like columns by name heuristic.
  - Each row becomes one STRUCTURED_ROW event.
  - First 5000 rows processed to prevent runaway memory on large files.
"""
import csv
import json
import logging
from datetime import datetime, timezone
from typing import List, Optional

from app.processing.base import BaseParser, ParsedEvent

logger = logging.getLogger("adeip.parser.csv")

# Column names that likely contain timestamps
_TIMESTAMP_HINTS = frozenset({
    "timestamp", "time", "datetime", "date", "created_at", "updated_at",
    "event_time", "log_time", "recorded_at", "occurred_at", "ts",
})

_MAX_ROWS = 5000


def _try_parse_timestamp(value: str) -> Optional[datetime]:
    """Attempt common ISO and date formats. Returns None on failure."""
    formats = [
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y %H:%M:%S",
        "%m/%d/%Y %H:%M:%S",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(value.strip(), fmt).replace(tzinfo=timezone.utc)
        except (ValueError, AttributeError):
            continue
    return None


class CSVParser(BaseParser):
    """Parses CSV evidence files into one STRUCTURED_ROW event per row."""

    @property
    def supported_extensions(self) -> List[str]:
        return [".csv"]

    def parse(self, file_path: str, original_filename: str) -> List[ParsedEvent]:
        events: List[ParsedEvent] = []
        try:
            with open(file_path, newline="", encoding="utf-8", errors="replace") as fh:
                reader = csv.DictReader(fh)
                headers = reader.fieldnames or []

                # Find the first column with a timestamp-like name
                ts_col = next(
                    (h for h in headers if h.strip().lower() in _TIMESTAMP_HINTS),
                    None,
                )

                for row_num, row in enumerate(reader, start=1):
                    if row_num > _MAX_ROWS:
                        logger.warning(
                            f"CSV parser: truncated at {_MAX_ROWS} rows for {original_filename}"
                        )
                        break

                    # Try to extract a timestamp
                    ts: Optional[datetime] = None
                    if ts_col and row.get(ts_col):
                        ts = _try_parse_timestamp(row[ts_col])

                    events.append(ParsedEvent(
                        event_type="structured_row",
                        source=original_filename,
                        timestamp=ts,
                        entity_type="row_index",
                        entity_value=str(row_num),
                        metadata=dict(row),
                    ))

        except Exception as exc:
            logger.error(f"CSV parser failed on {original_filename}: {exc}", exc_info=True)

        return events
