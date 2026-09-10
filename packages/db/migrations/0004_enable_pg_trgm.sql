-- Needed for real lexical relevance scoring in search ranking (PDF section
-- 9.3's "text and semantic relevance" signal): similarity() gives a
-- continuous fuzzy-match score in plain SQL, no OpenSearch/BM25 and no
-- live embedding call in the request path (section 6 explicitly rules out
-- LLM/embedding calls outside extraction and canonicalisation). A migration
-- rather than infra/postgres/init.sql, since init.sql only runs on a
-- container's first startup and wouldn't retroactively apply here.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS canonical_dish_name_trgm_idx ON canonical_dish USING gin (canonical_name gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS menu_item_name_trgm_idx ON menu_item USING gin (name gin_trgm_ops);
