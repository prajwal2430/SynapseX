"""
AI Service Configuration Module.
Loads environment variables using Pydantic Settings.
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application settings
    APP_NAME: str = "SynapseX AI Service"
    APP_ENV: str = "development"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    ALLOWED_ORIGINS: str = "http://localhost:3001,http://localhost:3000"

    # Internal service authentication
    API_SECRET_KEY: str = "your-internal-service-secret-key"
    INTERNAL_SERVICE_KEY: str = "your-internal-service-secret-key"

    # Neo4j Graph Database
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "synapsex_neo4j_password"

    # MongoDB Context Access
    MONGODB_URI: str = "mongodb://synapsex_user:synapsex_password@localhost:27017/synapsex?authSource=admin"
    MONGODB_DATABASE: str = "synapsex"

    # Redis Cache / LangGraph Checkpointer
    REDIS_URL: str = "redis://localhost:6379/0"

    # LLM Settings
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    PRIMARY_LLM_MODEL: str = "gpt-4o"
    FAST_LLM_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
