import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { menuItem } from "./menu-item";

/** Immutable time series of every price seen for a menu_item on a channel.
 * INSERT-ONLY: there is deliberately no `updatedAt` column here, and a DB
 * trigger (see migrations/0004_append_only_price_observation.sql) rejects
 * UPDATE/DELETE at the database level — the "current price" is a view
 * (`current_price`) over this table, never a mutated row. See PDF section 8. */
export const priceObservation = pgTable("price_observation", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuItemId: uuid("menu_item_id")
    .notNull()
    .references(() => menuItem.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(), // dine_in | delivery platform slug, etc.
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
  source: text("source").notNull(), // extraction | owner_correction | user_report | competitor_scan
  verifiedBy: text("verified_by"), // reviewer id or "system" for automated extraction
});
