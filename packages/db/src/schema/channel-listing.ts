import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { menuItem } from "./menu-item";

/** Same menu_item as listed on a third-party delivery platform, including
 * the fees Plated's price-comparison view surfaces alongside the dine-in
 * price (PDF section 2.2 / Appendix A GET /v1/dishes/:id/offers). */
export const channelListing = pgTable("channel_listing", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuItemId: uuid("menu_item_id")
    .notNull()
    .references(() => menuItem.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // e.g. "talabat", "deliveroo", "careem"
  platformPrice: numeric("platform_price", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }),
  minOrder: numeric("min_order", { precision: 10, scale: 2 }),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
});
