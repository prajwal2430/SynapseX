"""
Media Evidence Parser (Images and Video).

Strategy:
  - Do NOT perform any AI analysis or fake content detection.
  - Register the artifact as MEDIA_REGISTERED with file-level metadata only.
  - Leave a clear marker so future vision/AI agents can pick these up.

Supported extensions: .jpg, .jpeg, .png, .mp4, .pdf
"""
import os
import logging
from typing import List

from app.processing.base import BaseParser, ParsedEvent

logger = logging.getLogger("adeip.parser.media")


class MediaParser(BaseParser):
    """
    Registration-only parser for image, video, and PDF evidence.

    Produces exactly one MEDIA_REGISTERED event per artifact containing
    safe file-level metadata (name, size, extension).
    AI content analysis is NOT performed here.
    """

    @property
    def supported_extensions(self) -> List[str]:
        return [".jpg", ".jpeg", ".png", ".mp4", ".pdf"]

    def parse(self, file_path: str, original_filename: str) -> List[ParsedEvent]:
        events: List[ParsedEvent] = []
        try:
            ext = os.path.splitext(original_filename)[1].lower()
            file_size = os.path.getsize(file_path)

            events.append(ParsedEvent(
                event_type="media_registered",
                source=original_filename,
                timestamp=None,
                entity_type="media_type",
                entity_value=ext.lstrip("."),
                metadata={
                    "original_filename": original_filename,
                    "extension": ext,
                    "file_size_bytes": file_size,
                    "analysis_status": "pending_future_processing",
                    "note": (
                        "Media content registered for future AI vision analysis. "
                        "No content inspection has been performed at this stage."
                    ),
                },
            ))
            logger.info(
                f"Media parser: registered {original_filename} ({file_size} bytes) "
                "for future analysis."
            )

        except Exception as exc:
            logger.error(f"Media parser failed on {original_filename}: {exc}", exc_info=True)

        return events
