from typing import Any, Literal, TypedDict


class ReviewDecisionResult(TypedDict):
    dish_mapping_id: str
    review_state: str  # "confirmed" | "rejected"


async def run(
    ctx: dict[str, Any],
    dish_mapping_id: str,
    decision: Literal["confirm", "reject"],
) -> ReviewDecisionResult:
    """Review queue worker (PDF section 5.2 stage 8: human-in-the-loop
    console clears the queue; reviewer decisions become training data).

    Contract: input is a dish_mapping_id reference plus the reviewer's
    decision (mirrors apps/api's POST /internal/review/:id, which enqueues
    this task rather than writing directly) — never the underlying item
    text. On "reject" with a reassignment target, also writes a new
    dish_mapping row.

    Not implemented in this scaffolding pass: no DB write or training-data
    logging happens yet.
    """
    raise NotImplementedError("review_queue.run: reviewer-decision persistence not implemented")
