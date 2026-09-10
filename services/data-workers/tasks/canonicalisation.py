import math
import re
from typing import Any, TypedDict

from rapidfuzz import fuzz

from app.db import get_pool
from app.embeddings import embed

# PDF section 5.3 confidence banding.
AUTO_MAP_THRESHOLD = 0.90
REVIEW_THRESHOLD = 0.70

# Weighted average of the two hybrid-matching signals (semantic + lexical).
# A plain 50/50 split is the defensible v1 default or plausible against
# spelling/transliteration variants — this is exactly the kind of constant
# the plan's "feedback loop... re-tune thresholds each cycle" (5.3) is meant
# to adjust once real reviewer-decision data exists to tune against.
SEMANTIC_WEIGHT = 0.5
LEXICAL_WEIGHT = 0.5

_SIZE_WORDS = {"small", "medium", "regular", "large", "xl", "extra large"}


class CanonicalisationResult(TypedDict):
    menu_item_id: str
    canonical_dish_id: str | None
    confidence: float
    review_state: str  # "auto_mapped" | "pending_review"


def _detect_size_variant(name: str) -> dict[str, str]:
    """Crude keyword heuristic for the "variant modelling" requirement
    (5.3: "size, protein and preparation are attributes on the mapping, not
    separate canonical dishes"). Only size is detected here — protein/prep
    detection needs a curated per-cuisine keyword list to avoid false
    positives and is a documented gap, not implemented in this pass."""
    lowered = name.lower()
    for word in _SIZE_WORDS:
        if re.search(rf"\b{re.escape(word)}\b", lowered):
            return {"size": word}
    return {}


def _lexical_score(menu_item_name: str, canonical_name: str, aliases: list[str]) -> float:
    """Best fuzzy match against the canonical name or any of its aliases,
    normalised to 0-1. Catches near-exact spelling/transliteration variants
    (e.g. "Shawarma Djaj") that the alias list already records explicitly —
    exactly the case embeddings alone are weakest on."""
    candidates = [canonical_name, *aliases]
    return max(fuzz.WRatio(menu_item_name, c) / 100.0 for c in candidates)


async def run(ctx: dict[str, Any], menu_item_id: str) -> CanonicalisationResult:
    """Canonicalisation service (PDF section 5.2 stage 6; section 5.3
    approach: hybrid multilingual-embedding + lexical/fuzzy matching against
    the canonical_dish taxonomy).

    Prerequisite: canonical_dish rows need an embedding already computed
    (scripts/embed_taxonomy.py) — this task does not compute the taxonomy
    side's embeddings itself, to keep "embed the taxonomy" and "match one
    menu item" independently re-runnable (section 6's re-runnability
    principle) rather than silently re-embedding inline on every call.

    Contract: input is a menu_item_id (not the raw extracted text) — the
    menu_item row must already exist (written by the extraction stage).
    Upserts a dish_mapping row and returns it; never raises for "no good
    match" (that's the <0.70 band, canonical_dish_id null), only for
    missing input data.
    """
    pool = await get_pool()

    item = await pool.fetchrow("SELECT id, name FROM menu_item WHERE id = $1", menu_item_id)
    if item is None:
        raise ValueError(f"menu_item {menu_item_id} does not exist")

    candidates = await pool.fetch(
        "SELECT id, canonical_name, aliases, embedding FROM canonical_dish WHERE embedding IS NOT NULL"
    )
    if not candidates:
        raise RuntimeError(
            "No canonical_dish rows have an embedding yet - run scripts/embed_taxonomy.py first."
        )

    [item_embedding] = embed([item["name"]])

    best_candidate = None
    best_score = -1.0
    for candidate in candidates:
        semantic = _cosine_similarity(item_embedding, candidate["embedding"].to_list())
        lexical = _lexical_score(item["name"], candidate["canonical_name"], list(candidate["aliases"]))
        combined = SEMANTIC_WEIGHT * semantic + LEXICAL_WEIGHT * lexical
        if combined > best_score:
            best_score = combined
            best_candidate = candidate

    assert best_candidate is not None  # candidates is non-empty, loop always assigns

    if best_score >= AUTO_MAP_THRESHOLD:
        canonical_dish_id, review_state = best_candidate["id"], "auto_mapped"
    elif best_score >= REVIEW_THRESHOLD:
        canonical_dish_id, review_state = best_candidate["id"], "pending_review"
    else:
        # No confident existing match - needs a reviewer to curate a new
        # canonical dish, not a forced mapping to a weak best guess.
        canonical_dish_id, review_state = None, "pending_review"

    variant_attrs = _detect_size_variant(item["name"])

    await pool.execute(
        """
        INSERT INTO dish_mapping (menu_item_id, canonical_dish_id, confidence, variant_attrs, review_state)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (menu_item_id) DO UPDATE SET
            canonical_dish_id = EXCLUDED.canonical_dish_id,
            confidence = EXCLUDED.confidence,
            variant_attrs = EXCLUDED.variant_attrs,
            review_state = EXCLUDED.review_state
        """,
        menu_item_id,
        canonical_dish_id,
        best_score,
        variant_attrs,
        review_state,
    )

    return {
        "menu_item_id": menu_item_id,
        "canonical_dish_id": str(canonical_dish_id) if canonical_dish_id else None,
        "confidence": best_score,
        "review_state": review_state,
    }


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = float(sum(x * y for x, y in zip(a, b, strict=True)))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))
