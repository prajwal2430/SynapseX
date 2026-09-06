"""
Graph Service.
Provides high-performance Cypher execution and graph queries against Neo4j.
"""
import logging
from typing import Any, Dict, List
from app.core.neo4j import Neo4jClient
from app.schemas.analysis import GraphQueryRequest, GraphQueryResponse

logger = logging.getLogger("synapsex.ai.graph_service")


class GraphService:
    """
    Manages Knowledge Graph operations, relationship queries, and Cypher executions.
    """

    async def query_case_graph(self, request: GraphQueryRequest) -> GraphQueryResponse:
        """
        Queries nodes and relationships associated with a specific case ID in Neo4j.
        """
        cypher = (
            request.cypher_query
            or f"MATCH (n)-[r]->(m) WHERE n.case_id = $case_id RETURN n, r, m LIMIT {request.limit}"
        )
        params = {"case_id": request.case_id}

        records = Neo4jClient.execute_query(cypher, params)
        nodes: List[Dict[str, Any]] = []
        relationships: List[Dict[str, Any]] = []

        # Graph node/edge extraction
        for record in records:
            if "n" in record and record["n"] not in nodes:
                nodes.append(record["n"])
            if "m" in record and record["m"] not in nodes:
                nodes.append(record["m"])
            if "r" in record:
                relationships.append(record["r"])

        return GraphQueryResponse(
            nodes=nodes,
            relationships=relationships,
            total_nodes=len(nodes),
            total_relationships=len(relationships),
        )


graph_service = GraphService()
