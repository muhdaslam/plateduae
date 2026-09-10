import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { vector } from "./custom-types";

// Placeholder dimension pending embedding model choice (PDF section 5.3).
export const CANONICAL_DISH_EMBEDDING_DIMENSIONS = 768;

/** The abstract dish users search for — the structural decision the whole
 * product rests on. "Chicken Shawarma Sandwich" and "Shawarma Djaj" map to
 * the same canonical_dish; "Shish Taouk Wrap" does not, even though users
 * conflate them. Size/protein/prep are attributes on dish_mapping, not
 * separate rows here. */
export const canonicalDish = pgTable("canonical_dish", {
  id: uuid("id").primaryKey().defaultRandom(),
  canonicalName: text("canonical_name").notNull().unique(),
  aliases: text("aliases").array().notNull().default([]),
  nameAr: text("name_ar"),
  cuisine: text("cuisine"),
  category: text("category"),
  embedding: vector(CANONICAL_DISH_EMBEDDING_DIMENSIONS)("embedding"),
  curatedBy: text("curated_by"), // reviewer/contractor identifier, seed-taxonomy provenance
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
