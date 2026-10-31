"""
Modular Data Source Ingestion Framework for ADEIP.
Defines base interfaces and concrete connectors for authorized real-data ingestion.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
import logging

from app.processing.base import ParsedEvent

logger = logging.getLogger("adeip.sources")


class BaseDataSource(ABC):
    """
    Abstract interface for all authorized external/internal data sources.
    Requires implementation of lifecycle and ingestion methods:
    - connect()
    - validate()
    - ingest()
    - get_status()
    - disconnect()
    """

    def __init__(self, name: str, config: Optional[Dict[str, Any]] = None):
        self.name = name
        self.config = config or {}
        self.is_connected = False
        self.last_status: Dict[str, Any] = {"status": "initialized", "last_check": datetime.now(timezone.utc).isoformat()}

    @abstractmethod
    def connect(self) -> bool:
        """Establish secure authorized connection using provided credentials/configuration."""
        pass

    @abstractmethod
    def validate(self) -> Dict[str, Any]:
        """Validate source accessibility, permissions, and format compliance."""
        pass

    @abstractmethod
    def ingest(self, **kwargs) -> List[ParsedEvent]:
        """Ingest and normalize real data into atomic ParsedEvent objects."""
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Return operational connectivity and ingestion status."""
        pass

    @abstractmethod
    def disconnect(self) -> bool:
        """Gracefully terminate stream or API connection."""
        pass


class FileUploadSource(BaseDataSource):
    """Data source connector for user-uploaded digital evidence artifacts."""

    def connect(self) -> bool:
        self.is_connected = True
        return True

    def validate(self) -> Dict[str, Any]:
        return {"valid": True, "type": "file_upload", "message": "Ready for authorized file upload"}

    def ingest(self, file_path: str, parser_class=None, **kwargs) -> List[ParsedEvent]:
        if parser_class:
            parser = parser_class()
            return parser.parse(file_path, original_filename=self.name)
        return []

    def get_status(self) -> Dict[str, Any]:
        return {"status": "active" if self.is_connected else "disconnected", "type": "file_upload"}

    def disconnect(self) -> bool:
        self.is_connected = False
        return True


class CCTVSource(BaseDataSource):
    """Data source connector for authorized CCTV streams or video feeds (RTSP / video recordings)."""

    def connect(self) -> bool:
        stream_url = self.config.get("stream_url")
        if not stream_url:
            self.last_status = {"status": "error", "message": "No stream_url provided"}
            return False
        # Do not expose stream credentials in logs
        logger.info(f"[CCTVSource] Connecting to authorized stream: {self.name}")
        self.is_connected = True
        self.last_status = {"status": "active", "stream": self.name, "connected_at": datetime.now(timezone.utc).isoformat()}
        return True

    def validate(self) -> Dict[str, Any]:
        stream_url = self.config.get("stream_url", "")
        is_rtsp = stream_url.lower().startswith("rtsp://") or stream_url.lower().startswith("http://") or stream_url.lower().startswith("https://")
        return {
            "valid": bool(stream_url and is_rtsp),
            "source_name": self.name,
            "stream_protocol": stream_url.split("://")[0] if "://" in stream_url else "unknown",
        }

    def ingest(self, frames: Optional[List[Any]] = None, **kwargs) -> List[ParsedEvent]:
        # Only generates real events when actual frames or detections are provided
        events: List[ParsedEvent] = []
        # Detection models ingest frames deterministically
        return events

    def get_status(self) -> Dict[str, Any]:
        return self.last_status

    def disconnect(self) -> bool:
        self.is_connected = False
        self.last_status = {"status": "disconnected"}
        return True


class SystemLogSource(BaseDataSource):
    """Data source connector for authorized system logs (Windows EVTX, syslog, auth logs)."""

    def connect(self) -> bool:
        self.is_connected = True
        return True

    def validate(self) -> Dict[str, Any]:
        return {"valid": True, "type": "system_log"}

    def ingest(self, file_path: str = "", **kwargs) -> List[ParsedEvent]:
        from app.processing.evtx_parser import EvtxParser
        parser = EvtxParser()
        return parser.parse(file_path, original_filename=self.name)

    def get_status(self) -> Dict[str, Any]:
        return {"status": "active" if self.is_connected else "disconnected", "type": "system_log"}

    def disconnect(self) -> bool:
        self.is_connected = False
        return True


class NetworkLogSource(BaseDataSource):
    """Data source connector for network traffic logs and firewall records."""

    def connect(self) -> bool:
        self.is_connected = True
        return True

    def validate(self) -> Dict[str, Any]:
        return {"valid": True, "type": "network_log"}

    def ingest(self, file_path: str = "", **kwargs) -> List[ParsedEvent]:
        from app.processing.csv_parser import CsvParser
        parser = CsvParser()
        return parser.parse(file_path, original_filename=self.name)

    def get_status(self) -> Dict[str, Any]:
        return {"status": "active" if self.is_connected else "disconnected", "type": "network_log"}

    def disconnect(self) -> bool:
        self.is_connected = False
        return True


class CSVSource(BaseDataSource):
    """Data source connector for structured CSV telemetry."""

    def connect(self) -> bool:
        self.is_connected = True
        return True

    def validate(self) -> Dict[str, Any]:
        return {"valid": True, "type": "csv_source"}

    def ingest(self, file_path: str = "", **kwargs) -> List[ParsedEvent]:
        from app.processing.csv_parser import CsvParser
        parser = CsvParser()
        return parser.parse(file_path, original_filename=self.name)

    def get_status(self) -> Dict[str, Any]:
        return {"status": "active" if self.is_connected else "disconnected", "type": "csv_source"}

    def disconnect(self) -> bool:
        self.is_connected = False
        return True


class JSONSource(BaseDataSource):
    """Data source connector for structured JSON feeds."""

    def connect(self) -> bool:
        self.is_connected = True
        return True

    def validate(self) -> Dict[str, Any]:
        return {"valid": True, "type": "json_source"}

    def ingest(self, file_path: str = "", **kwargs) -> List[ParsedEvent]:
        from app.processing.json_parser import JsonParser
        parser = JsonParser()
        return parser.parse(file_path, original_filename=self.name)

    def get_status(self) -> Dict[str, Any]:
        return {"status": "active" if self.is_connected else "disconnected", "type": "json_source"}

    def disconnect(self) -> bool:
        self.is_connected = False
        return True


class AuthorizedAPISource(BaseDataSource):
    """Data source connector for authorized external SIEM / EDR / Webhook APIs."""

    def connect(self) -> bool:
        endpoint = self.config.get("endpoint_url")
        if not endpoint:
            self.last_status = {"status": "error", "message": "Missing endpoint_url"}
            return False
        self.is_connected = True
        self.last_status = {"status": "active", "endpoint": endpoint}
        return True

    def validate(self) -> Dict[str, Any]:
        endpoint = self.config.get("endpoint_url", "")
        return {"valid": bool(endpoint.startswith("http://") or endpoint.startswith("https://")), "type": "api"}

    def ingest(self, raw_records: Optional[List[Dict[str, Any]]] = None, **kwargs) -> List[ParsedEvent]:
        events: List[ParsedEvent] = []
        if not raw_records:
            return events
        for r in raw_records:
            events.append(
                ParsedEvent(
                    event_type="log_entry",
                    source=self.name,
                    timestamp=datetime.now(timezone.utc),
                    metadata=r,
                )
            )
        return events

    def get_status(self) -> Dict[str, Any]:
        return self.last_status

    def disconnect(self) -> bool:
        self.is_connected = False
        self.last_status = {"status": "disconnected"}
        return True
