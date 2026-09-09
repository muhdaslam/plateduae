# Plated data workers

Python service for the data plane (PDF section 6): ingestion, LLM extraction,
canonicalisation, freshness scheduling, and the review queue. All five run as
Arq task functions inside one worker process for now — see `worker.py`.

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

## Regenerating the extraction schema models

`schemas/generated/extraction.py` is generated from
`packages/contracts/schemas/extraction.schema.json` — do not hand-edit it.
Run `make generate-contracts` from the repo root (regenerates both the
TypeScript and Python sides together so they can't drift).
