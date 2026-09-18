# SynapseX Comprehensive Architecture & Migration Audit Report

**Document Status:** Complete & Verified  
**Audit Scope:** Full Root Monorepo (`ai-service/`, `api/`, `backend/`, `client/`, `frontend/`, `docs/`, `infrastructure/`, and Root Configs)  
**Author:** Senior Software Architect  
**Target Architecture:** Clean 3-Service Architecture (`client/` React 19 Frontend + `api/` NestJS Gateway + `ai-service/` FastAPI LangGraph Microservice)

---

## 1. Executive Summary & Current Architecture

SynapseX (Autonomous Digital Evidence Intelligence Platform - ADEIP) is in the midst of an architectural evolution from an initial Python FastAPI monolithic prototype (`backend/` + `frontend/`) toward a decoupled, enterprise-grade 3-service architecture:

```
Target Architecture:
SynapseX/
├── client/                 # React 19 + Vite Frontend (Port 5173)
├── api/                    # Node.js + NestJS Main Backend Gateway (Port 3001)
├── ai-service/             # Python + FastAPI + LangGraph AI Microservice (Port 8001)
├── infrastructure/         # Docker Compose (MongoDB, Redis, Neo4j, MinIO)
└── docs/                   # Architectural & System Documentation
```

### Reality of the Current Workspace
Currently, both legacy and target services coexist within the root folder:
- Two frontends exist: `frontend/` (legacy) and `client/` (target).
- Two backends exist: `backend/` (legacy Python FastAPI) and `api/` (target NestJS).
- AI agent logic and forensic parsers exist in two places: `backend/` and `ai-service/`.
- Dual database models exist: SQLAlchemy (PostgreSQL + SQLite fallback) in `backend/` and Mongoose (MongoDB) in `api/`.
- Startup scripts (`start.bat`) previously launched 5 separate processes simultaneously.

---

## 2. Folder Purpose & Technology Stack Audit

| Folder / Path | Primary Technology | Purpose & Source Code Inspection | Status / Role |
| :--- | :--- | :--- | :--- |
| **`ai-service/`** | Python 3.11+, FastAPI, LangGraph, LangChain Core, Neo4j Driver, Motor/Pymongo, Redis | Dedicated AI analytical microservice. Implements an 8-node sequential LangGraph `StateGraph`, forensic parsers (EVTX, CSV, JSON, TXT, Media), and internal analytical endpoints (`/internal/analyze/*`, `/internal/investigate`). Listens on port 8001. | **Target Service (Active Target)** |
| **`api/`** | Node.js (TypeScript 5.6), NestJS 10, `@nestjs/mongoose`, BullMQ, MinIO S3 SDK, Neo4j Driver, Socket.IO, Passport JWT | Production-grade backend gateway. Encapsulates 14 enterprise domain modules: `auth`, `users`, `cases`, `evidence`, `custody`, `audit`, `jobs`, `entities`, `timeline`, `findings`, `graph`, `realtime`, `ai-client`, and `health`. Listens on port 3001. | **Target Service (Active Target)** |
| **`backend/`** | Python 3.11+, FastAPI, SQLAlchemy 2, Alembic, psycopg2, Motor, Celery, Redis, LangGraph, Neo4j | Monolithic prototype backend ("ADEIP"). Contains 20 route modules, 15 SQLAlchemy models, 17 service files (~200 KB logic), Celery tasks, and duplicate agent/parser code. Connected to SQLite fallback `backend/adeip.db`. Listens on port 8000. | **Legacy Monolith (To Deprecate)** |
| **`client/`** | React 19.2.8, Vite 8.2.0, React Router DOM 7.18.2, Lucide React, Vanilla CSS | Designated production frontend (`"synapsex-client"` v1.0.0). Contains 15 investigation views in `src/pages/`. Currently lacks `node_modules/` and `package-lock.json`. Configured for port 5173. | **Target Frontend (To Activate)** |
| **`frontend/`** | React 19.2.8, Vite 8.2.0, React Router DOM 7.18.2, Lucide React, Vanilla CSS | Legacy frontend (`"adeip-frontend"` v0.0.0). Source code is 100% byte-for-byte identical to `client/src/`. Has populated `node_modules/` and built `dist/`. Was actively invoked by `start.bat`. | **Legacy Frontend (To Retire)** |
| **`infrastructure/`** | Docker, Docker Compose | Orchestrates local containerized services: MongoDB 7.0 (27017), Redis 7 (6379), Neo4j 5.20 (7474/7687), MinIO S3 (9000/9001), and MinIO initialization provisioner (`minio-init`). | **Target Infrastructure (Keep)** |
| **`docs/`** | Markdown documentation | Architecture specs (`architecture.md`), API contracts (`api-contracts.md`), migration guides, and system overview. | **Documentation (Keep)** |

