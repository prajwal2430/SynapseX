"""
Evidence parser package for ADEIP.

Each module in this package is responsible for one evidence type.
All parsers implement the same interface: parse(evidence, db) -> List[dict]

Returned dicts are validated and written to investigation_events by the
ProcessingService orchestrator — parsers never touch the DB directly.
"""
from app.processing.base import BaseParser, ParsedEvent
from app.processing.csv_parser import CSVParser
from app.processing.json_parser import JSONParser
from app.processing.txt_parser import TXTParser
from app.processing.evtx_parser import EVTXParser
from app.processing.media_parser import MediaParser

__all__ = [
    "BaseParser",
    "ParsedEvent",
    "CSVParser",
    "JSONParser",
    "TXTParser",
    "EVTXParser",
    "MediaParser",
]
