# SynapseX — AI-Assisted Digital Evidence Intelligence Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.4-red.svg)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2-purple.svg)](https://langchain-ai.github.io/langgraph/)
[![Neo4j](https://img.shields.io/badge/Neo4j-5.20-008CC1.svg)](https://neo4j.com/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://docs.docker.com/compose/)

SynapseX is an enterprise-grade Digital Evidence Intelligence Platform designed for forensic investigators, incident response teams, and intelligence analysts. It integrates multi-agent AI reasoning, graph analytics, and real-time incident collaboration into a secure, scalable architecture.

---

## 🏗️ Multi-Service Repository Architecture

The platform is organized as a clean multi-service monorepo:

```
synapsex/
├── client/                 # React 19 + Vite Frontend Application
├── api/                    # NestJS + TypeScript Primary Backend & Gateway
├── ai-service/             # FastAPI + LangGraph AI Evidence Intelligence Microservice
├── infrastructure/         # Docker Compose local development stack
└── docs/                   # System architecture specifications & migration guides
```

### Service Responsibility Breakdown

| Service | Directory | Core Technologies | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Client** | `client/` | React 19, Vite, Lucide | Investigation dashboard, timeline graphs, interactive evidence explorer |
| **API** | `api/` | NestJS, TypeScript, MongoDB, BullMQ, Socket.IO | Gateway, authentication, case lifecycle, MinIO file upload, task scheduling |
| **AI Service** | `ai-service/` | Python 3.11, FastAPI, LangGraph, Neo4j | 8 specialized AI agents, deep forensic parsing, knowledge graph analytics |
| **Infrastructure** | `infrastructure/` | Docker Compose, MinIO, Redis, Neo4j, Mongo | Local storage, caching, data stores, container networking |
| **Documentation** | `docs/` | Markdown Specifications | Architecture, data flow diagrams, API contracts, migration guides |

---

## ⚡ Quick Start with Docker Compose

To launch the complete multi-service stack with a single command:

```bash
# 1. Navigate to infrastructure
cd infrastructure

# 2. Configure environment variables
cp .env.example .env

# 3. Boot all containers
docker compose up --build
```

### Service URLs & Endpoints

| Service | URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Web Client** | [http://localhost:3000](http://localhost:3000) | Investigation UI |
| **NestJS API** | [http://localhost:3001/api](http://localhost:3001/api) | Main API Gateway |
| **API Health** | [http://localhost:3001/api/health](http://localhost:3001/api/health) | Terminus Health Check |
| **AI Service Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | OpenAPI / Swagger UI |
| **Neo4j Browser** | [http://localhost:7474](http://localhost:7474) | `neo4j` / `synapsex_neo4j_password` |
| **MinIO Console** | [http://localhost:9001](http://localhost:9001) | `minioadmin` / `minioadmin` |

---

## 🛠️ Individual Service Development

### 1. Web Client (`client/`)
```bash
cd client
npm install
npm run dev
```

### 2. NestJS API (`api/`)
```bash
cd api
npm install
npm run start:dev
```

### 3. AI Service (`ai-service/`)
```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 📚 Detailed Documentation

- [System Architecture Specification](docs/architecture.md)
- [Step-by-Step Migration Guide](docs/migration-guide.md)
- [Inter-Service API & Event Contracts](docs/api-contracts.md)
- [Client Documentation](client/README.md)
- [API Documentation](api/README.md)
- [AI Service Documentation](ai-service/README.md)
- [Infrastructure Documentation](infrastructure/README.md)

---

## 🔒 Security & Secrets Hygiene

All `.env.example` templates contain safe development defaults and non-production placeholder keys.  
**Never commit real API keys, production database credentials, or secret salts to source control.**
