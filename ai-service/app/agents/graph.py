"""
LangGraph Multi-Agent Orchestration Graph for ADEIP.

Assembles and executes the sequential intelligence investigation graph:
  chief_agent
      ↓
  evidence_agent
      ↓
  timeline_agent
      ↓
  correlation_agent
      ↓
  graph_agent
      ↓
  reasoning_agent
      ↓
  missing_evidence_agent
      ↓
  report_agent
      ↓
     END
"""
import logging
from typing import Any, Dict

from app.agents.chief_agent import chief_agent
from app.agents.correlation_agent import correlation_agent
from app.agents.evidence_agent import evidence_agent
from app.agents.graph_agent import graph_agent
from app.agents.missing_evidence_agent import missing_evidence_agent
from app.agents.reasoning_agent import reasoning_agent
from app.agents.report_agent import report_agent
from app.agents.state import InvestigationState
from app.agents.timeline_agent import timeline_agent

logger = logging.getLogger("adeip.agents.graph")


def _run_sequential_pipeline(initial_state: InvestigationState) -> InvestigationState:
    """
    Deterministic sequential runner for the multi-agent investigation pipeline.
    Executes each modular agent in topological order, merging state updates.
    """
    state = dict(initial_state)

    pipeline = [
        ("chief_agent", chief_agent),
        ("evidence_agent", evidence_agent),
        ("timeline_agent", timeline_agent),
        ("correlation_agent", correlation_agent),
        ("graph_agent", graph_agent),
        ("reasoning_agent", reasoning_agent),
        ("missing_evidence_agent", missing_evidence_agent),
        ("report_agent", report_agent),
    ]

    for name, agent_fn in pipeline:
        try:
            logger.debug(f"[GraphOrchestrator] Invoking agent node: {name}")
            updates = agent_fn(state)
            if updates and isinstance(updates, dict):
                state.update(updates)
        except Exception as exc:
            err_msg = f"Agent {name} encountered an error: {str(exc)}"
            logger.error(f"[GraphOrchestrator] {err_msg}", exc_info=True)
            errors = list(state.get("errors", []))
            errors.append(err_msg)
            state["errors"] = errors

    return state


def build_investigation_graph():
    """
    Constructs the LangGraph StateGraph workflow for multi-agent investigation.
    Returns a compiled LangGraph runnable if langgraph is installed,
    or falls back to the deterministic pipeline runner.
    """
    try:
        from langgraph.graph import END, StateGraph  # type: ignore # pyrefly: ignore

        workflow = StateGraph(InvestigationState)

        # 1. Register all agent nodes
        workflow.add_node("chief_agent", chief_agent)
        workflow.add_node("evidence_agent", evidence_agent)
        workflow.add_node("timeline_agent", timeline_agent)
        workflow.add_node("correlation_agent", correlation_agent)
        workflow.add_node("graph_agent", graph_agent)
        workflow.add_node("reasoning_agent", reasoning_agent)
        workflow.add_node("missing_evidence_agent", missing_evidence_agent)
        workflow.add_node("report_agent", report_agent)

        # 2. Set entry point
        workflow.set_entry_point("chief_agent")

        # 3. Define sequential execution edges
        workflow.add_edge("chief_agent", "evidence_agent")
        workflow.add_edge("evidence_agent", "timeline_agent")
        workflow.add_edge("timeline_agent", "correlation_agent")
        workflow.add_edge("correlation_agent", "graph_agent")
        workflow.add_edge("graph_agent", "reasoning_agent")
        workflow.add_edge("reasoning_agent", "missing_evidence_agent")
        workflow.add_edge("missing_evidence_agent", "report_agent")
        workflow.add_edge("report_agent", END)

        compiled_graph = workflow.compile()
        logger.info("[GraphOrchestrator] Successfully compiled LangGraph StateGraph workflow.")
        return compiled_graph

    except ImportError:
        logger.warning(
            "[GraphOrchestrator] LangGraph package not found. Using native deterministic graph runner."
        )

        class _FallbackGraphRunner:
            def invoke(self, state: InvestigationState) -> InvestigationState:
                return _run_sequential_pipeline(state)

        return _FallbackGraphRunner()


# Global singleton compiled graph
investigation_graph = build_investigation_graph()


def run_investigation(initial_state: InvestigationState) -> InvestigationState:
    """
    Executes the multi-agent investigation workflow on the given initial state.
    """
    try:
        return investigation_graph.invoke(initial_state)
    except Exception as exc:
        logger.error(f"[GraphOrchestrator] LangGraph invocation failed, falling back to direct pipeline: {exc}")
        return _run_sequential_pipeline(initial_state)
