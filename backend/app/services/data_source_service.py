import datetime
import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.case import InvestigationCase
from app.models.data_source import DataSource, SourceStatus, SourceType
from app.models.user import User, UserRole
from app.schemas.data_source import (
    DataSourceCreateRequest,
    DataSourceResponse,
    DataSourceUpdateRequest,
)

logger = logging.getLogger("adeip.services.data_source")


class DataSourceService:
    """Service managing authorized digital data sources connected to cases."""

    @staticmethod
    def _mask_sensitive_config(config_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Masks API keys, passwords, credentials, tokens, and stream secrets from being returned to frontend."""
        safe = {}
        sensitive_keys = {"password", "secret", "token", "key", "api_key", "auth", "credential", "private"}
        for k, v in config_dict.items():
            k_lower = str(k).lower()
            if any(s in k_lower for s in sensitive_keys):
                safe[k] = "********"
            elif isinstance(v, str) and "@" in v and "://" in v:
                # Mask credentials embedded in URLs like rtsp://user:pass@host
                proto = v.split("://")[0]
                host_part = v.split("@")[-1]
                safe[k] = f"{proto}://***:***@{host_part}"
            else:
                safe[k] = v
        return safe

    @classmethod
    def _to_response(cls, ds: DataSource) -> DataSourceResponse:
        cfg = {}
        if ds.configuration:
            try:
                cfg = json.loads(ds.configuration) if isinstance(ds.configuration, str) else ds.configuration
            except Exception:
                cfg = {}
        safe_cfg = cls._mask_sensitive_config(cfg)

        return DataSourceResponse(
            id=ds.id,
            case_id=ds.case_id,
            source_name=ds.source_name,
            source_type=ds.source_type,
            status=ds.status,
            configuration_summary=safe_cfg,
            last_seen_at=ds.last_seen_at,
            created_at=ds.created_at,
        )

    @classmethod
    def create_source(
        cls,
        db: Session,
        case_id: int,
        req: DataSourceCreateRequest,
        current_user: User,
    ) -> DataSourceResponse:
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        config_str = json.dumps(req.configuration or {})
        ds = DataSource(
            case_id=case_id,
            source_name=req.source_name.strip(),
            source_type=req.source_type,
            configuration=config_str,
            status=SourceStatus.ACTIVE if req.enabled else SourceStatus.INACTIVE,
            last_seen_at=datetime.datetime.now(datetime.timezone.utc),
        )
        db.add(ds)
        db.commit()
        db.refresh(ds)
        return cls._to_response(ds)

    @classmethod
    def list_sources_for_case(
        cls,
        db: Session,
        case_id: int,
        current_user: User,
    ) -> List[DataSourceResponse]:
        sources = list(
            db.scalars(
                select(DataSource)
                .where(DataSource.case_id == case_id)
                .order_by(DataSource.created_at.desc())
            ).all()
        )
        return [cls._to_response(s) for s in sources]

    @classmethod
    def update_source(
        cls,
        db: Session,
        source_id: int,
        req: DataSourceUpdateRequest,
        current_user: User,
    ) -> DataSourceResponse:
        ds = db.scalars(select(DataSource).where(DataSource.id == source_id)).first()
        if not ds:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Data source #{source_id} not found.",
            )

        if req.source_name:
            ds.source_name = req.source_name.strip()
        if req.status:
            ds.status = req.status
        if req.configuration is not None:
            ds.configuration = json.dumps(req.configuration)

        db.commit()
        db.refresh(ds)
        return cls._to_response(ds)

    @classmethod
    def delete_source(
        cls,
        db: Session,
        source_id: int,
        current_user: User,
    ) -> None:
        ds = db.scalars(select(DataSource).where(DataSource.id == source_id)).first()
        if not ds:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Data source #{source_id} not found.",
            )
        db.delete(ds)
        db.commit()
