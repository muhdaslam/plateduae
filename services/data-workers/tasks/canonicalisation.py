from typing import Any, TypedDict


class CanonicalisationResult(TypedDict):
    menu_item_id: str
    canonical_dish_id: str | None
    confidence: float
    review_state: str  # "auto_mapped" | "pending_review" | "confirmed" | "rejected"


async def run(ctx: dict[str, Any], menu_item_id: str) -> CanonicalisationResult:
    """Canonicalisation service (PDF section 5.2 stage 6; section 5.3
    approach: hybrid multilingual-embedding + lexical/fuzzy matching against
    the canonical_dish taxonomy).

    Contract: input is a menu_item_id (not the raw extracted text) — the
    menu_item row must already exist (written by the extraction stage) so
    this stage is independently re-runnable. Confidence banding per section
    5.3: >0.90 auto-map, 0.70-0.90 to review queue, <0.70 candidate new
    canonical dish for curation.

    Not implemented in this scaffolding pass: no embedding model or
    lexical/fuzzy matcher is wired up yet.
    """
    raise NotImplementedError("canonicalisation.run: hybrid matching not implemented")