---

## 3. Detailed Inspection of Root-Level Files

### 1. `adeip.db` (Root) vs. `backend/adeip.db`
- **Root `adeip.db` (0 bytes):**
  - An empty, zero-byte file created when an SQLite connection was touched without write operations or from a process running from the repository root. Contains zero tables and zero data.
- **`backend/adeip.db` (405,504 bytes / 396 KB):**
  - **Actively used** by `backend/app/database/session.py`.
  - In `backend/app/database/session.py`, the engine is initialized with `DATABASE_URL` (PostgreSQL). When PostgreSQL connection fails, it falls back to `sqlite:///./adeip.db`.
  - Direct schema inspection confirms 14 populated tables:
    `users`, `audit_events`, `investigation_cases`, `analysis_jobs`, `investigation_correlations`, `data_sources`, `evidence`, `investigation_findings`, `investigation_recommendations`, `investigation_reports`, `chain_of_custody`, `investigation_events`, `processing_jobs`, `extracted_entities`.
  - Seeded with default lead investigator `analyst@adeip.local`.

### 2. `package-lock.json` (Root)
- Size: 87 bytes.
- Contents:
  ```json
  {
    "name": "SynapseX",
    "lockfileVersion": 3,
    "requires": true,
    "packages": {}
  }
  ```
- **Finding:** A placeholder lockfile created by an accidental `npm init` or `npm install` at root. The root directory is not an NPM package. It has no dependencies and no package.json.

### 3. `.pyrefly.json` & `pyrightconfig.json` (Root)
- **`.pyrefly.json`:**
  ```json
  {
    "extraPaths": [
      "backend",
      "C:/Users/prajw/AppData/Roaming/Python/Python314/site-packages",
      "C:/Python314/Lib/site-packages"
    ]
  }
  ```
- **`pyrightconfig.json`:**
  ```json
  {
    "include": ["backend"],
    "extraPaths": ["backend", "backend/venv/Lib/site-packages"]
  }
  ```
- **Finding:** Both IDE language server configs are hardcoded to treat `backend` as the primary Python package. In the target architecture, these must be redirected to `ai-service`.

### 4. `start.bat`
- Originally launched 5 processes:
  1. `infrastructure` (Docker Compose for MongoDB, Redis, Neo4j, MinIO)
  2. `backend` (FastAPI on Port 8000)
  3. `api` (NestJS on Port 3001)
  4. `ai-service` (FastAPI on Port 8001)
  5. `frontend` (React + Vite on Port 5173, pointing to `frontend/`)
- Launches all backends and points to the legacy frontend instead of `client/`.

### 5. `.env.example`
- Accurately outlines the target architecture:
  - Section 1: Client (`client/.env`)
  - Section 2: Main API (`api/.env`)
  - Section 3: AI Service (`ai-service/.env`)
  - Section 4: Infrastructure Ports

---

## 4. Duplicate / Overlapping Functionality Analysis

### A. Frontend: `client/` vs. `frontend/`
- **Diff Analysis:** Executed `git diff --no-index client/src frontend/src`.
  - **Result: 0 differences.** The source code in `client/src` is 100% identical to `frontend/src`.
