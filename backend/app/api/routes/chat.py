"""
Investigation Assistant Chat Routes for ADEIP / SynapseX.
Provides natural language evidence-grounded queries scoped strictly to an active case.
"""
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_active_user
from app.api.dependencies.database import get_db
from app.models.user import User
from app.services.chat_service import ChatService

router = APIRouter(prefix="/cases", tags=["Investigation Assistant Chat"])


class ChatMessageRequest(BaseModel):
    query: Optional[str] = Field(None, max_length=1000, description="Investigator query")
    message: Optional[str] = Field(None, max_length=1000, description="Alias for query")


@router.post(
    "/{case_id}/chat",
    status_code=status.HTTP_200_OK,
    summary="Query active case evidence with grounded citations and zero hallucinations",
)
def chat_with_case_evidence(
    case_id: int,
    req: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """
    Answers investigator questions strictly using the digital evidence, events,
    entities, and correlations registered to the specified case.
    Every factual statement cites specific evidence numbers and files.
    """
    effective_query = (req.query or req.message or "").strip()
    if not effective_query:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either 'query' or 'message' field is required."
        )

    return ChatService.answer_query(
        db=db,
        case_id=case_id,
        query=effective_query,
    )
