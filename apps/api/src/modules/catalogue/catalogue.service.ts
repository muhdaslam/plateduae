import { Inject, Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { canonicalDish, correctionReport, type Database } from "@plated/db";
import { DATABASE } from "../../database/database.module";
import { DishDetailDto, DishOfferDto } from "./dto/dish-detail.dto";
import { CreateCorrectionDto, CorrectionAckDto } from "./dto/correction.dto";
import { percentiles } from "../../common/percentiles";

/**
 * Catalogue and dish service (PDF section 6 application plane). Owns
 * canonical_dish lookups, price-distribution reads, and the
 * correction-report write path (anchor user story 7).
 *
 * Price distribution and offers are computed live from `current_price`
 * on every request rather than read from a materialised `dish_market_stat`
 * row — section 6 calls for the latter (recomputed on publish events) once
 * there's a real publish pipeline populating it; nothing does yet, so a
 * live query is the honest "real data" answer for this pass instead of a
 * table nothing writes to.
 */
@Injectable()
export class CatalogueService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getDish(id: string): Promise<DishDetailDto | null> {
    const [dish] = await this.db.select().from(canonicalDish).where(eq(canonicalDish.id, id));
    if (!dish) return null;

    const priceRows = await this.db.execute<{ price: number }>(sql`
      SELECT cp.price::float8 AS price
      FROM current_price cp
      JOIN dish_mapping dm ON dm.menu_item_id = cp.menu_item_id
      WHERE dm.canonical_dish_id = ${id} AND dm.review_state != 'rejected'
    `);
    const prices = priceRows.rows.map((r) => r.price);

    return {
      id: dish.id,
      canonicalName: dish.canonicalName,
      nameAr: dish.nameAr,
      cuisine: dish.cuisine,
      priceDistribution: prices.length > 0 ? percentiles(prices) : null,
    };
  }

  async getOffers(id: string, lat?: number, lng?: number): Promise<DishOfferDto[]> {
    const distanceExpr =
      lat !== undefined && lng !== undefined
        ? sql`ST_Distance(b.geo_point::geography, ST_MakePoint(${lng}, ${lat})::geography) / 1000.0`
        : sql`NULL`;

    const rows = await this.db.execute<{
      menu_item_id: string;
      venue_id: string;
      venue_name: string;
      price: number;
      currency: string;
      distance_km: number | null;
      last_verified_at: string;
    }>(sql`
      SELECT
        mi.id AS menu_item_id,
        b.id AS venue_id,
        r.brand_name AS venue_name,
        cp.price::float8 AS price,
        mi.currency AS currency,
        ${distanceExpr} AS distance_km,
        cp.observed_at AS last_verified_at
      FROM dish_mapping dm
      JOIN menu_item mi ON mi.id = dm.menu_item_id
      JOIN menu m ON m.id = mi.menu_id
      JOIN branch b ON b.id = m.branch_id
      JOIN restaurant r ON r.id = b.restaurant_id
      JOIN current_price cp ON cp.menu_item_id = mi.id
      WHERE dm.canonical_dish_id = ${id} AND dm.review_state != 'rejected'
      ORDER BY price ASC
    `);

    return rows.rows.map((r) => ({
      menuItemId: r.menu_item_id,
      venueId: r.venue_id,
      venueName: r.venue_name,
      price: r.price,
      currency: r.currency,
      distanceKm: r.distance_km ?? 0,
      lastVerifiedAt: r.last_verified_at,
    }));
  }

  async createCorrection(dto: CreateCorrectionDto): Promise<CorrectionAckDto> {
    const [row] = await this.db
      .insert(correctionReport)
      .values({
        targetRef: dto.targetRef,
        field: dto.field,
        reportedValue: dto.reportedValue ?? null,
        reporterType: dto.reporterType,
        state: "open",
      })
      .returning();
    return { accepted: true, id: row!.id };
  }
}