- **Package Differences:**
  - `frontend/package.json`: `"name": "adeip-frontend"`, `"version": "0.0.0"`. Has `node_modules` (installed) and `dist/` (built).
  - `client/package.json`: `"name": "synapsex-client"`, `"version": "1.0.0"`. Identical dependencies (`react@^19.2.8`, `lucide-react@^1.33.0`, `react-router-dom@^7.18.2`), but uninstalled (`node_modules` missing).

### B. AI Agents: `backend/app/agents/` vs. `ai-service/app/agents/`
- Both directories contain 10 agent files implementing the LangGraph multi-agent flow.
- Code diff inspection reveals that `ai-service/app/agents/` is an **improved, bugfixed superset**:
  1. `evidence_agent.py`: `ai-service` introduces `scan_dict_and_text` which recursively scans metadata dictionaries and plain text payloads without duplicate regex overhead, and supports fallback event ID fields (`id` or `event_id`).
  2. `timeline_agent.py`: `ai-service` adds dynamic `window_seconds` parameter support, properly serializes ISO timestamps inside event clusters (`timestamp_utc.isoformat()`), and exposes alias `timeline_clusters`.
  3. `__init__.py`: `ai-service` exports `timeline_agent`; `backend` omitted it.

### C. Forensic Parsers: `backend/app/processing/` vs. `ai-service/app/processing/`
- Both directories contain parsers: `csv_parser.py`, `evtx_parser.py`, `json_parser.py`, `media_parser.py`, `txt_parser.py`, `base.py`.
- Source diff on `sources/base.py`:
  - `backend/app/processing/sources/base.py` had broken imports (`EvtxParser`, `CsvParser`, `JsonParser`).
  - `ai-service/app/processing/sources/base.py` corrected these to `EVTXParser`, `CSVParser`, `JSONParser`.
  - Therefore, `ai-service` has the functioning, corrected code.

### D. Core Business Logic: `backend/` vs. `api/`
- `backend/` contains 17 services in Python (~200KB) handling Case CRUD, Evidence metadata, Custody trails, Timeline events, Findings, and Neo4j queries.
- `api/` contains 14 NestJS feature modules in TypeScript handling the exact same domain features with superior enterprise scaffolding:
  - Mongoose models with validation schemas.
  - BullMQ queue integration for async evidence ingestion.
  - S3 / MinIO integration for forensic file storage.
  - Realtime Socket.IO gateway.
  - Strict DTO request validation via `class-validator`.
  - Automated Jest unit and integration tests (`*.spec.ts`).

---

## 5. Active Frontend Identification

**Active Runtime Frontend:** **`frontend/`**  
**Target Production Frontend:** **`client/`**

### Evidence:
1. **Runtime Execution:** `start.bat` explicitly executed `cd /d "%~dp0frontend" && npm run dev`.
2. **Dependency Status:** `frontend/` contains fully installed `node_modules/` and build artifacts (`dist/`). In contrast, `client/` does not yet have `node_modules/` or a `package-lock.json`.
3. **Identity:** `frontend/package.json` retains the legacy name `"adeip-frontend"`, while `client/package.json` has the correct target name `"synapsex-client"`.
4. **Action:** Once `npm install` is executed in `client/`, `frontend/` can be safely retired.

---

## 6. Active Backend Identification

**Active Monolithic Prototype Backend:** **`backend/`** (Port 8000)  
**Active Target Enterprise Backend:** **`api/`** (Port 3001)

### Evidence:
1. **Concurrent Execution:** `start.bat` launched both `backend/` on port 8000 and `api/` on port 3001.
2. **Frontend Wiring:** In `client/src/services/api.js` and `frontend/src/services/api.js`:
   ```javascript
   const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://synapsex-qdhb.onrender.com/api'
   ```
   The frontend routes (`/auth/login`, `/cases`, `/evidence`, etc.) directly matched `backend/`'s raw endpoints.
