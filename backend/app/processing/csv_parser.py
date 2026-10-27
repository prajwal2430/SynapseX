"""
CSV Evidence Parser for ADEIP / SynapseX.
Parses structured CSV records into normalized forensic investigation events.

Inspects columns for:
  - Financial transactions (transaction_id, sender, receiver, amount)
  - Communication records (phone, caller, callee, email)
  - Network connections (src_ip, dst_ip, port)
  - Auth events (user, username, event_id, status)
  - Timestamps with timezone normalization
"""
import csv
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.processing.base import BaseParser, ParsedEvent

logger = logging.getLogger("adeip.parser.csv")

_TIMESTAMP_HINTS = frozenset({
    "timestamp", "time", "datetime", "date", "created_at", "updated_at",
    "event_time", "log_time", "recorded_at", "occurred_at", "ts",
})

_MAX_ROWS = 5000


def _try_parse_timestamp(value: str) -> Optional[datetime]:
    """Attempt common ISO and date formats. Returns None on failure."""
    if not value or not str(value).strip():
        return None
    val = str(value).strip().replace("Z", "+00:00")
    formats = [
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S%z",
        "%Y-%m-%d",
        "%d/%m/%Y %H:%M:%S",
        "%m/%d/%Y %H:%M:%S",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(val, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except (ValueError, AttributeError):
            continue
    try:
        dt = datetime.fromisoformat(val)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        pass
    return None


class CSVParser(BaseParser):
    """Parses CSV evidence files into normalized, entity-rich investigation events."""

    @property
    def supported_extensions(self) -> List[str]:
        return [".csv"]

    def parse(self, file_path: str, original_filename: str) -> List[ParsedEvent]:
        events: List[ParsedEvent] = []
        try:
            with open(file_path, newline="", encoding="utf-8", errors="replace") as fh:
                reader = csv.DictReader(fh)
                headers = [h.strip() for h in (reader.fieldnames or []) if h]
                headers_lower = {h.lower(): h for h in headers}

                # Find timestamp column
                ts_col = next(
                    (headers_lower[h] for h in _TIMESTAMP_HINTS if h in headers_lower),
                    None,
                )

                for row_num, row in enumerate(reader, start=1):
                    if row_num > _MAX_ROWS:
                        logger.warning(
                            f"CSV parser: truncated at {_MAX_ROWS} rows for {original_filename}"
                        )
                        break

                    ts: Optional[datetime] = None
                    raw_ts: Optional[str] = None
                    if ts_col and row.get(ts_col):
                        raw_ts = str(row[ts_col]).strip()
                        ts = _try_parse_timestamp(raw_ts)

                    # Determine specific forensic classification
                    event_type = "structured_row"
                    entity_type = "row_index"
                    entity_val = str(row_num)

                    # 1. Financial check
                    txn_id = (
                        row.get("transaction_id") or row.get("txn_id") or row.get("trans_id") or
                        row.get("Transaction_ID") or row.get("Transaction ID")
                    )
                    amount = row.get("amount") or row.get("Amount") or row.get("total")

                    if txn_id:
                        event_type = "financial_transaction"
                        entity_type = "transaction_id"
                        entity_val = str(txn_id).strip()
                    # 2. Auth check
                    elif any(k in headers_lower for k in ("username", "user", "account_name", "user_id")):
                        u_key = next(headers_lower[k] for k in ("username", "user", "account_name", "user_id") if k in headers_lower)
                        if row.get(u_key):
                            event_type = "auth_event"
                            entity_type = "user_account"
                            entity_val = str(row[u_key]).strip()
                    # 3. Network check
                    elif any(k in headers_lower for k in ("src_ip", "source_ip", "dest_ip", "dst_ip", "ip_address")):
                        ip_key = next(headers_lower[k] for k in ("src_ip", "source_ip", "dest_ip", "dst_ip", "ip_address") if k in headers_lower)
                        if row.get(ip_key):
                            event_type = "network_connection"
                            entity_type = "ip_address"
                            entity_val = str(row[ip_key]).strip()
                    # 4. Communication check
                    elif any(k in headers_lower for k in ("phone", "caller", "callee", "phone_number")):
                        ph_key = next(headers_lower[k] for k in ("phone", "caller", "callee", "phone_number") if k in headers_lower)
                        if row.get(ph_key):
                            event_type = "communication"
                            entity_type = "phone_number"
                            entity_val = str(row[ph_key]).strip()

                    row_summary = ", ".join(f"{k}: {v}" for k, v in list(row.items())[:6] if v)
                    metadata_dict = dict(row)
                    metadata_dict["sourceRow"] = row_num
                    metadata_dict["original_filename"] = original_filename
                    metadata_dict["original_timestamp"] = raw_ts
                    metadata_dict["sourceText"] = f"{original_filename} [Row {row_num}] -> {row_summary}"

                    events.append(
                        ParsedEvent(
                            event_type=event_type,
                            source=f"{original_filename} (Row {row_num})",
                            timestamp=ts,
                            entity_type=entity_type,
                            entity_value=entity_val,
                            metadata=metadata_dict,
                        )
                    )

        except Exception as exc:
            logger.error(f"CSV parser failed on {original_filename}: {exc}", exc_info=True)

        return events
