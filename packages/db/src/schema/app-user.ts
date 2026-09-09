import { pgTable, uuid, text, jsonb } from "drizzle-orm/pg-core";

/** Consumer account. Lightweight auth for saved dishes only in MVP (PDP
 * section 4.1). `homeGeo` stored as free-form text pending PostGIS type
 * decision at the account layer — precise location is transient per-search
 * and not tied to app_user by default (PDF section 17.2 privacy posture). */
export const appUser = pgTable("app_user", {
  id: uuid("id").primaryKey().defaultRandom(),
  authRef: text("auth_ref").notNull().unique(),
  homeGeo: text("home_geo"),
  dietaryPrefs: jsonb("dietary_prefs").$type<string[]>().notNull().default([]),
  savedDishes: uuid("saved_dishes").array().notNull().default([]),
  locale: text("locale").notNull().default("en"),
});
