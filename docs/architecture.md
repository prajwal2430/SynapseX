# SynapseX System Architecture Specification

## 1. Architectural Overview

SynapseX is an enterprise-grade Digital Evidence Intelligence Platform designed to ingest, process, correlate, and analyze digital evidence using multi-agent artificial intelligence and forensic knowledge graphs.

The platform is structured as a decoupled, multi-service architecture with strict separation between business orchestration, high-performance evidence storage, and artificial intelligence reasoning.

```mermaid
flowchart TB
    subgraph Frontend["Client Layer"]
        Client["React 19 + Vite Client<br/>(Port 3000)"]
    end

    subgraph API["Main Backend Service"]
        Nest["NestJS Enterprise API<br/>(Port 3001)<br/>TypeScript • Mongoose"]
        Gateway["Socket.IO Gateway"]
        BullMQ["BullMQ Task Producer & Worker"]
    end

    subgraph AIService["AI & Analytics Microservice"]
        FastAPI["FastAPI AI Service<br/>(Port 8000)<br/>Python 3.11"]
        LangGraph["LangGraph Multi-Agent Engine<br/>(8 Specialized Agents)"]
        Parsers["Deep Evidence Parsers<br/>(EVTX, PCAP, Media)"]
    end

    subgraph DataTier["Data & Storage Infrastructure"]
        Mongo[("MongoDB 7.0<br/>Primary Document Store")]
        Redis[("Redis 7.0<br/>Queue, Cache & Pub/Sub")]
        Neo4j[("Neo4j 5.20<br/>Forensic Knowledge Graph")]
        MinIO[("MinIO Object Storage<br/>Raw Evidence Vault")]
    end

    %% Communications
    Client -- "HTTP REST (/api)" --> Nest
    Client <--> "WebSocket / Events" <--> Gateway
    Nest --> BullMQ
    BullMQ <--> Redis
    Nest --> Mongo
    Nest --> MinIO
    BullMQ -- "Internal HTTP REST (/api/v1)" --> FastAPI
    FastAPI --> LangGraph
    LangGraph --> Neo4j
    FastAPI --> Parsers
    FastAPI -. "Read Case Context" .-> Mongo
```

---

## 2. Service Responsibilities & Boundaries

### 2.1 Client (`client/`)
- **Technology**: React 19, Vite, React Router v7, Vanilla CSS design system.
- **Scope**: Presentation, user interaction, evidence visualization, real-time alert rendering, investigation timeline graphs.
- **Constraints**: Never communicates directly with the Python AI service or databases. All traffic flows through the NestJS API gateway.

### 2.2 Main API (`api/`)
- **Technology**: Node.js, NestJS, TypeScript, Mongoose, BullMQ, Socket.IO, MinIO SDK.
- **Scope**:
  - Authentication, authorization (RBAC), and session management.
  - Case metadata and chain of custody tamper-evident ledger.
  - Evidence file reception, SHA-256 hash validation, and upload to MinIO.
  - Asynchronous background job dispatching via BullMQ.
  - Real-time client updates via Socket.IO case rooms.
  - Proxying analysis jobs to the AI service.

### 2.3 AI Service (`ai-service/`)
- **Technology**: Python 3.11, FastAPI, LangGraph, LangChain, Neo4j Driver, Motor.
- **Scope**:
  - Multi-agent investigation workflows (Chief Investigator, Evidence Analyst, Timeline Builder, Correlation Engine, Knowledge Graph Explorer, Reasoning Agent, Missing Evidence Agent, Report Generator).
  - Knowledge graph entity extraction, relationship creation, and Cypher graph analytics.
  - Deep binary and forensic evidence file parsing (EVTX, PCAP, EXIF).
- **Constraints**: No user authentication management, no payment/billing, no direct client UI exposure. Only accessible internally by the NestJS API.

### 2.4 Infrastructure (`infrastructure/`)
- **Technology**: Docker Compose, MongoDB 7, Redis 7, Neo4j 5, MinIO.
- **Scope**: Container orchestration, persistence volumes, network isolation, local storage bucket initialization.

---

## 3. Data Tier & Storage Strategy

| Data Store | Purpose | Data Hosted |
| :--- | :--- | :--- |
| **MongoDB** | Primary Document Database | Cases, Users, Custody Logs, Evidence Metadata, Agent Findings, System Audit Logs |
| **MinIO** | Object Storage (S3 API) | Raw forensic evidence binaries (disk images, logs, media), generated report PDFs |
| **Neo4j** | Graph Database | Entity relationships, cross-case correlations, communication graphs, threat actor nodes |
| **Redis** | In-Memory Data Store | BullMQ queue jobs, Socket.IO multi-instance adapter, LangGraph checkpoint cache |

---

## 4. Asynchronous Pipeline & Data Flow

1. **Evidence Upload**:
   - Client posts evidence file to `POST /api/evidence/upload`.
   - NestJS streams the binary to MinIO, calculates SHA-256 hash, and logs a chain-of-custody entry in MongoDB.
   - NestJS enqueues an `evidence-ingestion` job in BullMQ.

2. **Parsing & Analysis Dispatch**:
   - BullMQ worker picks up the job, verifies file integrity, and triggers `POST /api/v1/analysis/run` on the Python AI Service.
   - The AI Service spins up a LangGraph execution graph with case state.

3. **Multi-Agent Execution & Graph Sync**:
   - `Evidence Analyst` and `Timeline` agents extract entities, timestamps, and IoCs.
   - `Knowledge Graph Agent` commits nodes and relationships into Neo4j with source evidence references.
   - Findings and hypotheses are returned to NestJS.

4. **Real-time Client Broadcast**:
   - NestJS updates MongoDB with findings.
   - NestJS emits `evidence_analyzed` and `finding_added` events through `EventsGateway` to the client's case room.

---

## 5. Security Architecture

- **Zero Trust Internal Boundaries**: Communication between NestJS API and Python AI Service is secured via pre-shared service tokens (`AI_SERVICE_API_KEY`).
- **Chain of Custody Integrity**: Every evidence interaction (view, upload, parse, export) creates an immutable hash-chained log entry in MongoDB.
- **Credential Hygiene**: All secrets are supplied via environment variables. Default credentials in `.env.example` files are strictly intended for isolated local containers.
