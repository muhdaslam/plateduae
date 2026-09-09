import { pgTable, uuid, text, numeric, integer, jsonb, real } from "drizzle-orm/pg-core";
import { menu } from "./menu";

export interface ModifierOption {
  name: string;
  price: number;
}

export interface ModifierGroup {
  name: string;
  min: number;
  max: number;
  options: ModifierOption[];
}

/** Per-field provenance: whether a value was declared on the source menu or
 * inferred, plus a pointer back to the artefact it came from. Section 8 asks
 * for "every published field carries a provenance reference" at a
 * granularity finer than the row-level source_artefact_id already on `menu`
 * — this is the scaffolding-level addition that makes that true for the two
 * fields (Appendix B) where it carries real liability. Nullable: most
 * fields don't need per-field provenance, only allergen/calorie data does. */
export interface FieldProvenance {
  [field: string]: {
    source: "declared_on_menu" | "inferred" | "unknown";
    artefactId: string;
    capturedAt: string;
  };
}

/** One line on one menu. What a venue literally lists — see canonical_dish
 * for the abstract dish users search for; dish_mapping links the two. */
export const menuItem = pgTable("menu_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuId: uuid("menu_id")
    .notNull()
    .references(() => menu.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("AED"),
  section: text("section"), // e.g. "Grills" — menu category as printed
  modifierGroups: jsonb("modifier_groups").$type<ModifierGroup[]>().notNull().default([]),
  dietaryFlags: text("dietary_flags").array().notNull().default([]),
  allergenFlags: text("allergen_flags").array().notNull().default([]),
  calories: integer("calories"),
  confidence: real("confidence"), // extraction_confidence from Appendix B, 0-1
  fieldProvenance: jsonb("field_provenance").$type<FieldProvenance>(),
});
