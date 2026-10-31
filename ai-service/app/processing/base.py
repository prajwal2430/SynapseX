"""
Base parser interface all evidence parsers must implement.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class ParsedEvent:
    """
    Intermediate normalized event produced by a parser.
    ProcessingService maps these to InvestigationEvent rows.
    """
    event_type: str           # Must match an EventType enum value
    source: Optional[str] = None
    timestamp: Optional[datetime] = None
    entity_type: Optional[str] = None
    entity_value: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class BaseParser(ABC):
    """
    Contract all evidence parsers must satisfy.

    Parsers are stateless — instantiated fresh per processing call.
    They receive a file path and return ParsedEvent objects.
    They must never:
      - Modify the source file
      - Commit to the database
      - Raise uncaught exceptions (catch internally and return partial results)
    """

    @abstractmethod
    def parse(self, file_path: str, original_filename: str) -> List[ParsedEvent]:
        """
        Read and parse the evidence file at file_path.
        Return a list of ParsedEvent objects (may be empty on failure).
        """
        ...

    @property
    @abstractmethod
    def supported_extensions(self) -> List[str]:
        """File extensions this parser handles, e.g. ['.csv']"""
        ...
