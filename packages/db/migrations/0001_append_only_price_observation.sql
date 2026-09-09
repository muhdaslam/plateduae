-- Enforces the append-only invariant on price_observation at the database
-- level (PDF section 8): "prices are never updated in place - they are
-- appended as observations". The application layer never needs an UPDATE
-- or DELETE path for this table, but this trigger makes that a guarantee
-- rather than a convention.
CREATE OR REPLACE FUNCTION reject_price_observation_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'price_observation is append-only: insert-only table';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER no_mutate_price_observation
BEFORE UPDATE OR DELETE ON price_observation
FOR EACH ROW EXECUTE FUNCTION reject_price_observation_mutation();
--> statement-breakpoint
-- "Current price" is a view over the series, never a mutated row.
CREATE OR REPLACE VIEW current_price AS
SELECT DISTINCT ON (menu_item_id, channel) *
FROM price_observation
ORDER BY menu_item_id, channel, observed_at DESC;
