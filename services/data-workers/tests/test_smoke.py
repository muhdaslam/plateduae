"""Smoke test: confirms the package imports cleanly. Task-specific tests
land alongside real logic once each stage is implemented."""

from tasks import canonicalisation, extraction, freshness_scheduler, ingestion, review_queue


def test_task_modules_import() -> None:
    assert callable(ingestion.run)
    assert callable(extraction.run)
    assert callable(canonicalisation.run)
    assert callable(freshness_scheduler.run)
    assert callable(review_queue.run)
