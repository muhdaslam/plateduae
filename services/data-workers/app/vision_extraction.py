import base64
from functools import lru_cache

from openai import AsyncOpenAI
from pydantic import BaseModel

from app.config import settings
from schemas.generated.extraction import Section, VenueHint


@lru_cache(maxsize=1)
def get_client() -> AsyncOpenAI:
    # Lazy: constructing this at import time means every module that
    # transitively imports tasks/extraction.py (including the whole test
    # suite via tests/test_smoke.py) would hard-require OPENAI_API_KEY to
    # even import, breaking every other, unrelated test.
    return AsyncOpenAI(api_key=settings.openai_api_key)

EXTRACTION_PROMPT = """You are a menu-extraction engine. You will be shown one or more images \
of a restaurant menu (a photo or a rendered PDF page). Extract every dish into structured data.

For each menu item, you MUST decide allergen_source and calories_source independently:
- "declared_on_menu": the menu text itself states this (e.g. an allergen icon, a calorie count printed).
- "inferred": you are guessing based on the dish name/description, not something the menu states.
- "unknown": you have no basis to say either way.
This distinction matters for safety — never mark something "declared_on_menu" unless the menu \
literally shows it. Do not invent an allergen-free claim from an absent tag.

For bbox, give your best-effort normalised [x0, y0, x1, y1] (0-1 range) estimate of where the \
item's name appears on the page — approximate is fine, this is for reviewer context, not pixel-precise.

Report detected_languages as ISO 639-1 codes (e.g. "en", "ar") for languages actually present in \
the menu text.

Set extraction_confidence (0-1) honestly per item based on how legible/unambiguous that item was.

If a price column or item is ambiguous, still make your best extraction but add a note to `warnings`."""


class PartialExtraction(BaseModel):
    """What the model actually fills in. `source` and `schema_version` are
    known deterministically by the caller (artefact_id, content_hash,
    capture time, channel) and are assembled separately — never trust an
    LLM to reproduce data you already have exactly, e.g. a content hash."""

    model_config = {"extra": "forbid"}

    detected_languages: list[str]
    venue_hint: VenueHint
    sections: list[Section]
    warnings: list[str] = []


async def extract_menu(page_images: list[tuple[bytes, str]], model: str | None = None) -> PartialExtraction:
    content: list[dict[str, object]] = [{"type": "text", "text": EXTRACTION_PROMPT}]
    for image_bytes, mime_type in page_images:
        encoded = base64.b64encode(image_bytes).decode()
        content.append({"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{encoded}"}})

    completion = await get_client().chat.completions.parse(
        model=model or settings.openai_vision_model,
        messages=[{"role": "user", "content": content}],  # type: ignore
        response_format=PartialExtraction,
    )
    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise RuntimeError(f"Model refused or returned unparseable output: {completion.choices[0].message.refusal}")
    return parsed
