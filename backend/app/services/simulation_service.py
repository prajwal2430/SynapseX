"""
Simulated Live Investigation Event Generator for ADEIP.

CRITICAL REQUIREMENT:
- All events and outputs are strictly labeled as demo/simulated data.
- NEVER presented as real police data.
- Enters through the standard processing pipeline (Evidence -> Event -> Entity -> Timeline -> Correlation -> Reasoning).
- Publishes live WebSocket updates at every step.
"""
import asyncio
import datetime
import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.audit_actions import AuditAction, AuditResourceType
from app.core.websocket import InvestigationWebSocketEvent, ws_manager
from app.database.session import SessionLocal
from app.models.case import InvestigationCase
from app.models.entity import EntityType, ExtractedEntityModel, ExtractionMethod
from app.models.evidence import Evidence, IntegrityStatus, ProcessingStatus
from app.models.investigation_event import EventType, InvestigationEvent
from app.models.user import User
from app.schemas.simulation import (
    SimulationStartRequest,
    SimulationStatusResponse,
)
from app.services.audit_service import AuditService
from app.services.correlation_service import CorrelationService
from app.services.entity_service import EntityService
from app.services.finding_service import FindingService

logger = logging.getLogger("adeip.simulation")

_SIMULATION_DISCLAIMER = "DEMONSTRATION ONLY: Simulated investigation data. Not real police data."

# Step definitions: 10:02 CCTV -> 10:03 ACCESS -> 10:04 LOGIN -> 10:05 USB -> 10:07 FILE -> 10:09 NETWORK
_SIMULATION_STEPS = [
    {
        "step_index": 1,
        "time_str": "10:02",
        "timestamp_iso": "2026-08-21T10:02:00Z",
        "event_label": "CCTV_EVENT",
        "event_type": EventType.LOG_ENTRY,
        "source": "SIMULATED_CCTV_FEED.mp4",
        "entity_type": "person",
        "entity_value": "John Smith",
        "agent": "evidence_agent",
        "metadata": {
            "event_label": "CCTV_EVENT",
            "person": "John Smith",
            "location": "Server Room B Entrance",
            "action": "Approached secured entrance",
            "camera_id": "CAM-04-NORTH",
            "confidence": 0.95,
            "is_simulated": True,
            "simulation_tag": "DEMO_CASE_SIMULATION",
        },
    },
    {
        "step_index": 2,
        "time_str": "10:03",
        "timestamp_iso": "2026-08-21T10:03:00Z",
        "event_label": "ACCESS_EVENT",
        "event_type": EventType.ALERT,
        "source": "SIMULATED_PHYSICAL_BADGE.csv",
        "entity_type": "user_account",
        "entity_value": "jsmith@corp.int",
        "agent": "evidence_agent",
        "metadata": {
            "event_label": "ACCESS_EVENT",
            "user": "jsmith@corp.int",
            "badge_id": "BADGE-9941",
            "location": "Server Room B",
            "result": "ACCESS_GRANTED",
            "is_simulated": True,
            "simulation_tag": "DEMO_CASE_SIMULATION",
        },
    },
    {
        "step_index": 3,
        "time_str": "10:04",
        "timestamp_iso": "2026-08-21T10:04:00Z",
        "event_label": "USER_LOGIN",
        "event_type": EventType.AUTH_EVENT,
        "source": "SIMULATED_DOMAIN_CONTROLLER.evtx",
        "entity_type": "user_account",
        "entity_value": "jsmith@corp.int",
        "agent": "timeline_agent",
        "metadata": {
            "event_label": "USER_LOGIN",
            "user": "jsmith@corp.int",
            "device": "WKST-041",
            "ip": "10.0.4.15",
            "logon_type": "Interactive (2)",
            "status": "SUCCESS",
            "is_simulated": True,
            "simulation_tag": "DEMO_CASE_SIMULATION",
        },
    },
    {
        "step_index": 4,
        "time_str": "10:05",
        "timestamp_iso": "2026-08-21T10:05:00Z",
        "event_label": "USB_CONNECTED",
        "event_type": EventType.SYSTEM_METRIC,
        "source": "SIMULATED_ENDPOINT_SECURITY.json",
        "entity_type": "usb_device",
        "entity_value": "USBSTOR\\SanDisk_Cruzer",
        "agent": "evidence_agent",
        "metadata": {
            "event_label": "USB_CONNECTED",
            "device": "WKST-041",
            "usb": "USBSTOR\\SanDisk_Cruzer",
            "serial": "4C530001",
            "drive_letter": "E:",
            "vendor_id": "0781",
            "is_simulated": True,
            "simulation_tag": "DEMO_CASE_SIMULATION",
        },
    },
    {
        "step_index": 5,
        "time_str": "10:07",
        "timestamp_iso": "2026-08-21T10:07:00Z",
        "event_label": "FILE_ACCESSED",
        "event_type": EventType.FILE_OPERATION,
        "source": "SIMULATED_FILE_AUDIT.json",
        "entity_type": "file",
        "entity_value": "q2_financial_forecast.xlsx",
        "agent": "correlation_agent",
        "metadata": {
            "event_label": "FILE_ACCESSED",
            "user": "jsmith@corp.int",
            "device": "WKST-041",
            "file": "q2_financial_forecast.xlsx",
            "action": "FileRead / Duplicated to E:\\",
            "size_bytes": 1420500,
            "is_simulated": True,
            "simulation_tag": "DEMO_CASE_SIMULATION",
        },
    },
    {
        "step_index": 6,
        "time_str": "10:09",
        "timestamp_iso": "2026-08-21T10:09:00Z",
        "event_label": "NETWORK_TRANSFER",
        "event_type": EventType.NETWORK_CONNECTION,
        "source": "SIMULATED_FIREWALL_TRAFFIC.csv",
        "entity_type": "ip_address",
        "entity_value": "185.220.101.47",
        "agent": "reasoning_agent",
        "metadata": {
            "event_label": "NETWORK_TRANSFER",
            "src_ip": "10.0.4.15",
            "dst_ip": "185.220.101.47",
            "device": "WKST-041",
            "user": "jsmith@corp.int",
            "dst_port": 443,
            "protocol": "TLSv1.3",
            "bytes_sent": 1422000,
            "is_simulated": True,
            "simulation_tag": "DEMO_CASE_SIMULATION",
        },
    },
]


