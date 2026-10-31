import logging
import os
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("adeip.database")

def _build_engine(db_url: str):
    """
    Constructs an appropriate SQLAlchemy engine depending on whether
    the database is SQLite or PostgreSQL.

    SQLite optimizations applied:
      - WAL journal mode: allows concurrent reads + one writer (no "database is locked")
      - busy_timeout 5000ms: wait up to 5s before raising locked error
      - synchronous=NORMAL: safe balance of durability vs speed
      - check_same_thread=False: required for FastAPI thread-per-request model
    """
    if db_url.startswith("sqlite"):
        def _sqlite_connect():
            import sqlite3
            conn = sqlite3.connect(
                db_url.replace("sqlite:///", "", 1),
                check_same_thread=False,
                timeout=5,
            )
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA busy_timeout=5000;")
            conn.execute("PRAGMA synchronous=NORMAL;")
            conn.execute("PRAGMA cache_size=-64000;")   # 64 MB page cache
            conn.execute("PRAGMA temp_store=MEMORY;")
            return conn

        return create_engine(
            db_url,
            creator=_sqlite_connect,
            connect_args={"check_same_thread": False},
            pool_size=5,
            max_overflow=10,
            pool_timeout=10,
            pool_pre_ping=True,
            echo=settings.DEBUG and settings.APP_ENV == "development",
        )
    return create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=settings.DEBUG and settings.APP_ENV == "development",
    )

# Try configured database; if connection fails during initial test, fallback to SQLite
active_db_url = settings.DATABASE_URL
engine = _build_engine(active_db_url)

# Test connection; if failed and not already SQLite, fallback to local SQLite
try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info(f"[Database] Primary database connected successfully: {active_db_url.split('@')[-1] if '@' in active_db_url else active_db_url}")
except Exception as primary_exc:
    if not active_db_url.startswith("sqlite"):
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        db_path = os.path.join(backend_dir, "adeip.db")
        fallback_url = f"sqlite:///{db_path.replace(os.sep, '/')}"
        logger.warning(
            f"[Database] Primary database connection failed ({primary_exc}). "
            f"Falling back to local SQLite engine ({fallback_url})."
        )
        active_db_url = fallback_url
        engine = _build_engine(active_db_url)
    else:
        logger.error(f"[Database] SQLite initialization error: {primary_exc}")

# Factory for creating thread-local database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a transactional database session per request.
    Ensures the session is cleanly closed even if exceptions occur.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_health() -> dict:
    """
    Executes a lightweight query (SELECT 1) to verify database connectivity.
    Returns status dictionary for health check endpoints.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_type = "SQLite" if active_db_url.startswith("sqlite") else "PostgreSQL"
        return {"status": "connected", "database": db_type}
    except Exception as exc:
        logger.warning(f"Database health check failed: {exc}")
        db_type = "SQLite" if active_db_url.startswith("sqlite") else "PostgreSQL"
        return {
            "status": "disconnected",
            "database": db_type,
            "error": str(exc) if settings.DEBUG else "Connection failed",
        }
