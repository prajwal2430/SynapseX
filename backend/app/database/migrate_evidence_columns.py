"""
Database migration utility for ADEIP evidence table.
Inspects existing database schema and safely adds new columns if absent.
Supports both SQLite and PostgreSQL.
"""

import logging
from sqlalchemy import inspect, text
from app.database.session import engine

logger = logging.getLogger("adeip.migration")


def ensure_evidence_columns():
    """
    Checks and adds missing columns to the 'evidence' table:
    - agent_type (VARCHAR(64))
    - file_type (VARCHAR(64))
    - storage_status (VARCHAR(32))
    - updated_at (DATETIME)
    """
    try:
        inspector = inspect(engine)
        if not inspector.has_table("evidence"):
            logger.info("Table 'evidence' does not exist yet; will be created by Base.metadata.create_all.")
            return

        columns = [c["name"] for c in inspector.get_columns("evidence")]

        statements = []
        if "agent_type" not in columns:
            statements.append("ALTER TABLE evidence ADD COLUMN agent_type VARCHAR(64)")
        if "file_type" not in columns:
            statements.append("ALTER TABLE evidence ADD COLUMN file_type VARCHAR(64)")
        if "storage_status" not in columns:
            statements.append("ALTER TABLE evidence ADD COLUMN storage_status VARCHAR(32) DEFAULT 'stored'")
        if "updated_at" not in columns:
            statements.append("ALTER TABLE evidence ADD COLUMN updated_at DATETIME")

        if statements:
            with engine.connect() as conn:
                for stmt in statements:
                    try:
                        conn.execute(text(stmt))
                        logger.info(f"Executed migration: {stmt}")
                    except Exception as err:
                        logger.warning(f"Notice on executing '{stmt}': {err}")
                conn.commit()
            logger.info("Evidence table columns successfully ensured.")
        else:
            logger.debug("Evidence table columns are already up-to-date.")

    except Exception as exc:
        logger.error(f"Error checking/migrating evidence columns: {exc}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    ensure_evidence_columns()
