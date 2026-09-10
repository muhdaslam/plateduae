"""Computes and stores embeddings for canonical_dish rows that don't have
one yet (idempotent - only touches embedding IS NULL rows). Run this once
after seeding/growing the taxonomy (packages/db/src/taxonomy) and before
running canonicalisation matching, since matching compares a menu_item's
embedding against these.

    python -m scripts.embed_taxonomy
"""

import asyncio

from app.db import close_pool, get_pool
from app.embeddings import embed


def _representative_text(canonical_name: str, aliases: list[str], name_ar: str | None) -> str:
    """One string per dish combining every name form we have, so the
    embedding captures cross-lingual/alias signal, not just the primary
    English name."""
    parts = [canonical_name, *aliases]
    if name_ar:
        parts.append(name_ar)
    return " | ".join(parts)


async def main() -> None:
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT id, canonical_name, aliases, name_ar FROM canonical_dish WHERE embedding IS NULL"
    )
    if not rows:
        print("Nothing to embed - all canonical dishes already have an embedding.")
        await close_pool()
        return

    print(f"Embedding {len(rows)} canonical dishes...")
    texts = [_representative_text(r["canonical_name"], list(r["aliases"]), r["name_ar"]) for r in rows]
    vectors = embed(texts)

    async with pool.acquire() as conn:
        await conn.executemany(
            "UPDATE canonical_dish SET embedding = $1 WHERE id = $2",
            [(vector, row["id"]) for vector, row in zip(vectors, rows, strict=True)],
        )

    print(f"Done. Embedded {len(rows)} dishes.")
    await close_pool()


if __name__ == "__main__":
    asyncio.run(main())
