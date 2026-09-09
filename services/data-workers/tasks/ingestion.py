from typing import Any, TypedDict


class IngestionResult(TypedDict):
    artefact_id: str
    content_hash: str
    status: str  # "captured" | "failed"


async def run(ctx: dict[str, Any], artefact_id: str) -> IngestionResult:
    """Ingestion workers (PDF section 5.2, stage 1 Capture / stage 2
    Pre-process orchestration).

    Contract: the only input is an object-storage artefact reference, never
    an in-memory blob — this is what makes every stage "safely re-runnable
    from its input artefact" (section 6) true by construction. On success,
    enqueues the `extraction.run` task with the same artefact_id.

    Not implemented in this scaffolding pass: no de-skew/de-noise/page-split
    or language detection is performed.
    """
    raise NotImplementedError("ingestion.run: capture/pre-process pipeline not implemented")
