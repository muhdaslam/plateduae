import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { restaurant } from "./restaurant";
import { geoPoint } from "./custom-types";

export const branchStatusValues = ["active", "closed", "temporarily_closed", "unverified"] as const;
export type BranchStatus = (typeof branchStatusValues)[number];

/** A physical outlet belonging to a restaurant/brand. */
export const branch = pgTable("branch", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurant.id, { onDelete: "cascade" }),
  geoPoint: geoPoint("geo_point").notNull(),
  address: text("address").notNull(),
  community: text("community").notNull(), // e.g. "Business Bay" — the launch-polygon unit
  hours: jsonb("hours").$type<Record<string, { open: string; close: string }[]>>(),
  licenceRef: text("licence_ref"),
  status: text("status", { enum: branchStatusValues }).notNull().default("unverified"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
