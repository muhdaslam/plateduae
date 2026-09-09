# Plated

A dish-level search and price-comparison layer built on structured restaurant
menu data. Launch market: Dubai, UAE. Full product/technical context lives in
the Application Development Plan (v1.0) — this repo is the Phase 0/1
foundation described there: system architecture (section 6), technology
stack (section 7), and data model (section 8).

**This pass is scaffolding only.** Repo structure, tech stack wiring, DB
schema/migrations, and empty service boundaries are in place; no feature
logic (search ranking, canonicalisation matching, OCR/LLM extraction, auth,
affiliate/commission handling) is implemented yet. See "Non-scope" below.

## Layout

```
apps/
  web/            Next.js (App Router) — consumer web app
  api/             NestJS — modular monolith, application plane
services/
  data-workers/    Python (FastAPI + Arq) — data plane workers
packages/
  db/              Drizzle schema + migrations (source of truth for DB shape)
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
make bootstrap   # docker compose up, pnpm install, generate contracts, migrate DB, set up the Python venv
pnpm dev         # apps/web + apps/api
```

Data workers run separately — see `services/data-workers/README.md`.

Once `apps/api` is running: OpenAPI docs at `http://localhost:3001/docs`.

## Non-scope for this pass

Not built yet, on purpose: OCR/vision-LLM extraction logic, canonicalisation
matching/embedding logic, search ranking, auth/session, affiliate/commission
logic, the React Native mobile app, restaurant/review consoles, production
hosting (AWS/ECS/Terraform), CDN/WAF, observability wiring. These land in
later phases per the plan's own roadmap (Phase 2 onward).
