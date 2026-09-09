from typing import Any, ClassVar

from arq import func
from arq.connections import RedisSettings

from app.config import settings
from tasks import canonicalisation, extraction, freshness_scheduler, ingestion, review_queue


async def startup(ctx: dict[str, Any]) -> None:
    pass


async def shutdown(ctx: dict[str, Any]) -> None:
    pass


class WorkerSettings:
    """Single Arq worker registering all five data-plane roles from PDF
    section 6 as task functions, not separate deployables — mirrors the
    "resist microservices" decision on the data-plane side too. Each is
    independently extractable later without changing its call contract.
    """

    # Every task module's entry point is named `run` (see tasks/*.py), so
    # each must be registered with an explicit, distinct job name here —
    # otherwise Arq would key all five off the same default name
    # (coroutine.__qualname__ collides at "run") and only one would ever be
    # reachable. Names match the "<module>.run" convention used elsewhere
    # (e.g. app/main.py's default enqueue task).
    functions: ClassVar = [
        func(ingestion.run, name="ingestion.run"),
        func(extraction.run, name="extraction.run"),
        func(canonicalisation.run, name="canonicalisation.run"),
        func(freshness_scheduler.run, name="freshness_scheduler.run"),
        func(review_queue.run, name="review_queue.run"),
    ]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
