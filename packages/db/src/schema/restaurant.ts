import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const verificationStatusValues = ["unclaimed", "pending", "verified"] as const;
export type VerificationStatus = (typeof verificationStatusValues)[number];

/** A brand or operator (may own multiple physical branches). */
export const restaurant = pgTable("restaurant", {
  id: uuid("id").primaryKey().defaultRandom(),
  legalName: text("legal_name").notNull(),
  brandName: text("brand_name").notNull(),
  cuisineTags: text("cuisine_tags").array().notNull().default([]),
  claimedBy: uuid("claimed_by"), // FK to app_user.id, set on claim flow (v1)
  verificationStatus: text("verification_status", { enum: verificationStatusValues })
    .notNull()
    .default("unclaimed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
