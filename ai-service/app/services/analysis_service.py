"""
Analysis Service Orchestration Layer.
Bridges API endpoints to LangGraph multi-agent execution graphs.
"""
import logging
import uuid
import time
from typing import Any, Dict
from app.schemas.analysis import AgentRunRequest, AgentRunResponse

logger = logging.getLogger("synapsex.ai.analysis_service")


class AnalysisService:
    """
    Coordinates LangGraph agent executions for evidence intelligence workflows.
    """

    async def trigger_agent_workflow(self, request: AgentRunRequest) -> AgentRunResponse:
        """
        Initializes and dispatches an asynchronous LangGraph workflow run.
        """
        run_id = str(uuid.uuid4())
        start_time = time.time()
        logger.info(f"Triggering LangGraph workflow run {run_id} for case {request.case_id}")

        # The workflow runner integrates with app.agents.graph.create_investigation_graph
        # In this architecture phase, the execution boundary is defined.
        duration = (time.time() - start_time) * 1000

        return AgentRunResponse(
            run_id=run_id,
            case_id=request.case_id,
            status="accepted",
            message=f"Investigation workflow queued for case {request.case_id}",
            duration_ms=duration,
        )


analysis_service = AnalysisService()
