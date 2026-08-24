# 🧠 SynapseX — ADEIP (AI-Assisted Digital Evidence Intelligence Platform)

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![LangGraph](https://img.shields.io/badge/AI%20Orchestration-LangGraph-FF6F00.svg?style=flat)](https://github.com/langchain-ai/langgraph)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**An autonomous, multi-agent digital forensics and cyber investigation intelligence platform that transforms raw, fragmented evidence into unified, explainable, and cryptographically verified investigative leads.**

[Explore Features](#-key-features) • [Investigation Workflow](#-system-architecture--investigation-workflow) • [Project Motive](#-project-motive--problem-statement) • [Quick Start](#-quick-start-guide) • [Requirements](REQUIREMENTS.md) • [Contributing](CONTRIBUTING.md)

</div>

---

## 🎯 Project Motive & Problem Statement

Modern cybercrime and digital forensics investigations face severe fragmentation:
- **Data Explosion**: Digital incidents produce millions of log lines, firewall events, CCTV footage, badge access records, disk forensics dumps, emails, and USB activity.
- **Cognitive Overload**: Human investigators spend up to 70% of their time manually parsing formats, matching timestamps across timezones, and correlating disconnected identities.
- **Chain of Custody Vulnerability**: Ensuring data tampering has not occurred across complex multi-stage transfers is challenging.
- **Cold Leads & Hidden Correlations**: Crucial pivot points (such as a badge swipe occurring 30 seconds before a remote SSH connection) are easily missed in siloed tools.

### 💡 The Motive of SynapseX
**SynapseX (ADEIP)** was engineered to solve these forensic challenges by providing an end-to-end, multi-agent collaborative investigation workspace. It automates evidence correlation, anomaly detection, timeline sequencing, and graph clustering while maintaining **cryptographic integrity (SHA-256)** and strict **Human-in-the-Loop (HITL)** governance.

> ⚠️ **Forensic Principle**: ADEIP assists authorized investigators. It extracts leads, builds graphs, and drafts reports, but **does not make autonomous legal determinations or replace human judgment**.

---

## 🔄 System Architecture & Investigation Workflow

SynapseX leverages a specialized **Multi-Agent Orchestration Engine** built on **LangGraph** where specialized autonomous agents collaborate in stateful cycles:

```
                            📥 MULTI-SOURCE DIGITAL EVIDENCE
   (System Logs, Firewall Rules, CCTV Feeds, Access Control, USB Dumps, Network PCAPs)
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    1. Forensic Ingestion & Hashing    │
                      │   • SHA-256 Cryptographic Sealing     │
                      │   • Chain of Custody Audit Entry      │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    2. Multi-Agent AI Orchestration    │
                      └───────────────────┬───────────────────┘
                                          │
         ┌────────────────────────────────┼────────────────────────────────┐
         ▼                                ▼                                ▼
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│ Evidence Agent  │              │ Timeline Agent  │              │   CCTV Agent    │
│ • Entity Extr.  │              │ • Timestamp Nor.│              │ • Frame Detect. │
│ • IOC Tagging   │              │ • Chrono-Order  │              │ • Visual Events │
└────────┬────────┘              └────────┬────────┘              └────────┬────────┘
         │                                │                                │
         ├────────────────────────────────┼────────────────────────────────┤
         ▼                                ▼                                ▼
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│  Network Agent  │              │Correlation Agent│              │   Graph Agent   │
│ • PCAP / IP Geo │              │ • Cross-Source  │              │ • Entity-Link   │
│ • Flow Analysis │              │   Hypotheses    │              │   Topology      │
└────────┬────────┘              └────────┬────────┘              └────────┬────────┘
         │                                │                                │
         └────────────────────────────────┼────────────────────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    3. Reasoning & Inference Agent     │
                      │   • Explainable Lead Generation       │
                      │   • Missing Evidence Suggestions      │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │  4. Interactive Investigator Workspace│
                      │   • Live Intelligence Chat            │
                      │   • Dynamic Knowledge Graph (Vis)     │
                      │   • Unified Interactive Timeline      │
                      │   • Real-Time Finding Verification    │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │ 5. Automated Draft Forensic Reporting │
                      │   • Court-Ready Audit Logs            │
                      │   • Complete Chain of Custody         │
                      └───────────────────────────────────────┘
```

---

## ✨ Key Features

| Category | Capability | Description |
| :--- | :--- | :--- |
| 🤖 **Multi-Agent AI** | LangGraph Agent Pipeline | Autonomous agents collaborate to parse, extract, correlate, and reason over unstructured forensic artifacts. |
| 🔒 **Forensic Integrity** | SHA-256 & Chain of Custody | Every uploaded file is hashed at ingestion; every view, export, and modification is permanently recorded in immutable audit logs. |
| ⏱️ **Timeline Engine** | Chronological Reconstruction | Normalizes diverse time formats (UTC, Epoch, localized) and correlates physical and digital events on an interactive timeline. |
| 🕸️ **Knowledge Graph** | Relationship Topology | Visually maps relationships between suspects, IP addresses, MAC addresses, machines, USB serials, and physical locations. |
| 🧠 **Explainable Leads** | AI Findings & Hypotheses | Transparent reasoning with verifiable evidence citations and confidence metrics. |
| 🔎 **Gap Analysis** | Missing Evidence Recommender | Proactively alerts investigators to missing data (e.g., *"DHCP lease logs missing between 14:00 - 15:00 UTC"*). |
| 💬 **Intelligence Chat** | Real-Time Forensic Assistant | Context-aware LLM copilot that answers natural language queries scoped strictly to the current case evidence. |
| 📄 **Case Reporting** | Executive & Technical Drafts | Generates structured case summaries, evidence tables, timeline highlights, and investigator conclusions. |

---

## 🏛️ Project Directory Structure

```text
SynapseX/
├── backend/                  # FastAPI Application Core
│   ├── app/
│   │   ├── agents/           # LangGraph AI Agents (Evidence, Timeline, Correlation, Graph, etc.)
│   │   ├── api/routes/       # REST API Endpoints (Cases, Evidence, Graph, Findings, Timeline, etc.)
│   │   ├── core/             # Configuration, Security Headers, Global Settings
│   │   ├── database/         # Database Sessions, SQLAlchemy Models, MongoDB & Neo4j Connections
│   │   ├── models/           # ORM Entities (Cases, Users, Evidence, Audit Logs, Findings)
│   │   ├── processing/       # Ingestion Parsers (Logs, PCAP, CCTV, Metadata Extractor)
│   │   ├── schemas/          # Pydantic Schemas for Request/Response Validation
│   │   ├── security/         # JWT Authentication, Password Hashing, RBAC
│   │   ├── services/         # Business Logic Layer
│   │   ├── tasks/            # Async Background Tasks & Celery Workers
│   │   └── websocket/        # Real-time WebSocket Managers (Live Updates)
│   ├── requirements.txt      # Python Dependencies
│   └── alembic/              # Database Migrations
│
├── frontend/                 # React 18 + Vite Web Application
│   ├── src/
│   │   ├── pages/            # View Pages (Dashboard, Evidence, Timeline, KnowledgeGraph, Chat, etc.)
│   │   ├── components/       # Reusable UI & Forensic Components
│   │   ├── services/         # Axios API Client & Endpoints
│   │   ├── context/          # Auth & Active Case State Contexts
│   │   └── assets/           # UI Icons, Logos, Styling
│   ├── package.json          # Node Dependencies & Scripts
│   └── vite.config.js        # Vite Build Configuration
│
├── CONTRIBUTING.md           # Step-by-step Guide for Contributors
├── start.bat                 # 1-Click Windows Dev Launcher
└── README.md                 # Project Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **Git**

---

### Option 1: 1-Click Launch (Windows)

Simply double-click or run from root:
```cmd
start.bat
```
*This will automatically launch the FastAPI backend, Vite dev server, and open `http://localhost:5173` in your browser.*

---

### Option 2: Manual Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/prajwal2430/SynapseX.git
cd SynapseX
```

#### 2. Backend Setup
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run FastAPI Backend Server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### 3. Frontend Setup
```bash
# In a new terminal window
cd frontend

# Install packages
npm install

# Start Vite Development Server
npm run dev
```

---

## 🌐 Application Endpoints

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Application** | [http://localhost:5173](http://localhost:5173) | Interactive Investigation Workspace & UI |
| **Backend REST API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | Core API Services |
| **Swagger API Docs** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Interactive API Explorer & OpenAPI Schema |
| **ReDoc API Docs** | [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) | Clean API Reference Documentation |

---

## 🛡️ Security, Privacy & Compliance

- **Immutable Audit Logging**: Every investigator action, query, export, and hypothesis generation is recorded with timestamps and user IDs.
- **Cryptographic Hash Verification**: SHA-256 hashes are calculated on raw streams prior to storage to guarantee evidence admissibility.
- **Strict Role-Based Access Control (RBAC)**: Enforces access restrictions between Lead Investigators, Forensic Analysts, Reviewers, and System Administrators.
- **Data Isolation**: Multi-tenant case containment ensures evidence from one case cannot leak into cross-case analysis.

---

## 🤝 Contributing

We welcome community contributions, bug reports, and feature enhancements!
Please read our **[Contributing Guide (CONTRIBUTING.md)](CONTRIBUTING.md)** for detailed instructions on:
- Forking & cloning the repository
- Creating branches & following commit standards
- Running local tests with `pytest`
- Submitting Pull Requests (PRs)

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<div align="center">
<sub>Built with ⚖️ integrity and 💡 intelligence for modern digital forensic investigators.</sub>
</div>
