import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { menuItem } from "./menu-item";
import { appUser } from "./app-user";

export const commissionStateValues = ["pending", "confirmed", "voided"] as const;
export type CommissionState = (typeof commissionStateValues)[number];

/** Attribution and revenue event: a tracked outbound handoff to a venue's
 * own channel or a delivery platform (PDF section 10, affiliate/deep-link
 * commission — the first revenue line). `userRef` is nullable: logged-out
 * users can still click through. */
export const outboundClick = pgTable("outbound_click", {
  id: uuid("id").primaryKey().defaultRandom(),
  userRef: uuid("user_ref").references(() => appUser.id, { onDelete: "set null" }),
  menuItemId: uuid("menu_item_id")
    .notNull()
    .references(() => menuItem.id, { onDelete: "cascade" }),
  destination: text("destination").notNull(), // resolved outbound URL
  partner: text("partner").notNull(), // venue_channel | platform slug
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  commissionState: text("commission_state", { enum: commissionStateValues })
    .notNull()
    .default("pending"),
});
