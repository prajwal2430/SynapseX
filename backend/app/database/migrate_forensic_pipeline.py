"""
Database migration utility for ADEIP forensic pipeline.
Non-destructively adds case_type, opened_date, classification, related_entities,
and resolution_status columns to existing SQLite/Postgres tables.
"""
import logging
from sqlalchemy import inspect, text
from app.database.session import engine

logger = logging.getLogger("adeip.migration.pipeline")


def migrate_forensic_pipeline_columns() -> None:
    """Safely adds new forensic pipeline columns if they do not exist."""
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        # 1. Migrate investigation_cases
        if "investigation_cases" in table_names:
            case_cols = {col["name"] for col in inspector.get_columns("investigation_cases")}
            with engine.begin() as conn:
                if "case_type" not in case_cols:
                    conn.execute(text("ALTER TABLE investigation_cases ADD COLUMN case_type VARCHAR(128) DEFAULT 'Cybercrime'"))
                    logger.info("Added 'case_type' column to investigation_cases")
                if "opened_date" not in case_cols:
                    conn.execute(text("ALTER TABLE investigation_cases ADD COLUMN opened_date DATETIME"))
                    logger.info("Added 'opened_date' column to investigation_cases")

        # 2. Migrate investigation_findings
        if "investigation_findings" in table_names:
            finding_cols = {col["name"] for col in inspector.get_columns("investigation_findings")}
            with engine.begin() as conn:
                if "classification" not in finding_cols:
                    conn.execute(text("ALTER TABLE investigation_findings ADD COLUMN classification VARCHAR(32) DEFAULT 'INFERENCE'"))
                    logger.info("Added 'classification' column to investigation_findings")
                if "related_entities" not in finding_cols:
                    conn.execute(text("ALTER TABLE investigation_findings ADD COLUMN related_entities TEXT"))
                    logger.info("Added 'related_entities' column to investigation_findings")

        # 3. Migrate extracted_entities
        if "extracted_entities" in table_names:
            entity_cols = {col["name"] for col in inspector.get_columns("extracted_entities")}
            with engine.begin() as conn:
                if "resolution_status" not in entity_cols:
                    conn.execute(text("ALTER TABLE extracted_entities ADD COLUMN resolution_status VARCHAR(32) DEFAULT 'unresolved'"))
                    logger.info("Added 'resolution_status' column to extracted_entities")

    except Exception as exc:
        logger.warning(f"Forensic pipeline schema migration skipped or encountered error: {exc}")
