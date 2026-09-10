from datetime import UTC, datetime
from typing import Any

from rapidfuzz import fuzz

from app.db import get_pool
from app.file_utils import to_page_images
from app.storage import get_object_bytes
from app.vision_extraction import extract_menu

# Below this fuzzy-match score (0-100, rapidfuzz.fuzz.WRatio) between the
# model's venue_hint.name and the branch's actual restaurant name, flag a
# mismatch warning rather than silently trusting the hint. This is a
# sanity check on the *known* branch_id (required on every ingest request,
# see EnqueueIngestDto) — not a way to resolve an unknown venue from the
# hint, which would be a much harder fuzzy-venue-matching problem this
# pass doesn't attempt.
VENUE_HINT_MISMATCH_THRESHOLD = 50


async def run(
    ctx: dict[str, Any], artefact_id: str, branch_id: str, channel: str, content_hash: str
) -> dict[str, Any]:
    """LLM extraction service (PDF section 5.2, stages 3-5: Extract,
    Validate, Normalise).

    Contract: source and schema_version (Appendix B) are assembled here
    from values already known deterministically (artefact_id, content_hash
    from ingestion.run, capture time, channel) — the model only fills in
    venue_hint/sections/warnings/detected_languages (app/vision_extraction.py's
    PartialExtraction), since trusting an LLM to reproduce data the caller
    already has exactly (e.g. a content hash) is asking for silent drift.

    Writes menu + menu_item + price_observation rows directly (Validate/
    Normalise are folded into this pass rather than separate stages), then
    enqueues canonicalisation.run per created menu_item — completing the
    real pipeline: ingest -> extract -> canonicalise -> searchable (once a
    reviewer confirms anything landing in the 0.70-0.90 confidence band).

    Not implemented: OCR pre-pass (section 5.2's cost-optimisation ahead of
    the vision-LLM call — the vision model reads text directly, which is
    correctness-equivalent and cheaper to build, just not the lowest
    possible per-menu token cost at scale) and de-skew/rotation correction.
    """
    pool = await get_pool()

    branch = await pool.fetchrow(
        "SELECT r.brand_name FROM branch b JOIN restaurant r ON r.id = b.restaurant_id WHERE b.id = $1",
        branch_id,
    )
    if branch is None:
        raise ValueError(f"branch {branch_id} does not exist")

    artefact_bytes = await get_object_bytes(artefact_id)
    page_images = to_page_images(artefact_bytes)

    partial = await extract_menu(page_images)

    warnings = list(partial.warnings)
    hint_score = fuzz.WRatio(partial.venue_hint.name, branch["brand_name"])
    if hint_score < VENUE_HINT_MISMATCH_THRESHOLD:
        warnings.append(
            f"venue_hint.name {partial.venue_hint.name!r} doesn't closely match "
            f"branch {branch_id}'s restaurant name {branch['brand_name']!r} (score={hint_score}) — "
            "wrong branch_id on the ingest request?"
        )

    existing_version = await pool.fetchval(
        "SELECT MAX(version) FROM menu WHERE branch_id = $1 AND channel = $2", branch_id, channel
    )
    version = (existing_version or 0) + 1
    language = partial.detected_languages[0] if partial.detected_languages else "en"

    menu_row = await pool.fetchrow(
        """
        INSERT INTO menu (branch_id, channel, version, source_artefact_id, language, published_at)
        VALUES ($1, $2, $3, $4, $5, now())
        RETURNING id
        """,
        branch_id,
        channel,
        version,
        artefact_id,
        language,
    )
    menu_id = menu_row["id"]
    captured_at = datetime.now(UTC).isoformat()

    menu_item_ids: list[str] = []
    for section in partial.sections:
        for item in section.items:
            field_provenance = {
                "allergen_flags": {"source": item.allergen_source.value, "artefactId": artefact_id, "capturedAt": captured_at},
                "calories": {"source": item.calories_source.value, "artefactId": artefact_id, "capturedAt": captured_at},
            }
            modifier_groups = [mg.model_dump() for mg in (item.modifier_groups or [])]

            item_row = await pool.fetchrow(
                """
                INSERT INTO menu_item
                    (menu_id, name, description, base_price, currency, section,
                     modifier_groups, dietary_flags, allergen_flags, calories,
                     confidence, field_provenance)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
                RETURNING id
                """,
                menu_id,
                item.name,
                item.description,
                item.base_price,
                item.currency,
                section.name,
                modifier_groups,
                item.dietary_flags,
                item.allergen_flags,
                item.calories,
                item.extraction_confidence,
                field_provenance,
            )
            menu_item_id = item_row["id"]
            menu_item_ids.append(str(menu_item_id))

            await pool.execute(
                """
                INSERT INTO price_observation (menu_item_id, channel, price, source, verified_by)
                VALUES ($1, $2, $3, 'extraction', $4)
                """,
                menu_item_id,
                channel,
                item.base_price,
                "vision_llm",
            )

            await ctx["redis"].enqueue_job("canonicalisation.run", str(menu_item_id))

    return {
        "artefact_id": artefact_id,
        "menu_id": str(menu_id),
        "menu_item_ids": menu_item_ids,
        "warnings": warnings,
    }
