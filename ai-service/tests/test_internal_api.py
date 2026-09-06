"""
Comprehensive Test Suite for SynapseX AI Service Internal Endpoints.
Tests:
- Internal Service Authentication (401 on missing/invalid, 200 on valid)
- POST /internal/analyze/evidence (Deterministic entity recognition & counts)
- POST /internal/analyze/timeline (UTC sequencing & temporal clustering)
- POST /internal/analyze/correlation (Multi-signal correlation with disclaimers)
- POST /internal/investigate (Full LangGraph multi-agent workflow)
- GET /internal/health and GET /health
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings

client = TestClient(app)
AUTH_HEADERS = {"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY}


# ==============================================================================
# 1. Internal Service Authentication Tests
# ==============================================================================

def test_unauthorized_without_credentials():
    """Requests to internal endpoints without credentials must be rejected with 401."""
    response = client.post(
        "/internal/analyze/evidence",
        json={"case_id": "1", "evidence_id": "1", "file_name": "dump.raw"},
    )
    assert response.status_code == 401
    assert "error" in response.json()
    assert response.json()["error"]["code"] == 401


def test_unauthorized_with_invalid_credentials():
    """Requests with wrong key must be rejected with 401."""
    response = client.post(
        "/internal/analyze/evidence",
        headers={"X-Internal-Service-Key": "invalid-secret-key"},
        json={"case_id": "1", "evidence_id": "1", "file_name": "dump.raw"},
    )
    assert response.status_code == 401


def test_authorized_with_bearer_token():
    """Requests with valid Authorization: Bearer token must succeed."""
    response = client.get(
        "/internal/health",
        headers={"Authorization": f"Bearer {settings.INTERNAL_SERVICE_KEY}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


# ==============================================================================
# 2. POST /internal/analyze/evidence Tests
# ==============================================================================

def test_analyze_evidence_entity_extraction():
    """Tests deterministic entity extraction from evidence metadata and content."""
    payload = {
        "case_id": "101",
        "evidence_id": "501",
        "file_name": "network_triage.log",
        "mime_type": "text/plain",
        "content_text": (
            "Suspicious connection from IP 192.168.1.105 by user alex.mercer@synapsex.local "
            "to host WKSTN-892. Observed SHA256 e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 "
            "and connected device USBSTOR\\DISK&VEN_SANDISK"
        ),
        "metadata": {
            "source": "Endpoint Sensor",
            "hostname": "WKSTN-892",
            "ip_address": "10.0.0.50",
            "user": "alex.mercer",
        },
        "raw_events": [
            {
                "event_id": 1,
                "event_type": "logon",
                "description": "Logon by user alex.mercer from 192.168.1.105",
                "ip": "192.168.1.105",
                "user": "alex.mercer",
            }
        ],
    }

    response = client.post("/internal/analyze/evidence", headers=AUTH_HEADERS, json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["case_id"] == "101"
    assert data["evidence_id"] == "501"
    assert data["total_entities"] > 0
    assert "entity_counts" in data

    extracted_types = {e["entity_type"] for e in data["entities"]}
    assert "ip_address" in extracted_types
    assert "user_account" in extracted_types
    assert "device" in extracted_types


# ==============================================================================
# 3. POST /internal/analyze/timeline Tests
# ==============================================================================

def test_analyze_timeline_sequencing_and_clustering():
    """Tests timeline event sequencing, UTC normalization, and window clustering."""
    payload = {
        "case_id": "101",
        "events": [
            {
                "event_id": 2,
                "timestamp": "2026-09-06T01:05:00Z",
                "event_type": "file_access",
                "description": "Target NVMe image file opened",
                "source": "syslog",
            },
            {
                "event_id": 1,
                "timestamp": "2026-09-06T01:00:00Z",
                "event_type": "user_logon",
                "description": "Investigator logged into workstation",
                "source": "auth.log",
            },
            {
                "event_id": 3,
                "timestamp": "2026-09-06T02:00:00Z",
                "event_type": "data_export",
                "description": "Forensic timeline generated",
                "source": "audit",
            },
        ],
        "window_seconds": 3600,
    }

    response = client.post("/internal/analyze/timeline", headers=AUTH_HEADERS, json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["case_id"] == "101"
    assert data["total_events"] == 3

    # Verify chronological ordering
    timeline = data["timeline"]
    assert timeline[0]["event_id"] == 1
    assert timeline[1]["event_id"] == 2
    assert timeline[2]["event_id"] == 3

    # Verify temporal clustering
    assert len(data["clusters"]) >= 1
    assert "temporal_range" in data


# ==============================================================================
# 4. POST /internal/analyze/correlation Tests
# ==============================================================================

def test_analyze_correlation_multi_signal():
    """Tests explainable correlation engine across shared entities and events."""
    payload = {
        "case_id": "101",
        "extracted_entities": [
            {
                "entity_type": "ip_address",
                "entity_value": "192.168.1.100",
                "normalized_value": "192.168.1.100",
                "evidence_id": 501,
                "event_id": 1,
            },
            {
                "entity_type": "ip_address",
                "entity_value": "192.168.1.100",
                "normalized_value": "192.168.1.100",
                "evidence_id": 502,
                "event_id": 2,
            },
            {
                "entity_type": "device",
                "entity_value": "WKSTN-892",
                "normalized_value": "WKSTN-892",
                "evidence_id": 501,
                "event_id": 1,
            },
            {
                "entity_type": "device",
                "entity_value": "WKSTN-892",
                "normalized_value": "WKSTN-892",
                "evidence_id": 502,
                "event_id": 2,
            },
        ],
        "timeline": [
            {
                "event_id": 1,
                "evidence_id": 501,
                "timestamp": "2026-09-06T01:00:00Z",
                "event_type": "logon",
                "description": "Logon on WKSTN-892 from 192.168.1.100",
            },
            {
                "event_id": 2,
                "evidence_id": 502,
                "timestamp": "2026-09-06T01:02:00Z",
                "event_type": "network_connection",
                "description": "Connection to WKSTN-892 from 192.168.1.100",
            },
        ],
        "raw_events": [],
    }

    response = client.post("/internal/analyze/correlation", headers=AUTH_HEADERS, json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["case_id"] == "101"
    assert data["total_correlations"] > 0
    assert "disclaimer" in data
    assert "Potential relationship detected" in data["disclaimer"]

    # Check that correlation signals reference supporting evidence
    first_corr = data["correlations"][0]
    assert "correlation_id" in first_corr
    assert "signal_type" in first_corr
    assert "correlation_score" in first_corr


# ==============================================================================
# 5. POST /internal/investigate Tests (Full LangGraph Workflow)
# ==============================================================================

def test_investigate_full_workflow():
    """Tests complete LangGraph multi-agent execution pipeline."""
    payload = {
        "case_id": "101",
        "case_info": {
            "title": "Suspected Credential Harvesting & Exfiltration",
            "description": "Unauthorized access from unknown endpoint detected.",
            "priority": "high",
        },
        "evidence_items": [
            {
                "id": 501,
                "original_filename": "triage_memory.raw",
                "mime_type": "application/octet-stream",
                "metadata": {
                    "source": "Workstation RAM",
                    "hostname": "WKSTN-892",
                    "user": "alex.mercer",
                },
            }
        ],
        "raw_events": [
            {
                "event_id": 1,
                "evidence_id": 501,
                "timestamp": "2026-09-06T01:00:00Z",
                "event_type": "login",
                "description": "Logon by user alex.mercer from 192.168.1.105",
                "ip": "192.168.1.105",
                "user": "alex.mercer",
            },
            {
                "event_id": 2,
                "evidence_id": 501,
                "timestamp": "2026-09-06T01:04:00Z",
                "event_type": "usb_mount",
                "description": "Mounted USB device SanDisk Extreme",
                "usb": "USBSTOR\\DISK&VEN_SANDISK",
            },
        ],
    }

    response = client.post("/internal/investigate", headers=AUTH_HEADERS, json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["case_id"] == "101"
    assert data["status"] in ("in_progress", "completed", "degraded")
    assert len(data["extracted_entities"]) > 0
    assert len(data["timeline"]) == 2
    assert "graph" in data
    assert "nodes" in data["graph"]
    assert "edges" in data["graph"]
    assert len(data["findings"]) > 0
    assert len(data["recommendations"]) > 0
    assert len(data["agent_logs"]) >= 6


# ==============================================================================
# 6. Health Check Tests
# ==============================================================================

def test_internal_health():
    """GET /internal/health returns 200 with service diagnostic info."""
    response = client.get("/internal/health", headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "dependencies" in data


def test_public_health():
    """GET /health returns 200 without authentication."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
