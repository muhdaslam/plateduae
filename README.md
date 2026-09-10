# Plated

A dish-level search and price-comparison layer built on structured restaurant
menu data. Launch market: Dubai, UAE. Full product/technical context lives in
the Application Development Plan (v1.0) — this repo is the Phase 0/1
foundation described there: system architecture (section 6), technology
stack (section 7), and data model (section 8).

**Status.** Repo structure, tech stack wiring, and DB schema/migrations are
in place. `search`, `catalogue`, `geo-venue`, `pricing`, and the internal
review queue are wired to real Postgres (geo-filtered search, live price
comparison, real writes) — see each service's code comments for exactly
what's simplified versus the plan's full design (hybrid BM25+vector
retrieval over OpenSearch, full filters, cursor pagination are not there
yet). Search ranking (section 9.3) is real for the four signals with
actual underlying data — text relevance (pg_trgm, not a live embedding
call — section 6 rules that out in the request path), distance decay,
price position, and freshness — weights renormalised since quality signal,
availability/fees, and personalisation have no real data behind them yet
(see `search.service.ts`'s weight constants for exactly why each is
omitted rather than faked). A ~107-dish starter
canonical taxonomy is seeded (`packages/db/src/taxonomy`) covering Dubai's
core cuisine mix, short of the plan's 800-1,200 target which needs actual
food-literate curation. Dish canonicalisation matching is implemented
(`services/data-workers/tasks/canonicalisation.py`, section 5.3): hybrid
local-embedding + fuzzy matching with the plan's confidence banding.
**The full capture-to-searchable pipeline is real**: `POST /internal/ingest`
dispatches over HTTP to the Python worker (Arq's job serialisation is
Python-specific, so Node calls a plain HTTP bridge rather than talking
Arq's wire protocol directly), which fetches the artefact, calls a real
OpenAI vision model to extract structured menu data (PDF section 5.2
stages 3-5), writes it, and canonicalises each item — all the way to
being searchable once confirmed. See `services/data-workers/README.md`
for how to run this end-to-end yourself. Still not implemented: an OCR
pre-pass (cost optimisation, not correctness — the vision model reads
text directly), auth, affiliate/commission handling. See "Non-scope"
below.

## Layout

```
apps/
  web/            Next.js (App Router) — consumer web app
  api/             NestJS — modular monolith, application plane
services/
  data-workers/    Python (FastAPI + Arq) — data plane workers
packages/
  db/              Drizzle schema + migrations (source of truth for DB shape); src/taxonomy holds the seed canonical-dish list
  contracts/       Appendix B extraction JSON Schema — generates TS + Python models
  shared-types/     Persisted domain types, derived from packages/db
  api-client/       Typed client (openapi-fetch) for apps/web, generated from apps/api's OpenAPI doc
  config/           Shared tsconfig base + eslint configs (incl. module-boundary enforcement)
infra/
  postgres/         PostGIS + pgvector Dockerfile, extension init SQL
  minio/            Dev S3-compatible object storage bucket init
```

The application plane (`apps/api`) is a **modular monolith**: five domain
modules (search, catalogue, pricing, geo-venue, user-alerts) plus an
`internal` module bridging to the data plane, each only importable from
outside via its `index.ts` barrel (enforced by ESLint, see
`packages/config/eslint-module-boundaries.js`) so extraction into services
later stays cheap.

## Quickstart

```bash
cp .env.example .env
make bootstrap    # docker compose up, pnpm install, generate contracts, migrate DB, seed + embed the canonical taxonomy, set up the Python venv
make db-seed      # optional: fake demo restaurants/menus so search/comparison have something to show
make canonicalise # optional: map those demo menu items to canonical dishes (needs db-seed first)
pnpm dev          # apps/web + apps/api
```

Data workers run separately — see `services/data-workers/README.md`.

Once `apps/api` is running: OpenAPI docs at `http://localhost:3001/docs`.

## Non-scope for this pass

Not built yet, on purpose: an OCR pre-pass ahead of the vision-LLM call,
de-skew/rotation correction, hybrid BM25+vector retrieval over OpenSearch,
query intent classification (9.1), auth/session, affiliate/commission
logic, the React Native mobile app, restaurant/review consoles, production
hosting (AWS/ECS/Terraform), CDN/WAF, observability wiring. These land in
later phases per the plan's own roadmap (Phase 2 onward).
