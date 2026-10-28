"""
Investigation Knowledge Graph Routes for ADEIP.
Provides endpoints for retrieving graph topologies and synchronizing to Neo4j.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_active_user
from app.api.dependencies.database import get_db
from app.core.neo4j import Neo4jClient
from app.models.user import User
from app.schemas.graph import (
    CaseKnowledgeGraphResponse,
    GraphSyncResultResponse,
)
from app.services.graph_service import GraphService

router = APIRouter(prefix="/cases", tags=["Investigation Knowledge Graph"])


@router.get(
    "/{case_id}/graph",
    response_model=CaseKnowledgeGraphResponse,
    status_code=status.HTTP_200_OK,
    summary="Get the Investigation Knowledge Graph for a case (Neo4j & Frontend visualizer compatible)",
)
def get_case_knowledge_graph(
    case_id: int,
    max_nodes: Optional[int] = Query(250, ge=10, le=2000, description="Max entities to include for interactive visualizers"),
    sync_neo4j: bool = Query(False, description="Optionally trigger background synchronization to Neo4j database"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves the complete Investigation Knowledge Graph for a case:
    - **Nodes**: Person, Device, Account, IPAddress, File, USBDevice, Location, Evidence, Event
    - **Relationships**: USED, ACCESSED, CONNECTED_TO, TRANSFERRED_TO, LOCATED_AT, RELATED_TO, OBSERVED_IN
    - **Grounding**: Preserves source evidence IDs and event IDs across every node and edge.
    - **Explainability**: Only creates relationships from deterministic extraction or documented correlation results.
    - **Storage**: PostgreSQL remains the primary system of record; Neo4j is used for relationship exploration.
    """
    return GraphService.build_case_knowledge_graph(
        db=db,
        case_id=case_id,
        sync_to_neo4j=sync_neo4j,
        max_nodes=max_nodes,
    )


@router.post(
    "/{case_id}/graph/sync",
    response_model=GraphSyncResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Synchronize the case graph topology to the Neo4j graph database",
)
def sync_case_graph_to_neo4j(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Explicitly synchronizes the case's verified nodes and relationships from PostgreSQL
    into the Neo4j Graph Database for high-speed Cypher exploration.
    """
    # Build complete graph
    graph_data = GraphService.build_case_knowledge_graph(db=db, case_id=case_id, sync_to_neo4j=False)

    from app.models.case import InvestigationCase
    from sqlalchemy import select
    case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()

    sync_result = GraphService.sync_case_to_neo4j(
        case=case,
        nodes=graph_data.nodes,
        edges=graph_data.edges,
    )

    return GraphSyncResultResponse(
        case_id=case_id,
        neo4j_status=sync_result.get("neo4j_status", "unknown"),
        nodes_synced=sync_result.get("nodes_synced", 0),
        relationships_synced=sync_result.get("relationships_synced", 0),
        message=sync_result.get("message", "Sync completed."),
    )


@router.get(
    "/graph/neo4j/health",
    status_code=status.HTTP_200_OK,
    summary="Check Neo4j database connectivity health",
)
def check_neo4j_health(
    current_user: User = Depends(get_current_active_user),
):
    """
    Verifies connection status to the Neo4j instance.
    """
    return Neo4jClient.check_health()
