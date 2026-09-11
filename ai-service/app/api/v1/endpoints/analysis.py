"""
Analysis endpoints for triggering AI workflows.
"""
from fastapi import APIRouter, HTTPException, status
from app.schemas.analysis import AgentRunRequest, AgentRunResponse
from app.services.analysis_service import analysis_service

router = APIRouter()


@router.post("/run", response_model=AgentRunResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_analysis(request: AgentRunRequest):
    """
    Triggers an asynchronous multi-agent LangGraph analysis workflow for a given case.
    """
    try:
        response = await analysis_service.trigger_agent_workflow(request)
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate agent workflow: {str(exc)}",
        )
