import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { branch } from "./branch";

export const menuChannelValues = ["dine_in", "delivery", "takeaway"] as const;
export type MenuChannel = (typeof menuChannelValues)[number];

/** A versioned menu for a branch and channel (one branch can have several: dine-in vs delivery pricing differs). */
export const menu = pgTable("menu", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => branch.id, { onDelete: "cascade" }),
  channel: text("channel", { enum: menuChannelValues }).notNull(),
  version: integer("version").notNull().default(1),
  sourceArtefactId: text("source_artefact_id").notNull(), // object storage key, see packages/contracts
  language: text("language").notNull().default("en"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
