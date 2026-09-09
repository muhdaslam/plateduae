import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const reporterTypeValues = ["user", "owner"] as const;
export type ReporterType = (typeof reporterTypeValues)[number];

export const correctionStateValues = ["open", "resolved", "rejected"] as const;
export type CorrectionState = (typeof correctionStateValues)[number];

/** A user- or owner-submitted correction to any published field (price,
 * availability, etc). `targetRef` is a loose polymorphic reference
 * (e.g. "menu_item:<uuid>") rather than a typed FK, since corrections can
 * target several different entities — see PDF anchor user story 7. */
export const correctionReport = pgTable("correction_report", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetRef: text("target_ref").notNull(),
  field: text("field").notNull(),
  reportedValue: text("reported_value"),
  reporterType: text("reporter_type", { enum: reporterTypeValues }).notNull(),
  state: text("state", { enum: correctionStateValues }).notNull().default("open"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
