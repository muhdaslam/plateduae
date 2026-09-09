// AUTO-GENERATED from schemas/extraction.schema.json. Do not edit by hand. Run pnpm contracts:generate.

/**
 * Contract between the extraction model (vision LLM + OCR pre-pass) and everything downstream. Strict, versioned, and validated before anything is written. See Appendix B of the Plated Application Development Plan.
 */
export interface MenuExtraction {
  schema_version: "1.2";
  source: {
    /**
     * Object storage key/URI of the raw source artefact.
     */
    artefact_id: string;
    content_hash: string;
    captured_at: string;
    channel: "dine_in" | "delivery" | "takeaway";
    /**
     * @minItems 1
     */
    detected_languages: [string, ...string[]];
  };
  venue_hint: {
    name: string;
    branch_hint?: string | null;
    currency: string;
  };
  sections: Section[];
  warnings?: string[];
}
export interface Section {
  name: string;
  name_ar?: string | null;
  items: MenuItem[];
}
export interface MenuItem {
  name: string;
  name_ar?: string | null;
  description?: string | null;
  base_price: number;
  currency: string;
  size_variants?: {
    label: string;
    price: number;
  }[];
  modifier_groups?: ModifierGroup[];
  dietary_flags: string[];
  allergen_flags: string[];
  /**
   * Mandatory: an inferred value and a declared value carry entirely different liability and must render differently to the consumer.
   */
  allergen_source: "declared_on_menu" | "inferred" | "unknown";
  calories?: number | null;
  calories_source: "declared_on_menu" | "inferred" | "unknown";
  extraction_confidence: number;
  /**
   * [x0, y0, x1, y1] normalised 0-1, retained so any published field can be shown back to a reviewer or restaurant owner in its original page context.
   *
   * @minItems 4
   * @maxItems 4
   */
  bbox: [number, number, number, number];
  page: number;
}
export interface ModifierGroup {
  name: string;
  min: number;
  max: number;
  options: {
    name: string;
    price: number;
  }[];
}
