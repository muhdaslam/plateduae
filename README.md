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
what's simplified versus the plan's full design (real ranking/OpenSearch,
full filters, cursor pagination are not there yet). A ~107-dish starter
canonical taxonomy is seeded (`packages/db/src/taxonomy`) covering Dubai's
core cuisine mix, short of the plan's 800-1,200 target which needs actual
food-literate curation. Dish canonicalisation matching is implemented
(`services/data-workers/tasks/canonicalisation.py`, section 5.3): hybrid
local-embedding + fuzzy matching with the plan's confidence banding — see
that service's README. Still not implemented: OCR/vision-LLM extraction,
auth, affiliate/commission handling. See "Non-scope" below.

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

Not built yet, on purpose: OCR/vision-LLM extraction logic, search ranking,
auth/session, affiliate/commission logic, the React Native mobile app,
restaurant/review consoles, production hosting (AWS/ECS/Terraform), CDN/WAF,
observability wiring. These land in later phases per the plan's own roadmap
(Phase 2 onward).
