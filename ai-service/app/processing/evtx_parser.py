"""
EVTX Evidence Parser — Placeholder interface.

Windows Event Log (.evtx) parsing requires the `python-evtx` library
(or `evtx` Rust-based bindings). This placeholder:

  1. Detects the EVTX magic bytes to confirm the file is a real EVTX file.
  2. Records one WINDOWS_EVENT event as a capability placeholder.
  3. Logs a clear message indicating the full parser is not yet configured.

To activate full parsing, install a compatible library and replace the
_parse_with_library() stub below.

Supported library options (choose one):
  - pip install python-evtx        (pure Python, slower)
  - pip install evtx               (Rust-backed, faster)
"""
import logging
from typing import List

from app.processing.base import BaseParser, ParsedEvent

logger = logging.getLogger("adeip.parser.evtx")

# EVTX files start with this magic bytes signature
_EVTX_MAGIC = b"ElfFile\x00"


def _is_valid_evtx(file_path: str) -> bool:
    try:
        with open(file_path, "rb") as fh:
            return fh.read(8) == _EVTX_MAGIC
    except Exception:
        return False


class EVTXParser(BaseParser):
    """
    Placeholder EVTX parser.

    Currently validates magic bytes and registers the file for future
    Windows Event Log parsing. Produces one placeholder WINDOWS_EVENT event
    carrying file-level metadata.

    When a full library is integrated, replace the body of parse() with
    a call to _parse_with_library().
    """

    @property
    def supported_extensions(self) -> List[str]:
        return [".evtx"]

    def parse(self, file_path: str, original_filename: str) -> List[ParsedEvent]:
        events: List[ParsedEvent] = []
        try:
            valid = _is_valid_evtx(file_path)
            status = "valid_evtx_signature" if valid else "unknown_signature"
            logger.info(
                f"EVTX parser: placeholder active for {original_filename} "
                f"(signature check: {status}). "
                "Full Windows Event Log parsing requires python-evtx or evtx library."
            )

            events.append(ParsedEvent(
                event_type="windows_event",
                source=original_filename,
                timestamp=None,
                entity_type="parser_status",
                entity_value="placeholder",
                metadata={
                    "parser": "evtx_placeholder",
                    "signature_valid": valid,
                    "note": (
                        "Full EVTX parsing is not yet configured. "
                        "Install python-evtx or evtx and implement _parse_with_library()."
                    ),
                },
            ))

        except Exception as exc:
            logger.error(f"EVTX parser failed on {original_filename}: {exc}", exc_info=True)

        return events

    @staticmethod
    def _parse_with_library(file_path: str, original_filename: str) -> List[ParsedEvent]:
        """
        Stub for future full EVTX parsing implementation.

        Example with python-evtx:
            import Evtx.Evtx as evtx
            with evtx.Evtx(file_path) as log:
                for record in log.records():
                    xml = record.xml()
                    # parse XML → ParsedEvent(event_type="windows_event", ...)
        """
        raise NotImplementedError(
            "Full EVTX parsing is not yet implemented. "
            "Install python-evtx or evtx and implement this method."
        )
