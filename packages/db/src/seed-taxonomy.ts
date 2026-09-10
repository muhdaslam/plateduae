import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createDb } from "./client";
import { canonicalDish } from "./schema";

interface TaxonomyEntry {
  canonicalName: string;
  aliases: string[];
  nameAr: string | null;
  cuisine: string;
  category: string;
}

const TAXONOMY_VERSION = "seed-taxonomy-v1";

/**
 * Loads the canonical dish taxonomy (PDF section 5.3: "hand-curate
 * 800-1,200 canonical dishes... this is a two-week task for a
 * food-literate contractor plus an engineer, and it is unavoidable").
 *
 * packages/db/src/taxonomy/canonical-dishes.json is a ~100-dish STARTER
 * set covering Dubai's core cuisine mix (Levantine/Gulf/Emirati are
 * heaviest, matching the launch market), not the full 800-1,200 target —
 * that scale of curation genuinely needs the food-literate review the plan
 * calls for, not a single engineering pass. Arabic names (name_ar) are
 * only filled in where the dish is conventionally listed in Arabic on
 * Dubai menus (mainly the Levantine/Gulf/Emirati section); left null
 * elsewhere rather than guessing — an unreviewed wrong translation is
 * worse than an honest gap (same principle as section 5.4's stale-data
 * handling: transparent uncertainty over confident wrongness).
 *
 * Idempotent: relies on canonical_dish.canonical_name's unique constraint
 * (migrations/0002) and ON CONFLICT DO NOTHING, so re-running after adding
 * new entries to the JSON only inserts the new ones.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const db = createDb(connectionString);

  const raw = readFileSync(join(__dirname, "taxonomy/canonical-dishes.json"), "utf-8");
  const entries: TaxonomyEntry[] = JSON.parse(raw);

  console.log(`Loading ${entries.length} canonical dishes from taxonomy...`);

  const inserted = await db
    .insert(canonicalDish)
    .values(
      entries.map((e) => ({
        canonicalName: e.canonicalName,
        aliases: e.aliases,
        nameAr: e.nameAr,
        cuisine: e.cuisine,
        category: e.category,
        curatedBy: TAXONOMY_VERSION,
      })),
    )
    .onConflictDoNothing({ target: canonicalDish.canonicalName })
    .returning({ canonicalName: canonicalDish.canonicalName });

  console.log(`Inserted ${inserted.length} new dishes, skipped ${entries.length - inserted.length} already present.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
