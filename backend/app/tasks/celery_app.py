"""
Celery application factory for ADEIP background task processing.

Configuration is loaded from environment variables via app.core.config.settings.
Redis is used as both the broker and result backend.

Usage:
    Start worker:
        celery -A app.tasks.celery_app worker --loglevel=info --concurrency=4

    Start flower (optional monitoring UI):
        celery -A app.tasks.celery_app flower --port=5555
"""
from celery import Celery  # type: ignore # pyrefly: ignore
from app.core.config import settings


def create_celery_app() -> Celery:
    """
    Construct and configure the Celery application.
    Called once at import time — returns a singleton-like instance.
    """
    celery = Celery(
        "adeip_worker",
        broker=settings.REDIS_URL,
        backend=settings.REDIS_URL,
        include=["app.tasks.evidence_tasks"],
    )

    celery.conf.update(
        # Serialization
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],

        # Timezone
        timezone="UTC",
        enable_utc=True,

        # Reliability
        task_acks_late=True,           # Acknowledge only after task completes (safer for forensic work)
        task_reject_on_worker_lost=True,  # Re-queue if worker dies mid-task
        worker_prefetch_multiplier=1,  # Process one task at a time per worker (prevents starvation)

        # Result expiry — keep job state for 7 days in Redis
        result_expires=60 * 60 * 24 * 7,

        # Routing: all ADEIP tasks go to the default evidence queue
        task_default_queue="adeip_evidence",

        # Fast broker timeout to prevent HTTP requests from hanging if broker is unavailable
        broker_connection_timeout=0.5,
        broker_connection_retry_on_startup=False,
        broker_connection_max_retries=0,

        # Retry defaults
        task_max_retries=3,
        task_default_retry_delay=30,  # seconds between retries
    )

    return celery


# Module-level Celery app instance — imported by tasks and the FastAPI app
celery_app = create_celery_app()
