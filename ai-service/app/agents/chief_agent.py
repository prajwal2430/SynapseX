"""
Chief Investigation Agent (Supervisor & Orchestrator).

Responsibilities:
- Initializes investigation scope and parameters.
- Validates case information and input evidence artifacts.
- Synthesizes high-level investigation plan and execution logs.
- Assesses pipeline execution health.
"""
import datetime
import logging
from typing import Any, Dict
from app.agents.state import InvestigationState

logger = logging.getLogger("adeip.agents.chief")


def chief_agent(state: InvestigationState) -> Dict[str, Any]:
    """
    Chief Agent: Supervises case investigation scope, registers initial plan,
    and logs orchestration lifecycle.
    """
    case_id = state.get("case_id", 0)
    evidence_ids = state.get("evidence_ids", [])
    raw_events = state.get("raw_events", [])
    errors = list(state.get("errors", []))
    logs = list(state.get("agent_logs", []))

    logger.info(
        f"[ChiefAgent] Initiating multi-agent investigation for Case #{case_id} "
        f"with {len(evidence_ids)} evidence artifacts and {len(raw_events)} events."
    )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if not evidence_ids and not raw_events:
        msg = f"Case #{case_id} has no evidence or events registered."
        logger.warning(f"[ChiefAgent] {msg}")
        errors.append(msg)

    logs.append({
        "agent": "chief_agent",
        "phase": "initialization",
        "timestamp": now_iso,
        "details": f"Investigation scoped for Case #{case_id}. {len(evidence_ids)} evidence files, {len(raw_events)} events.",
        "status": "ready" if not errors else "degraded",
    })

    return {
        "status": "in_progress",
        "agent_logs": logs,
        "errors": errors,
    }
