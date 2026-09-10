# Plated data workers

Python service for the data plane (PDF section 6): ingestion, LLM extraction,
canonicalisation, freshness scheduling, and the review queue. All five run as
Arq task functions inside one worker process for now — see `worker.py`.

**Canonicalisation matching is implemented** (`tasks/canonicalisation.py`,
section 5.3): hybrid semantic + lexical matching of a menu_item against the
canonical_dish taxonomy, using a local multilingual embedding model
(`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`, no API key
needed) combined with `rapidfuzz` fuzzy string matching, with the plan's
confidence banding (auto-map ≥0.90, review queue 0.70–0.90, no confident
match below 0.70 → `canonical_dish_id` left null for a reviewer to curate a
new dish). Ingestion and extraction are still stubs — see their docstrings.

## Local setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Run

Two processes, both read config from the repo-root `.env`:

```bash
# FastAPI app (healthz + local /enqueue helper)
uvicorn app.main:app --reload --port 8000

# Arq worker (the actual task runner)
arq worker.WorkerSettings
```

## Canonicalisation matching

```bash
# One-time (or after growing packages/db/src/taxonomy): embed the taxonomy
python -m scripts.embed_taxonomy

# Match every menu_item that doesn't have a dish_mapping yet
python -m scripts.canonicalise_all
```

Both are also available as `make embed-taxonomy` / `make canonicalise` from
the repo root. `make bootstrap` runs the first automatically; the second is
a manual step since it depends on `make db-seed` (or real ingested data)
having created menu_items to match against.

## Regenerating the extraction schema models

`schemas/generated/extraction.py` is generated from
`packages/contracts/schemas/extraction.schema.json` — do not hand-edit it.
Run `make generate-contracts` from the repo root (regenerates both the
TypeScript and Python sides together so they can't drift).
