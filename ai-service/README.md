# SynapseX AI Service

The dedicated Artificial Intelligence and Evidence Analytics microservice for **SynapseX**, powered by [FastAPI](https://fastapi.tiangolo.com/), [LangGraph](https://langchain-ai.github.io/langgraph/), and [Neo4j](https://neo4j.com/).

## Architectural Boundary

> **Core Principle**: The AI service handles **ONLY** AI and advanced evidence analysis.  
> General CRUD operations, user authentication, file uploads to MinIO, and general case records are strictly owned and managed by the **NestJS API** (`api/`).

### Responsibilities
1. **Multi-Agent Orchestration**: Executes stateful investigative graphs via LangGraph.
2. **Specialized AI Agents**:
   - `Chief Investigator Agent`: Central planning, hypothesis generation, and delegating sub-investigations.
   - `Evidence Analyst Agent`: Entity extraction, Indicators of Compromise (IoCs), and forensic artifact analysis.
   - `Timeline Agent`: Timestamp normalization, chronology sequencing, and temporal anomaly detection.
   - `Correlation Agent`: Multi-source correlation across disparate evidence files (IP addresses, hashes, identities).
   - `Knowledge Graph Agent`: Cypher query construction and Neo4j graph traversal.
   - `Reasoning Agent`: Contradiction analysis and logical inference over case findings.
   - `Missing Evidence Agent`: Identifying investigative blind spots and suggesting next steps.
   - `Report Agent`: Synthesizing technical dossiers and executive summaries.
3. **Knowledge Graph Processing**: Reading and writing high-performance entity-relationship graphs in Neo4j.
4. **Deep Evidence Parsing**: Extracting structured forensic records from EVTX, PCAP, CSV, JSON, TXT, and media metadata.

## Directory Structure

```
ai-service/
├── app/
│   ├── agents/             # LangGraph stateful multi-agent definitions
│   │   ├── chief_agent.py
│   │   ├── correlation_agent.py
│   │   ├── evidence_agent.py
│   │   ├── graph.py        # LangGraph StateGraph builder
│   │   ├── graph_agent.py
│   │   ├── missing_evidence_agent.py
│   │   ├── reasoning_agent.py
│   │   ├── report_agent.py
│   │   ├── state.py        # InvestigationState typed dict
│   │   └── timeline_agent.py
│   ├── api/                # FastAPI routing layer
│   │   └── v1/
│   │       ├── endpoints/  # Health, Analysis, Agents, Graph
│   │       └── router.py
│   ├── core/               # Configuration, logging, Neo4j client
│   │   ├── config.py
│   │   ├── logging.py
│   │   └── neo4j.py
│   ├── processing/         # Evidence parsers (EVTX, CSV, JSON, Media)
│   │   ├── base.py
│   │   ├── csv_parser.py
│   │   ├── evtx_parser.py
│   │   ├── json_parser.py
│   │   ├── media_parser.py
│   │   └── txt_parser.py
│   ├── schemas/            # Pydantic input/output validation contracts
│   ├── services/           # Service layer coordinating agents and graph
│   └── main.py             # FastAPI bootstrap
├── .env.example
├── .gitignore
├── Dockerfile
├── pyproject.toml
├── README.md
└── requirements.txt
```

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Microservice HTTP port | `8000` |
| `APP_ENV` | Environment (`development`, `production`) | `development` |
| `API_SECRET_KEY` | Secret token verified on calls from NestJS | Placeholder |
| `NEO4J_URI` | Neo4j Bolt protocol URI | `bolt://localhost:7687` |
| `NEO4J_USER` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | Placeholder |
| `MONGODB_URI` | MongoDB connection for case context | `mongodb://synapsex_user:synapsex_password@localhost:27017/synapsex` |
| `REDIS_URL` | Redis for state checkpointer & cache | `redis://localhost:6379/0` |
| `OPENAI_API_KEY` | OpenAI API key for LLM agents | Placeholder |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | Placeholder |

## Getting Started

### Local Development

```bash
# Create and activate Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI development server with auto-reload
uvicorn app.main:app --reload --port 8000
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Docker Execution

```bash
docker build -t synapsex-ai-service .
docker run -p 8000:8000 synapsex-ai-service
```
