import { pgTable, uuid, real, jsonb, text, primaryKey } from "drizzle-orm/pg-core";
import { menuItem } from "./menu-item";
import { canonicalDish } from "./canonical-dish";

export const reviewStateValues = ["auto_mapped", "pending_review", "confirmed", "rejected"] as const;
export type ReviewState = (typeof reviewStateValues)[number];

/** menu_item -> canonical_dish, with variance. Confidence bands from PDF
 * section 5.3: >0.90 auto-map, 0.70-0.90 to review queue, <0.70 candidate
 * new canonical dish. One menu_item maps to exactly one canonical_dish. */
export const dishMapping = pgTable(
  "dish_mapping",
  {
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItem.id, { onDelete: "cascade" }),
    canonicalDishId: uuid("canonical_dish_id")
      .notNull()
      .references(() => canonicalDish.id, { onDelete: "restrict" }),
    confidence: real("confidence").notNull(),
    variantAttrs: jsonb("variant_attrs").$type<Record<string, string>>().notNull().default({}),
    reviewState: text("review_state", { enum: reviewStateValues }).notNull().default("pending_review"),
  },
  (table) => [primaryKey({ columns: [table.menuItemId] })],
);