class SimulationService:
    """
    Manages background simulation tasks and state transitions.
    """
    _active_tasks: Dict[int, asyncio.Task] = {}
    _simulation_states: Dict[int, Dict[str, Any]] = {}

    @classmethod
    def get_simulation_status(cls, case_id: int) -> SimulationStatusResponse:
        """Returns the current status of a running or completed simulation for a case."""
        st = cls._simulation_states.get(case_id, {})
        status_val = st.get("status", "idle")

        return SimulationStatusResponse(
            case_id=case_id,
            status=status_val,
            is_simulated=True,
            disclaimer=_SIMULATION_DISCLAIMER,
            events_generated=st.get("events_generated", 0),
            total_events=len(_SIMULATION_STEPS),
            current_step=st.get("current_step"),
            started_at=st.get("started_at"),
            completed_at=st.get("completed_at"),
            message=st.get("message", "Simulation is idle."),
        )

    @classmethod
    def start_simulation(
        cls,
        db: Session,
        case_id: int,
        req: SimulationStartRequest,
        current_user: User,
        client_ip: Optional[str] = None,
    ) -> SimulationStatusResponse:
        """
        Launches a controlled asynchronous simulation generating 6 progressive forensic events.
        """
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        # Cancel any existing simulation task
        if case_id in cls._active_tasks and not cls._active_tasks[case_id].done():
            cls._active_tasks[case_id].cancel()

        started_now = datetime.datetime.now(datetime.timezone.utc)
        cls._simulation_states[case_id] = {
            "status": "running",
            "started_at": started_now,
            "completed_at": None,
            "events_generated": 0,
            "current_step": "Initializing demonstration pipeline...",
            "message": "Simulation running.",
        }

        # Log audit record
        AuditService.log(
            db=db,
            action=AuditAction.CASE_UPDATED,
            resource_type=AuditResourceType.CASE,
            user_id=current_user.id,
            resource_id=str(case_id),
            details={
                "action": "simulation_started",
                "is_simulated": True,
                "step_delay_seconds": req.step_delay_seconds,
            },
            ip_address=client_ip,
            flush=True,
        )

        # Launch background asynchronous generator task
        try:
            loop = asyncio.get_running_loop()
            task = loop.create_task(
                cls._run_simulation_loop(
                    case_id=case_id,
                    user_id=current_user.id,
                    step_delay=req.step_delay_seconds,
                    auto_correlate=req.auto_correlate,
                    auto_reason=req.auto_reason,
                )
            )
            cls._active_tasks[case_id] = task
        except RuntimeError:
            task = asyncio.create_task(
                cls._run_simulation_loop(
                    case_id=case_id,
                    user_id=current_user.id,
                    step_delay=req.step_delay_seconds,
                    auto_correlate=req.auto_correlate,
                    auto_reason=req.auto_reason,
                )
            )
            cls._active_tasks[case_id] = task

        logger.info(f"[SimulationService] Demonstration event generator started for Case #{case_id}.")

        return SimulationStatusResponse(
            case_id=case_id,
            status="running",
            is_simulated=True,
            disclaimer=_SIMULATION_DISCLAIMER,
            events_generated=0,
            total_events=len(_SIMULATION_STEPS),
            current_step="10:02 CCTV_EVENT",
            started_at=started_now,
            message="Demonstration simulation sequence initiated.",
        )

    @classmethod
    def stop_simulation(
        cls,
        db: Session,
        case_id: int,
        current_user: User,
        client_ip: Optional[str] = None,
    ) -> SimulationStatusResponse:
        """
        Gracefully stops and cancels a running simulation for a case.
        """
        if case_id in cls._active_tasks and not cls._active_tasks[case_id].done():
            cls._active_tasks[case_id].cancel()
            cls._active_tasks.pop(case_id, None)

        now_utc = datetime.datetime.now(datetime.timezone.utc)
        if case_id in cls._simulation_states:
            cls._simulation_states[case_id]["status"] = "stopped"
            cls._simulation_states[case_id]["completed_at"] = now_utc
            cls._simulation_states[case_id]["message"] = "Simulation stopped by investigator."

        # Broadcast WebSocket update
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(
                ws_manager.broadcast_to_case(
                    case_id=case_id,
                    event_type="simulation_stopped",
                    data={
                        "case_id": case_id,
                        "is_simulated": True,
                        "disclaimer": _SIMULATION_DISCLAIMER,
                        "message": "Simulation halted by user.",
                    },
                )
            )
        except Exception:
            pass

        AuditService.log(
            db=db,
            action=AuditAction.CASE_UPDATED,
            resource_type=AuditResourceType.CASE,
            user_id=current_user.id,
            resource_id=str(case_id),
            details={"action": "simulation_stopped", "is_simulated": True},
            ip_address=client_ip,
            flush=True,
        )

        return cls.get_simulation_status(case_id)

    @classmethod
    async def _run_simulation_loop(
        cls,
        case_id: int,
        user_id: int,
        step_delay: float,
        auto_correlate: bool,
        auto_reason: bool,
    ):
        """
        Asynchronous simulation worker: Sequentially registers events into DB,
        emits real-time WebSocket events, updates timeline, and triggers correlation/reasoning agents.
        """
        db: Session = SessionLocal()
        try:
            user = db.scalars(select(User).where(User.id == user_id)).first()

            # 1. Ensure a simulated evidence container exists
            sim_evidence = db.scalars(
                select(Evidence).where(
                    Evidence.case_id == case_id,
                    Evidence.original_filename == "SIMULATED_DEMO_CONTAINER.json",
                )
            ).first()

            if not sim_evidence:
                sim_evidence = Evidence(
                    case_id=case_id,
                    evidence_number=f"SIM-EVD-{case_id}-001",
                    original_filename="SIMULATED_DEMO_CONTAINER.json",
                    stored_filename=f"sim_{case_id}_container.json",
                    storage_path=f"simulated/cases/{case_id}/container.json",
                    file_size=1024,
                    mime_type="application/json",
                    sha256_hash="0000simulated0000demonstration0000sha256hash0000",
                    uploaded_by=user_id,
                    processing_status=ProcessingStatus.COMPLETED,
                    integrity_status=IntegrityStatus.VERIFIED,
                )
                db.add(sim_evidence)
                db.commit()
                db.refresh(sim_evidence)

            # Broadcast Simulation Started
            await ws_manager.broadcast_to_case(
                case_id=case_id,
                event_type="simulation_started",
                data={
                    "case_id": case_id,
                    "is_simulated": True,
                    "disclaimer": _SIMULATION_DISCLAIMER,
                    "total_steps": len(_SIMULATION_STEPS),
                },
            )

            # Initial Agent Status Broadcast
            await ws_manager.broadcast_to_case(
                case_id=case_id,
                event_type=InvestigationWebSocketEvent.AGENT_STATUS_UPDATED.value,
                data={
                    "agent": "chief_agent",
                    "status": "running",
                    "message": "Orchestrating live demonstration event ingestion stream.",
                    "is_simulated": True,
                },
            )

            # 2. Iterate through the 6 progressive events
            for step in _SIMULATION_STEPS:
                step_idx = step["step_index"]
                time_label = step["time_str"]
                event_lbl = step["event_label"]
                agent_name = step["agent"]

                cls._simulation_states[case_id]["current_step"] = f"{time_label} {event_lbl}"
                cls._simulation_states[case_id]["events_generated"] = step_idx

                # Agent status change
                await ws_manager.broadcast_to_case(
                    case_id=case_id,
                    event_type=InvestigationWebSocketEvent.AGENT_STATUS_UPDATED.value,
                    data={
                        "agent": agent_name,
                        "status": "processing",
                        "current_step": f"{time_label} {event_lbl}",
                        "is_simulated": True,
                    },
                )

                # Persist InvestigationEvent in DB
                dt = datetime.datetime.fromisoformat(step["timestamp_iso"].replace("Z", "+00:00"))
                inv_event = InvestigationEvent(
                    case_id=case_id,
                    evidence_id=sim_evidence.id,
                    event_type=step["event_type"],
                    timestamp=dt,
                    source=step["source"],
                    entity_type=step["entity_type"],
                    entity_value=step["entity_value"],
                    metadata=json.dumps(step["metadata"]),
                )
                db.add(inv_event)
                db.commit()
                db.refresh(inv_event)

                # Extract and persist Entity in DB
                EntityService.extract_entities_from_events(db=db, evidence_id=sim_evidence.id)

                # Broadcast live event to WebSocket
                await ws_manager.broadcast_to_case(
                    case_id=case_id,
                    event_type=InvestigationWebSocketEvent.NEW_INVESTIGATION_EVENT.value,
                    data={
                        "id": inv_event.id,
                        "case_id": case_id,
                        "event_label": event_lbl,
                        "time_str": time_label,
                        "timestamp": inv_event.timestamp.isoformat(),
                        "event_type": inv_event.event_type.value,
                        "source": inv_event.source,
                        "entity_type": inv_event.entity_type,
                        "entity_value": inv_event.entity_value,
                        "metadata": step["metadata"],
                        "is_simulated": True,
                        "disclaimer": _SIMULATION_DISCLAIMER,
                    },
                )

                # Broadcast timeline update
                await ws_manager.broadcast_to_case(
                    case_id=case_id,
                    event_type=InvestigationWebSocketEvent.TIMELINE_UPDATED.value,
                    data={
                        "case_id": case_id,
                        "latest_event_id": inv_event.id,
                        "timestamp": inv_event.timestamp.isoformat(),
                        "events_count": step_idx,
                        "is_simulated": True,
                    },
                )

                # Wait configured step delay before next event
                await asyncio.sleep(step_delay)

            # 3. Post-Sequence Automation: Run Correlations & Reasoning
            if auto_correlate and user:
                await ws_manager.broadcast_to_case(
                    case_id=case_id,
                    event_type=InvestigationWebSocketEvent.AGENT_STATUS_UPDATED.value,
                    data={"agent": "correlation_agent", "status": "running", "message": "Analyzing multi-source correlation signals..."},
                )
                corr_res = CorrelationService.run_case_correlations(db=db, case_id=case_id, current_user=user)
                await ws_manager.broadcast_to_case(
                    case_id=case_id,
                    event_type=InvestigationWebSocketEvent.CORRELATION_DETECTED.value,
                    data={
                        "case_id": case_id,
                        "correlations_count": corr_res.correlations_found,
                        "is_simulated": True,
                    },
                )

            if auto_reason and user:
                await ws_manager.broadcast_to_case(
                    case_id=case_id,
                    event_type=InvestigationWebSocketEvent.AGENT_STATUS_UPDATED.value,
                    data={"agent": "reasoning_agent", "status": "running", "message": "Synthesizing forensic reasoning hypotheses..."},
                )
                reason_res = FindingService.run_case_reasoning(db=db, case_id=case_id, current_user=user)
                await ws_manager.broadcast_to_case(
                    case_id=case_id,
                    event_type=InvestigationWebSocketEvent.FINDING_CREATED.value,
                    data={
                        "case_id": case_id,
                        "findings_count": reason_res.findings_generated,
                        "is_simulated": True,
                    },
                )

            # 4. Final Completion
            completed_now = datetime.datetime.now(datetime.timezone.utc)
            cls._simulation_states[case_id] = {
                "status": "completed",
                "started_at": cls._simulation_states[case_id].get("started_at"),
                "completed_at": completed_now,
                "events_generated": len(_SIMULATION_STEPS),
                "current_step": "Sequence completed successfully.",
                "message": "All 6 demonstration events ingested and analyzed.",
            }

            await ws_manager.broadcast_to_case(
                case_id=case_id,
                event_type=InvestigationWebSocketEvent.AGENT_STATUS_UPDATED.value,
                data={"agent": "chief_agent", "status": "completed", "message": "Simulation sequence complete."},
            )
            await ws_manager.broadcast_to_case(
                case_id=case_id,
                event_type="simulation_completed",
                data={
                    "case_id": case_id,
                    "is_simulated": True,
                    "disclaimer": _SIMULATION_DISCLAIMER,
                    "events_generated": len(_SIMULATION_STEPS),
                    "completed_at": completed_now.isoformat(),
                },
            )

        except asyncio.CancelledError:
            logger.info(f"[SimulationService] Simulation for Case #{case_id} was cancelled.")
        except Exception as exc:
            logger.error(f"[SimulationService] Simulation error on Case #{case_id}: {exc}", exc_info=True)
            if case_id in cls._simulation_states:
                cls._simulation_states[case_id]["status"] = "error"
                cls._simulation_states[case_id]["message"] = f"Simulation failed: {str(exc)}"
        finally:
            db.close()
