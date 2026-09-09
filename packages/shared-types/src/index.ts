/**
 * Persisted domain shapes, derived from @plated/db's Drizzle schema
 * (InferSelectModel/InferInsertModel) — the source of truth for the
 * section 8 entities. Kept distinct from @plated/contracts, which tracks
 * the *extraction wire contract* (Appendix B) rather than persisted shape.
 * They overlap deliberately at MenuItem.modifierGroups, which reuses the
 * Appendix B ModifierGroup shape rather than duplicating it.
 */
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  restaurant,
  branch,
  menu,
  menuItem,
  canonicalDish,
  dishMapping,
  priceObservation,
  channelListing,
  dishMarketStat,
  correctionReport,
  appUser,
  outboundClick,
} from "@plated/db";

export type Restaurant = InferSelectModel<typeof restaurant>;
export type NewRestaurant = InferInsertModel<typeof restaurant>;

export type Branch = InferSelectModel<typeof branch>;
export type NewBranch = InferInsertModel<typeof branch>;

export type Menu = InferSelectModel<typeof menu>;
export type NewMenu = InferInsertModel<typeof menu>;

export type MenuItem = InferSelectModel<typeof menuItem>;
export type NewMenuItem = InferInsertModel<typeof menuItem>;

export type CanonicalDish = InferSelectModel<typeof canonicalDish>;
export type NewCanonicalDish = InferInsertModel<typeof canonicalDish>;

export type DishMapping = InferSelectModel<typeof dishMapping>;
export type NewDishMapping = InferInsertModel<typeof dishMapping>;

export type PriceObservation = InferSelectModel<typeof priceObservation>;
export type NewPriceObservation = InferInsertModel<typeof priceObservation>;

export type ChannelListing = InferSelectModel<typeof channelListing>;
export type NewChannelListing = InferInsertModel<typeof channelListing>;

export type DishMarketStat = InferSelectModel<typeof dishMarketStat>;
export type NewDishMarketStat = InferInsertModel<typeof dishMarketStat>;

export type CorrectionReport = InferSelectModel<typeof correctionReport>;
export type NewCorrectionReport = InferInsertModel<typeof correctionReport>;

export type AppUser = InferSelectModel<typeof appUser>;
export type NewAppUser = InferInsertModel<typeof appUser>;

export type OutboundClick = InferSelectModel<typeof outboundClick>;
export type NewOutboundClick = InferInsertModel<typeof outboundClick>;
