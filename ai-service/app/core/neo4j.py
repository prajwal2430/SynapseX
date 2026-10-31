"""
Neo4j Graph Database Client for SynapseX AI Service.
Handles connection pooling, Cypher execution, and health validation.
"""
import logging
from typing import Any, Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger("synapsex.ai.neo4j")


class Neo4jClient:
    """
    Manages Neo4j driver connection, health checks, and Cypher execution.
    """
    _driver = None

    @classmethod
    def get_driver(cls):
        """
        Lazily initializes and returns the Neo4j driver singleton.
        """
        if cls._driver is None and settings.NEO4J_URI:
            try:
                from neo4j import GraphDatabase
                auth = (settings.NEO4J_USER, settings.NEO4J_PASSWORD) if settings.NEO4J_USER else None
                cls._driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=auth,
                    max_connection_lifetime=3600,
                    max_connection_pool_size=50,
                    connection_acquisition_timeout=5.0,
                )
                logger.info(f"[Neo4j] Driver initialized for {settings.NEO4J_URI}")
            except ImportError:
                logger.warning("[Neo4j] 'neo4j' Python package not installed.")
                cls._driver = None
            except Exception as exc:
                logger.warning(f"[Neo4j] Failed to connect to Neo4j at {settings.NEO4J_URI}: {exc}")
                cls._driver = None
        return cls._driver

    @classmethod
    def check_health(cls) -> Dict[str, Any]:
        """
        Verifies Neo4j connectivity.
        """
        driver = cls.get_driver()
        if not driver:
            return {
                "status": "unavailable",
                "database": "Neo4j",
                "message": "Neo4j driver not connected or disabled.",
                "uri": settings.NEO4J_URI,
            }
        try:
            with driver.session() as session:
                result = session.run("RETURN 1 AS ping")
                record = result.single()
                if record and record["ping"] == 1:
                    return {
                        "status": "connected",
                        "database": "Neo4j",
                        "uri": settings.NEO4J_URI,
                    }
        except Exception as exc:
            return {
                "status": "disconnected",
                "database": "Neo4j",
                "error": str(exc),
                "uri": settings.NEO4J_URI,
            }
        return {"status": "disconnected", "database": "Neo4j"}

    @classmethod
    def execute_query(cls, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Executes a Cypher query in a managed Neo4j session.
        Returns a list of records as dictionaries.
        """
        driver = cls.get_driver()
        if not driver:
            logger.debug("[Neo4j] Skipping Cypher execution (driver not active).")
            return []

        try:
            with driver.session() as session:
                result = session.run(query, parameters or {})
                return [record.data() for record in result]
        except Exception as exc:
            logger.error(f"[Neo4j] Cypher query execution failed: {exc}\nQuery: {query}", exc_info=False)
            return []

    @classmethod
    def close(cls):
        """Closes the Neo4j driver connection pool."""
        if cls._driver is not None:
            try:
                cls._driver.close()
                logger.info("[Neo4j] Driver connection closed.")
            except Exception as exc:
                logger.error(f"[Neo4j] Error closing driver: {exc}")
            finally:
                cls._driver = None
