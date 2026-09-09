import { pgTable, uuid, text, numeric, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { canonicalDish } from "./canonical-dish";

/** Materialised comparison data: the price distribution for a canonical dish
 * within a polygon (launch community), recomputed on publish events rather
 * than on request (PDF section 6 read-path decision). `polygonId` is a
 * plain identifier for now — a first-class geo_polygon dimension table is
 * geo/venue-module work, out of scope for this pass. */
export const dishMarketStat = pgTable(
  "dish_market_stat",
  {
    canonicalDishId: uuid("canonical_dish_id")
      .notNull()
      .references(() => canonicalDish.id, { onDelete: "cascade" }),
    polygonId: text("polygon_id").notNull(),
    p25: numeric("p25", { precision: 10, scale: 2 }).notNull(),
    median: numeric("median", { precision: 10, scale: 2 }).notNull(),
    p75: numeric("p75", { precision: 10, scale: 2 }).notNull(),
    sampleSize: integer("sample_size").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.canonicalDishId, table.polygonId] })],
);
