"""Runs canonicalisation matching (tasks/canonicalisation.py) for every
menu_item that doesn't have a dish_mapping row yet. This is a synchronous
batch convenience for local dev/demo purposes — in the real pipeline each
menu_item gets an individual Arq job enqueued as extraction produces it
(see tasks/extraction.py's docstring), not a bulk sweep.

Prerequisite: scripts/embed_taxonomy.py must have been run at least once.

    python -m scripts.canonicalise_all
"""

import asyncio

from app.db import close_pool, get_pool
from tasks.canonicalisation import run as canonicalise


async def main() -> None:
    pool = await get_pool()
    rows = await pool.fetch(
        """
        SELECT mi.id, mi.name
        FROM menu_item mi
        LEFT JOIN dish_mapping dm ON dm.menu_item_id = mi.id
        WHERE dm.menu_item_id IS NULL
        """
    )
    if not rows:
        print("Nothing to do - every menu_item already has a dish_mapping.")
        await close_pool()
        return

    print(f"Canonicalising {len(rows)} menu items...")
    for row in rows:
        result = await canonicalise({}, str(row["id"]))
        print(
            f"  {row['name']!r} -> canonical_dish_id={result['canonical_dish_id']} "
            f"confidence={result['confidence']:.3f} review_state={result['review_state']}"
        )

    await close_pool()


if __name__ == "__main__":
    asyncio.run(main())