3. **Response Envelope Mismatch:**
   - `backend/` returns raw JSON objects: `{ "access_token": "...", "user": {...} }`.
   - `api/` (NestJS) wraps all responses in an enterprise envelope:
     ```json
     {
       "success": true,
       "statusCode": 200,
       "message": "Operation completed successfully",
       "data": { ... },
       "timestamp": "2026-09-06T...",
       "path": "/api/v1/..."
     }
     ```
   - `api/` enforces URI versioning: `/api/v1/*`.
4. **Database Attachment:**
   - `backend/` actively maintains the SQLite database `backend/adeip.db`.
   - `api/` actively connects to MongoDB on port 27017 via `@nestjs/mongoose`.

---

## 7. Existing AI Functionality Audit

SynapseX possesses a sophisticated forensic AI pipeline built on LangGraph, located in `ai-service/app/`:

### 1. Multi-Agent Orchestration Pipeline (`ai-service/app/agents/graph.py`)
A compiled LangGraph `StateGraph` (with deterministic fallback runner) coordinates 8 specialized agents in sequence:

```
[User Request / Case Trigger]
             ↓
     1. chief_agent           (Analyzes directives, establishes scope and priorities)
             ↓
     2. evidence_agent        (Parses evidence artifacts, computes hashes, extracts entities)
             ↓
     3. timeline_agent        (Orders events temporally, clusters into temporal windows)
             ↓
     4. correlation_agent     (Identifies cross-evidence relationships and entity pivots)
             ↓
     5. graph_agent           (Builds Neo4j triples, node labels, and relationship edges)
             ↓
     6. reasoning_agent       (Applies forensic heuristics, maps MITRE ATT&CK patterns)
             ↓
     7. missing_evidence_agent(Detects forensic gaps and flags uncorroborated hypotheses)
             ↓
     8. report_agent          (Synthesizes comprehensive markdown & executive summary)
             ↓
           [END]
```

### 2. Entity Extraction Engine (`evidence_agent.py`)
Deterministic regex and structured field extractors identify forensic indicators:
- IPv4 / IPv6 addresses
- User accounts & emails
- USB hardware IDs & serial numbers
- File paths, hashes (SHA-256, MD5)
- Domains and URLs

### 3. LLM Providers & Models
- Framework: `langchain-openai` & `langchain-anthropic`
- Models configured: `gpt-4o`, `gpt-4o-mini`, `claude-3-5-sonnet`
- Fallback Heuristics: All agents have native Python rule-based deduction engines so they function even when external LLM API keys are not provided.

### 4. Inter-Service Analytical API (`ai-service/app/api/internal.py`)
Protected by internal token authorization (`X-Internal-Service-Key`):
- `POST /internal/analyze/evidence`: Entity and metadata extraction
- `POST /internal/analyze/timeline`: Temporal clustering and anomaly sequencing
- `POST /internal/analyze/correlation`: Pivot point and entity correlation
- `POST /internal/investigate`: Full multi-agent end-to-end investigation run

### 5. NestJS Integration (`api/src/modules/ai-client/`)
`FastApiAiServiceClient` in `api/` provides an HTTP client matching all internal endpoints, enabling BullMQ workers in `api/` to offload analytical tasks to `ai-service/`.

---

## 8. Database Analysis

