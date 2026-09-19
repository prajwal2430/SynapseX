import logging
import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("adeip.config")


class Settings(BaseSettings):
    """
    Centralized application configuration using Pydantic Settings.
    Loads values from environment variables or .env file.
    """
    PROJECT_NAME: str = "ADEIP — AI-Assisted Digital Evidence Intelligence Platform"
    VERSION: str = "0.1.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Trusted Hosts (Host header injection prevention)
    ALLOWED_HOSTS: Union[List[str], str] = [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "testserver",
        "*.localhost",
    ]

    # Allowed CORS Origins for Frontend Integration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # PostgreSQL Database URL
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/adeip_db"

    # MongoDB Configuration (Async via Motor)
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "adeip_db"

    # JWT Authentication Settings
    JWT_SECRET_KEY: str = "adeip-development-insecure-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Rate Limiting Settings
    RATE_LIMIT_ENABLED: bool = True
    DEFAULT_RATE_LIMIT_PER_MINUTE: int = 120
    AUTH_RATE_LIMIT_PER_MINUTE: int = 10
    REPORT_GEN_RATE_LIMIT_PER_MINUTE: int = 15

    # Security Headers Settings
    SECURITY_HEADERS_ENABLED: bool = True

    # Evidence Vault & Storage Settings
    UPLOAD_STORAGE_DIR: str = "storage/evidence_vault"
    MAX_UPLOAD_SIZE_BYTES: int = 100 * 1024 * 1024  # 100 MB default max file size
    ALLOWED_EVIDENCE_EXTENSIONS: List[str] = [
        # Documents & Forensic Reports
        ".pdf", ".docx", ".doc", ".rtf", ".txt", ".odt",
        # Structured Data & Logs
        ".csv", ".tsv", ".json", ".xml", ".yaml", ".yml", ".sql", ".evtx", ".log", ".audit",
        # Network & Memory & Disk Artifacts
        ".pcap", ".pcapng", ".cap", ".raw", ".mem", ".dmp", ".vmem", ".e01", ".dd",
        # Images
        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff", ".svg",
        # Audio Evidence
        ".mp3", ".wav", ".aac", ".ogg", ".m4a", ".flac", ".wma",
        # Video Evidence
        ".mp4", ".avi", ".mkv", ".mov", ".webm", ".m4v", ".wmv",
        # Archives
        ".zip", ".tar", ".gz", ".7z",
    ]

    # Dangerous extensions explicitly blocked from evidence ingestion
    BLOCKED_EXTENSIONS: List[str] = [
        ".exe", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".js", ".php", ".py", ".msi", ".dll", ".so", ".bin"
    ]

    # Redis — broker and result backend for Celery background task workers
    REDIS_URL: str = "redis://localhost:6379/0"

    # Neo4j Graph Database — Relationship Exploration & Knowledge Graph
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                import json
                try:
                    return json.loads(v_trimmed)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [item.strip() for item in v if item.strip()]
        return []

    @field_validator("ALLOWED_HOSTS", mode="before")
    @classmethod
    def assemble_allowed_hosts(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                import json
                try:
                    return json.loads(v_trimmed)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [item.strip() for item in v if item.strip()]
        return ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

# Security warning on startup for default JWT secret in production
if settings.APP_ENV == "production" and "insecure" in settings.JWT_SECRET_KEY:
    logger.critical("SECURITY ALERT: Using default insecure JWT_SECRET_KEY in production! Set JWT_SECRET_KEY environment variable immediately.")
