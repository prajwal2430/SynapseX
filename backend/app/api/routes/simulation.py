"""
Simulation Event Generator Routes for ADEIP.
Provides endpoints for starting, stopping, and monitoring simulated demonstration investigations.

CRITICAL REQUIREMENT:
All responses and event streams are strictly labeled as demonstration/simulated data.
Never presented as real police data.
"""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_active_user
from app.api.dependencies.database import get_db
from app.models.user import User
from app.schemas.simulation import (
    SimulationStartRequest,
    SimulationStatusResponse,
)
from app.services.simulation_service import SimulationService

router = APIRouter(prefix="/cases", tags=["Investigation Simulation Generator (Demo Only)"])


@router.post(
    "/{case_id}/simulation/start",
    response_model=SimulationStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Start controlled simulated investigation event sequence (Demonstration Only)",
)
async def start_case_simulation(
    case_id: int,
    req: SimulationStartRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Launches a controlled demonstration simulation that generates 6 progressive forensic events:
    - **10:02 CCTV_EVENT**: Physical access approach at Server Room B
    - **10:03 ACCESS_EVENT**: Badge scan at Server Room B
    - **10:04 USER_LOGIN**: Interactive logon on workstation WKST-041
    - **10:05 USB_CONNECTED**: Mass storage device inserted into WKST-041
    - **10:07 FILE_ACCESSED**: Sensitive document read/duplicated
    - **10:09 NETWORK_TRANSFER**: Outbound TCP traffic to external destination IP

    **Requirements:**
    1. Simulation is strictly labeled as demo/simulated data across all metadata.
    2. Events pass through standard event & entity extraction tables.
    3. Emits live WebSocket event notifications (`new_investigation_event`, `timeline_updated`, `agent_status_updated`).
    4. Triggers correlation analysis and reasoning upon completion.
    """
    client_ip = request.client.host if request.client else None
    return SimulationService.start_simulation(
        db=db,
        case_id=case_id,
        req=req,
        current_user=current_user,
        client_ip=client_ip,
    )


@router.post(
    "/{case_id}/simulation/stop",
    response_model=SimulationStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Stop and cancel a running demonstration simulation",
)
async def stop_case_simulation(
    case_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Halts and cancels the active demonstration event sequence for the case.
    """
    client_ip = request.client.host if request.client else None
    return SimulationService.stop_simulation(
        db=db,
        case_id=case_id,
        current_user=current_user,
        client_ip=client_ip,
    )


@router.get(
    "/{case_id}/simulation/status",
    response_model=SimulationStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get the current status of the demonstration simulation",
)
def get_case_simulation_status(
    case_id: int,
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves the execution progress and state of the case simulation.
    """
    return SimulationService.get_simulation_status(case_id=case_id)
