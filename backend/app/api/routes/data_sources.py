"""
Data Source Management API Routes for ADEIP.
Provides endpoints for registering, listing, updating, and deleting authorized case data sources.
"""
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_active_user
from app.api.dependencies.database import get_db
from app.models.data_source import SourceType
from app.models.user import User
from app.schemas.data_source import (
    DataSourceCreateRequest,
    DataSourceListResponse,
    DataSourceResponse,
    DataSourceUpdateRequest,
)
from app.services.data_source_service import DataSourceService

case_sources_router = APIRouter(prefix="/cases", tags=["Case Data Sources"])
direct_sources_router = APIRouter(prefix="/sources", tags=["Data Source Governance"])


@case_sources_router.post(
    "/{case_id}/sources",
    response_model=DataSourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register an authorized data source to an investigation case",
)
def create_case_data_source(
    case_id: int,
    req: DataSourceCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Registers an authorized evidence source (e.g. system log connector, CCTV stream, network log, API webhook).
    Credentials are encrypted and masked in API outputs.
    """
    return DataSourceService.create_source(db=db, case_id=case_id, req=req, current_user=current_user)


@case_sources_router.post(
    "/{case_id}/sources/cctv",
    response_model=DataSourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register an authorized CCTV / RTSP video stream source (Phase 4)",
)
def register_cctv_source(
    case_id: int,
    cctv_in: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Registers an authorized RTSP/CCTV camera stream connector for continuous or scheduled frame inspection.
    """
    source_name = cctv_in.get("source_name", "Authorized CCTV Camera")
    req = DataSourceCreateRequest(
        source_name=source_name,
        source_type=SourceType.CCTV_STREAM,
        configuration=cctv_in,
        enabled=cctv_in.get("enabled", True),
    )
    return DataSourceService.create_source(db=db, case_id=case_id, req=req, current_user=current_user)


@case_sources_router.get(
    "/{case_id}/sources",
    response_model=DataSourceListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all authorized data sources configured for a case",
)
def list_case_data_sources(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns configured data sources with safe masked configuration properties.
    """
    items = DataSourceService.list_sources_for_case(db=db, case_id=case_id, current_user=current_user)
    return DataSourceListResponse(items=items, total=len(items))


@direct_sources_router.patch(
    "/{source_id}",
    response_model=DataSourceResponse,
    status_code=status.HTTP_200_OK,
    summary="Update data source configuration or status",
)
def update_data_source(
    source_id: int,
    req: DataSourceUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Updates the operational status or connection parameters for a registered data source.
    """
    return DataSourceService.update_source(db=db, source_id=source_id, req=req, current_user=current_user)


@direct_sources_router.delete(
    "/{source_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete / disconnect an authorized data source",
)
def delete_data_source(
    source_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Removes a data source registration from the platform.
    """
    DataSourceService.delete_source(db=db, source_id=source_id, current_user=current_user)
    return None