| Datastore | Current Location | Active Data Status | Target Architecture Role |
| :--- | :--- | :--- | :--- |
| **SQLite (`adeip.db` at root)** | Project root (`./adeip.db`) | **0 bytes (Empty)**. Created as empty touch. Not used. | Safe to delete once migration is complete. |
| **SQLite (`backend/adeip.db`)** | `backend/adeip.db` | **405 KB**. Contains 14 tables, seeded user `analyst@adeip.local`, sample cases. Actively updated by `backend/`. | **Preserve** as historical dev artifact during migration. Target architecture does not use SQLite. |
| **MongoDB** | Docker container `synapsex-mongodb` (27017) | Initialized via `infrastructure/scripts/mongo-init.js`. Target primary database. | **Primary Datastore** for `api/` (NestJS Mongoose). Stores Cases, Evidence metadata, Custody records, Audit logs, Entities, Timelines, and Findings. |
| **Redis** | Docker container `synapsex-redis` (6379) | Active cache & queue broker. | **Job Queue & Cache** for BullMQ (in `api/`) and agent state cache. |
| **Neo4j** | Docker container `synapsex-neo4j` (7474/7687) | Graph database with APOC plugins. | **Knowledge Graph** for forensic link analysis and entity relationship visualization. |
| **MinIO** | Docker container `synapsex-minio` (9000/9001) | S3-compatible buckets: `synapsex-evidence`, `synapsex-reports`. | **Object Store** for binary evidence files and generated reports. |

---

## 9. Migration Risks & Mitigations

| Risk | Severity | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **API Contract Mismatch** | High | Client UI fails on API calls because `api/` wraps responses in `{ success, data }` and uses `/api/v1` prefix. | Add a transparent response-unwrapping adapter in `client/src/services/api.js` and set `VITE_API_BASE_URL=http://localhost:3001/api/v1`. |
| **Missing `client/node_modules`** | Medium | Starting `client/` fails with `vite not recognized`. | Execute `npm install` in `client/` before switching startup scripts. |
| **Simulation Logic Gap** | Medium | Attack simulation UI in `client/` fails if `simulation.py` from `backend/` is missing. | Port `backend/app/services/simulation.py` into `ai-service/app/services/simulation_service.py` with an internal API endpoint. |
| **Tooling Misdirection** | Low | VS Code / Pyright flags errors because configs point to `backend/`. | Update `pyrightconfig.json` and `.pyrefly.json` to reference `ai-service`. |
| **Accidental Data Loss** | High | Deleting `backend/` destroys dev SQLite test cases in `backend/adeip.db`. | Follow strict rule: **DO NOT delete `backend/` or `adeip.db`**. Archive instead. |

---

## 10. Recommended Step-by-Step Migration Plan

### Phase 1: Client Preparation & Tooling Alignment
1. In `client/`: Run `npm install` to generate `package-lock.json` and install dependencies.
2. In `client/src/services/api.js`: Update base URL and response handling to seamlessly support NestJS `/api/v1` enveloped responses.
3. Update `.pyrefly.json` and `pyrightconfig.json` to point `extraPaths` to `ai-service/`.
4. Verify `client/` builds cleanly (`npm run build`).

### Phase 2: AI Service Consolidation
1. Port forensic simulation logic from `backend/app/services/simulation.py` to `ai-service/app/services/simulation_service.py`.
2. Expose simulation endpoints in `ai-service/app/api/internal.py`.
3. Verify `ai-service` starts cleanly on port 8001 and passes `/health` checks.

### Phase 3: API Gateway & Worker Verification
1. Verify `api/` NestJS compiles cleanly (`npm run build`).
2. Run automated Jest tests in `api/` (`npm test`).
3. Verify BullMQ worker connection to Redis and `FastApiAiServiceClient` connection to `ai-service:8001`.

### Phase 4: Startup Script & Integration Smoke Testing
1. Update `start.bat` to launch the clean target stack:
   - Infrastructure (MongoDB, Redis, Neo4j, MinIO)
   - Core API (NestJS, Port 3001)
   - AI Service (FastAPI, Port 8001)
   - Client (React 19, Port 5173)
2. Execute full smoke test: Login -> Case Workspace -> Evidence Upload -> Agent Run -> Graph Visualization.

### Phase 5: Decommissioning & Archival (Post-Approval)
1. Rename `frontend/` to `_archive_frontend/`.
2. Rename `backend/` to `_archive_backend/` (preserving `backend/adeip.db`).
3. Remove empty root `package-lock.json` and 0-byte root `adeip.db`.
