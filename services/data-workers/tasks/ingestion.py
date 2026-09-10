import hashlib
from typing import Any, TypedDict

from app.storage import get_object_bytes


class IngestionResult(TypedDict):
    artefact_id: str
    content_hash: str
    status: str  # "captured" | "failed"


async def run(ctx: dict[str, Any], artefact_id: str, branch_id: str, channel: str = "dine_in") -> IngestionResult:
    """Ingestion workers (PDF section 5.2, stage 1 Capture / stage 2
    Pre-process orchestration).

    Contract: the only required input is an object-storage artefact
    reference, never an in-memory blob — this is what makes every stage
    "safely re-runnable from its input artefact" (section 6) true by
    construction. `branch_id`/`channel` are metadata attached at capture
    time (e.g. "this PDF is our dine-in menu for branch X") — apps/api's
    POST /internal/ingest already requires both.

    What's real here: the artefact is actually fetched from object storage
    (proving it exists and is readable) and content-hashed for provenance,
    then extraction.run is handed off with that hash. What's NOT
    implemented: no de-skew/de-noise/page-split or language detection — a
    real image pre-processing pipeline, not a ranking-formula-sized gap.
    """
    data = await get_object_bytes(artefact_id)
    content_hash = f"sha256:{hashlib.sha256(data).hexdigest()}"

    redis = ctx["redis"]
    await redis.enqueue_job("extraction.run", artefact_id, branch_id, channel, content_hash)

    return {"artefact_id": artefact_id, "content_hash": content_hash, "status": "captured"}
