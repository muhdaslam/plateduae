# Plated data workers

Python service for the data plane (PDF section 6): ingestion, LLM extraction,
canonicalisation, freshness scheduling, and the review queue. All five run as
Arq task functions inside one worker process for now — see `worker.py`.

**The full pipeline is real end to end**: `POST /internal/ingest` (apps/api)
→ `POST /enqueue` (this service, HTTP not a direct Redis call — see "Run"
below for why) → `ingestion.run` (fetches the artefact from object storage,
content-hashes it) → `extraction.run` (a real OpenAI vision call, PDF
section 5.2 stages 3-5 — turns a menu photo/PDF into `menu`/`menu_item`/
`price_observation` rows) → `canonicalisation.run` per item (hybrid local-
embedding + `rapidfuzz` fuzzy matching against the canonical_dish taxonomy,
section 5.3's confidence banding: auto-map ≥0.90, review queue 0.70–0.90,
no confident match below 0.70 → `canonical_dish_id` left null for a
reviewer to curate a new dish) → searchable once confirmed/auto-mapped.
See "Testing extraction end-to-end" below to run this for real.

Not implemented: OCR pre-pass ahead of the vision-LLM call (a cost
optimisation at scale, not a correctness requirement — the vision model
reads text directly), de-skew/rotation correction, and freshness_scheduler/
review_queue (still stubs, see their docstrings).

## Local setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Run

Two processes, both read config from the repo-root `.env`. Both need to be
running for `POST /internal/ingest` (on apps/api) to work end to end —
without this service, that one endpoint returns a 503; without the worker,
jobs enqueue but never get picked up.

```bash
# FastAPI app (healthz + the /enqueue bridge apps/api calls)
uvicorn app.main:app --reload --port 8000

# Arq worker (the actual task runner)
arq worker.WorkerSettings
```

`POST /enqueue` exists because Arq's default job serialisation is Python's
pickle — a Node process can't hand-construct a compatible job payload
without reverse-engineering that wire protocol, so apps/api calls this
plain HTTP endpoint instead, and this service (which already speaks Arq
natively) does the real `enqueue_job` call on its behalf.

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

## Testing extraction end-to-end

Needs `OPENAI_API_KEY` set in the repo-root `.env` and both processes from
"Run" above running, plus apps/api (`pnpm dev` or `pnpm --filter @plated/api start`).
Real API call, real cost per run — this is a manual verification aid, not
part of the automated test suite (`tests/` has no live-API tests, on
purpose: cost and non-determinism don't belong in CI).

```bash
# Regenerate the fixture if you've changed it, and load it into MinIO
python -m scripts.generate_sample_menu
python -m scripts.upload_fixture tests/fixtures/sample_menu.pdf test/sample-menu.pdf

# Trigger the real pipeline — branchId must be a real branch (e.g. from `make db-seed`)
curl -X POST http://localhost:3001/internal/ingest \
  -H "Content-Type: application/json" \
  -d '{"artefactId":"test/sample-menu.pdf","branchId":"<a real branch id>","channel":"dine_in"}'
```

Watch the `arq worker.WorkerSettings` process's output: `ingestion.run` →
`extraction.run` (several seconds — the real API round-trip) →
`canonicalisation.run` per extracted item. Check results with
`GET /internal/review/queue` and `GET /v1/search?q=...`.

## Regenerating the extraction schema models

`schemas/generated/extraction.py` is generated from
`packages/contracts/schemas/extraction.schema.json` — do not hand-edit it.
Run `make generate-contracts` from the repo root (regenerates both the
TypeScript and Python sides together so they can't drift).
