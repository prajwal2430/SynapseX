"""
Agent registry and capabilities endpoint.
"""
from typing import List, Dict, Any
from fastapi import APIRouter

router = APIRouter()

AVAILABLE_AGENTS = [
    {
        "id": "chief_investigator",
        "name": "Chief Investigator Agent",
        "description": "Orchestrates multi-agent investigative workflows and synthesizes final case hypotheses.",
        "type": "coordinator",
    },
    {
        "id": "evidence_analyst",
        "name": "Evidence Analysis Agent",
        "description": "Extracts entities, indicators of compromise, and artifacts from raw evidence files.",
        "type": "specialist",
    },
    {
        "id": "timeline_builder",
        "name": "Timeline Agent",
        "description": "Extracts timestamps, chronological events, and detects temporal anomalies.",
        "type": "specialist",
    },
    {
        "id": "correlation_engine",
        "name": "Correlation Agent",
        "description": "Correlates evidence across disparate sources, identifying shared IP addresses, hashes, and actors.",
        "type": "specialist",
    },
    {
        "id": "graph_explorer",
        "name": "Knowledge Graph Agent",
        "description": "Constructs Cypher queries and expands relationship trees within Neo4j.",
        "type": "specialist",
    },
    {
        "id": "reasoning_engine",
        "name": "Hypothesis & Reasoning Agent",
        "description": "Generates investigative hypotheses and points out evidentiary gaps or contradictions.",
        "type": "specialist",
    },
    {
        "id": "missing_evidence",
        "name": "Missing Evidence Agent",
        "description": "Identifies critical gaps in the investigation and recommends subsequent evidence collection steps.",
        "type": "specialist",
    },
    {
        "id": "report_generator",
        "name": "Report Agent",
        "description": "Compiles executive summaries, findings ledgers, and forensic dossiers.",
        "type": "specialist",
    },
]


@router.get("", response_model=List[Dict[str, Any]], summary="List all registered LangGraph agents")
async def list_agents():
    return AVAILABLE_AGENTS
