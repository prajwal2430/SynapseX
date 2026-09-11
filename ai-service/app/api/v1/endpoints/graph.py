"""
Knowledge graph query endpoints.
"""
from fastapi import APIRouter, HTTPException, status
from app.schemas.analysis import GraphQueryRequest, GraphQueryResponse
from app.services.graph_service import graph_service

router = APIRouter()


@router.post("/query", response_model=GraphQueryResponse, summary="Query Neo4j knowledge graph for a case")
async def query_graph(request: GraphQueryRequest):
    """
    Retrieves knowledge graph subgraphs, nodes, and relationships for an investigation.
    """
    try:
        response = await graph_service.query_case_graph(request)
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query knowledge graph: {str(exc)}",
        )
