from typing import Any, TypedDict


class IngestionResult(TypedDict):
    artefact_id: str
    content_hash: str
    status: str  # "captured" | "failed"


async def run(ctx: dict[str, Any], artefact_id: str, channel: str = "dine_in") -> IngestionResult:
    """Ingestion workers (PDF section 5.2, stage 1 Capture / stage 2
    Pre-process orchestration).

    Contract: the only required input is an object-storage artefact
    reference, never an in-memory blob — this is what makes every stage
    "safely re-runnable from its input artefact" (section 6) true by
    construction. `channel` is metadata attached at capture time (e.g.
    "this PDF is our dine-in menu") — apps/api's POST /internal/ingest
    already requires it; the actual per-item channel value Appendix B
    records comes from extraction reading the artefact itself, this is
    just what the uploader declared. On success, enqueues the
    `extraction.run` task with the same artefact_id.

    Not implemented in this scaffolding pass: no de-skew/de-noise/page-split
    or language detection is performed.
    """
    raise NotImplementedError("ingestion.run: capture/pre-process pipeline not implemented")
