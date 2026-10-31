# SynapseX Migration Guide

This guide details the phased migration from the monolithic prototype codebase (`backend/` and `frontend/`) to the production multi-service architecture (`client/`, `api/`, `ai-service/`, and `infrastructure/`).

---

## 1. Architecture Comparison

| Aspect | Legacy Prototype | New Production Architecture |
| :--- | :--- | :--- |
| **Repository Structure** | Split `frontend/` + `backend/` | Monorepo: `client/`, `api/`, `ai-service/`, `infrastructure/` |
| **Primary Backend** | Python FastAPI monolith | NestJS (TypeScript) + Mongoose |
| **AI Processing** | Embedded in Python monolith | Dedicated Python FastAPI + LangGraph microservice |
| **Primary Database** | Mixed SQLite / SQLAlchemy | MongoDB 7.0 via Mongoose |
| **Task Queue** | Celery + Redis | BullMQ + Redis in NestJS |
| **Object Storage** | Local filesystem (`uploads/`) | MinIO S3-compatible object storage |
| **WebSockets** | Raw FastAPI WebSockets | Socket.IO with room multiplexing |
| **Knowledge Graph** | Direct Neo4j from monolith | Encapsulated inside `ai-service/` |

---

## 2. Step-by-Step Migration Phases

### Phase 1: Infrastructure & Data Stores
1. Launch the local services:
   ```bash
   cd infrastructure
   docker compose up -d mongodb redis neo4j minio minio-init
   ```
2. Verify all datastores are healthy via their ports (MongoDB `27017`, Redis `6379`, Neo4j `7474`, MinIO `9001`).

### Phase 2: Client Migration (`client/`)
1. The existing React + Vite frontend has been copied into `client/`.
2. Configure `.env`:
   ```bash
   VITE_API_BASE_URL=http://localhost:3001/api
   VITE_WS_BASE_URL=http://localhost:3001
   ```
3. Update `src/services/api.js` to replace any hardcoded URLs with `import.meta.env.VITE_API_BASE_URL`.
4. Replace raw `new WebSocket(...)` in `src/services/api.js` with `socket.io-client`.

### Phase 3: AI Service Migration (`ai-service/`)
1. Agents from `backend/app/agents/` and parsers from `backend/app/processing/` have been migrated into `ai-service/app/`.
2. Clean up dependencies:
   - Remove SQLAlchemy and Celery references from agent state.
   - Update agent graph to use Pydantic models from `app/schemas/analysis.py`.
3. Verify the AI service runs independently:
   ```bash
   cd ai-service
   uvicorn app.main:app --port 8000
   ```

### Phase 4: NestJS API Domain Implementation (`api/`)
Implement domain modules inside `api/src/modules/` in the following sequence:
1. **`auth`**: Implement User schema, JWT strategy, login/register controllers.
2. **`cases`**: Implement Case schema, CRUD endpoints, investigator assignments.
3. **`evidence`**: Implement Evidence schema, MinIO file upload stream, hash calculations.
4. **`chain-of-custody`**: Log all evidence events to immutable collection.
5. **`intelligence`**: Implement BullMQ processor that calls `ai-service` endpoint `POST /api/v1/analysis/run`.
6. **`reports`**: Implement report generation queue and PDF storage.

---

## 3. Deprecation & Cleanup Checklist

- [ ] Remove `celery` worker processes once BullMQ queues are active.
- [ ] Decommission SQLite database (`adeip.db`).
- [ ] Migrate local disk uploads (`backend/uploads/`) to MinIO bucket `synapsex-evidence`.
- [ ] Archive legacy `backend/` and `frontend/` directories once all features are validated in `client/`, `api/`, and `ai-service/`.
