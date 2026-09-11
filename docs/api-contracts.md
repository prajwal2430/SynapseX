# SynapseX Inter-Service API & Event Contracts

This document defines the formal communication specifications between the **NestJS Main API** (`api/`), the **Python AI Service** (`ai-service/`), the **Background Job Queues** (BullMQ), and the **Real-Time Client** (Socket.IO).

---

## 1. Service-to-Service REST Contracts (NestJS ➔ AI Service)

All requests from NestJS to the AI Service include the header:
```http
X-Internal-Service-Key: <AI_SERVICE_API_KEY>
Content-Type: application/json
```

### 1.1 Trigger Analysis Workflow
- **Endpoint**: `POST /api/v1/analysis/run`
- **Request Body**:
```json
{
  "case_id": "6649cbb3-f0eb-4de6-9452-1ee141eb2869",
  "agent_name": null,
  "evidence_ids": ["ev_001", "ev_002"],
  "parameters": {
    "deep_correlation": true,
    "confidence_threshold": 0.75
  }
}
```
- **Response** (`202 Accepted`):
```json
{
  "run_id": "c1f7a08b-1e24-4f0e-b615-58e11a123456",
  "case_id": "6649cbb3-f0eb-4de6-9452-1ee141eb2869",
  "status": "accepted",
  "message": "Investigation workflow queued for case 6649cbb3-f0eb-4de6-9452-1ee141eb2869",
  "findings_count": 0,
  "anomalies_detected": 0,
  "duration_ms": 1.2
}
```

### 1.2 Query Knowledge Graph
- **Endpoint**: `POST /api/v1/graph/query`
- **Request Body**:
```json
{
  "case_id": "6649cbb3-f0eb-4de6-9452-1ee141eb2869",
  "cypher_query": null,
  "limit": 100
}
```
- **Response** (`200 OK`):
```json
{
  "nodes": [
    { "id": "192.168.1.100", "label": "IPAddress", "properties": { "type": "internal" } }
  ],
  "relationships": [
    { "source": "192.168.1.100", "target": "user_admin", "type": "AUTHENTICATED_AS" }
  ],
  "total_nodes": 1,
  "total_relationships": 1
}
```

---

## 2. BullMQ Job Contracts

### 2.1 Queues List

| Queue Name | Job Name | Producer | Consumer | Payload Contract |
| :--- | :--- | :--- | :--- | :--- |
| `evidence-ingestion` | `evidence.process` | `EvidenceController` | `EvidenceWorker` | `{ evidenceId: string, minioKey: string, fileType: string }` |
| `ai-pipeline-execution` | `ai.execute_agents` | `IntelligenceController` | `AiWorker` | `{ caseId: string, evidenceIds: string[], trigger: string }` |
| `report-generation` | `report.build` | `ReportsController` | `ReportsWorker` | `{ caseId: string, reportFormat: "PDF" \| "JSON" }` |
| `notifications` | `notification.send` | System Events | `NotificationWorker` | `{ recipientId: string, title: string, body: string }` |

---

## 3. Real-Time Socket.IO Channels

### 3.1 Client ➔ Server

- `join_case`: Join specific investigation room. Payload: `{ "caseId": "..." }`
- `leave_case`: Leave room. Payload: `{ "caseId": "..." }`

### 3.2 Server ➔ Client (Broadcast)

- `evidence:processed`: Notifies evidence file parsing completion.
- `ai:step_completed`: Emits progress as each LangGraph agent completes its analysis.
- `ai:finding_added`: Emits a newly synthesized finding or correlation alert.
- `timeline:event_added`: Emits newly discovered chronological events.
- `case:status_changed`: Broadcasts case state change to all participating investigators.
