"""
TXT Evidence Parser.

Strategy:
  - Split file into individual lines.
  - Each non-empty line → one LOG_ENTRY event with the line as metadata.
  - Store total line count and character count as file-level metadata in the first event.
  - Cap at 10,000 lines.
"""
import logging
from typing import List

from app.processing.base import BaseParser, ParsedEvent

logger = logging.getLogger("adeip.parser.txt")

_MAX_LINES = 10_000


class TXTParser(BaseParser):
    """
    Parses plain-text evidence files.
    Preserves each line as a searchable LOG_ENTRY investigation event.
    """

    @property
    def supported_extensions(self) -> List[str]:
        return [".txt"]

    def parse(self, file_path: str, original_filename: str) -> List[ParsedEvent]:
        events: List[ParsedEvent] = []
        try:
            with open(file_path, encoding="utf-8", errors="replace") as fh:
                lines = fh.readlines()

            total_lines = len(lines)
            total_chars = sum(len(l) for l in lines)
            truncated = total_lines > _MAX_LINES

            if truncated:
                logger.warning(
                    f"TXT parser: truncated at {_MAX_LINES} lines for {original_filename} "
                    f"(total: {total_lines})"
                )

            for line_num, line in enumerate(lines[:_MAX_LINES], start=1):
                stripped = line.rstrip("\n\r")
                if not stripped:
                    continue
                events.append(ParsedEvent(
                    event_type="log_entry",
                    source=original_filename,
                    timestamp=None,
                    entity_type="line_number",
                    entity_value=str(line_num),
                    metadata={
                        "line": stripped,
                        "total_lines": total_lines,
                        "total_chars": total_chars,
                        "truncated": truncated,
                    },
                ))

        except Exception as exc:
            logger.error(f"TXT parser failed on {original_filename}: {exc}", exc_info=True)

        return events
