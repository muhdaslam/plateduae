from typing import Any


async def run(ctx: dict[str, Any], artefact_id: str) -> dict[str, Any]:
    """LLM extraction service (PDF section 5.2, stages 3-5: Extract,
    Validate, Normalise).

    Contract: input is the artefact_id only; output conforms to
    schemas/generated/extraction.py (Pydantic models generated from
    packages/contracts/schemas/extraction.schema.json — run
    `pnpm contracts:generate` after `make generate-contracts`). On success,
    enqueues `canonicalisation.run` for each item in the result.

    Not implemented in this scaffolding pass: no OCR pre-pass or vision-LLM
    call happens here yet (PDF section 6: "LLM usage: extraction and
    canonicalisation only, never in the request path" — this is that seam).
    """
    raise NotImplementedError("extraction.run: OCR pre-pass + vision LLM call not implemented")
