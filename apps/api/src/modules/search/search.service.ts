import { Inject, Injectable } from "@nestjs/common";
import { sql, type SQL } from "drizzle-orm";
import { type Database } from "@plated/db";
import { DATABASE } from "../../database/database.module";
import { SearchQueryDto } from "./dto/search-query.dto";
import { SearchResultDto, SearchResultItemDto, SuggestResultDto } from "./dto/search-result.dto";

/**
 * Query understanding + retrieval (PDF section 9), scoped down for this
 * pass to "wire the endpoint to real Postgres data": geo pre-filter, plain
 * ILIKE text match, and a price ceiling parsed out of the loose `filters`
 * string. What's deliberately NOT here: hybrid BM25+vector retrieval over
 * OpenSearch, the full weighted ranking model (9.3), personalisation,
 * dietary/cuisine/open-now filters, and real cursor pagination (LIMIT-only
 * for now) — all separate, larger pieces of work than "make this real".
 */
@Injectable()
export class SearchService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async search(query: SearchQueryDto): Promise<SearchResultDto> {
    const hasGeo = query.lat !== undefined && query.lng !== undefined;
    const conditions: SQL[] = [sql`dm.review_state != 'rejected'`];

    if (hasGeo) {
      const radiusMeters = (query.radius ?? 3) * 1000;
      conditions.push(
        sql`ST_DWithin(b.geo_point::geography, ST_MakePoint(${query.lng}, ${query.lat})::geography, ${radiusMeters})`,
      );
    }

    if (query.q) {
      const pattern = `%${query.q}%`;
      conditions.push(
        sql`(cd.canonical_name ILIKE ${pattern} OR mi.name ILIKE ${pattern} OR array_to_string(cd.aliases, ' ') ILIKE ${pattern})`,
      );
    }

    const priceCeiling = parsePriceCeiling(query.filters);
    if (priceCeiling !== undefined) {
      conditions.push(sql`cp.price <= ${priceCeiling}`);
    }

    const distanceSelect = hasGeo
      ? sql`ST_Distance(b.geo_point::geography, ST_MakePoint(${query.lng}, ${query.lat})::geography) / 1000.0`
      : sql`NULL`;

    const orderBy =
      query.sort === "price_asc"
        ? sql`price ASC`
        : query.sort === "price_desc"
          ? sql`price DESC`
          : query.sort === "distance" && hasGeo
            ? sql`distance_km ASC`
            : hasGeo
              ? sql`distance_km ASC` // "relevance" fallback: nearest first until real ranking (9.3) exists
              : sql`cd.canonical_name ASC`;

    const rows = await this.db.execute<{
      canonical_dish_id: string;
      dish_name: string;
      venue_id: string;
      venue_name: string;
      price: number;
      currency: string;
      last_verified_at: string;
      distance_km: number | null;
    }>(sql`
      SELECT
        cd.id AS canonical_dish_id,
        cd.canonical_name AS dish_name,
        b.id AS venue_id,
        r.brand_name AS venue_name,
        cp.price::float8 AS price,
        mi.currency AS currency,
        cp.observed_at AS last_verified_at,
        ${distanceSelect} AS distance_km
      FROM menu_item mi
      JOIN dish_mapping dm ON dm.menu_item_id = mi.id
      JOIN canonical_dish cd ON cd.id = dm.canonical_dish_id
      JOIN menu m ON m.id = mi.menu_id
      JOIN branch b ON b.id = m.branch_id
      JOIN restaurant r ON r.id = b.restaurant_id
      JOIN current_price cp ON cp.menu_item_id = mi.id
      WHERE ${sql.join(conditions, sql` AND `)}
      ORDER BY ${orderBy}
      LIMIT 20
    `);

    const prices = rows.rows.map((r) => r.price);
    const median = medianOf(prices);

    const items: SearchResultItemDto[] = rows.rows.map((r) => ({
      canonicalDishId: r.canonical_dish_id,
      dishName: r.dish_name,
      venueId: r.venue_id,
      venueName: r.venue_name,
      distanceKm: r.distance_km ?? 0,
      price: r.price,
      currency: r.currency,
      priceVsMedian: classifyVsMedian(r.price, median),
      lastVerifiedAt: r.last_verified_at,
    }));

    return { items, cursor: null };
  }

  async suggest(q: string): Promise<SuggestResultDto[]> {
    if (!q) return [];
    const pattern = `%${q}%`;
    const rows = await this.db.execute<{ id: string; canonical_name: string }>(sql`
      SELECT id, canonical_name
      FROM canonical_dish
      WHERE canonical_name ILIKE ${pattern} OR array_to_string(aliases, ' ') ILIKE ${pattern}
      LIMIT 10
    `);
    return rows.rows.map((r) => ({ type: "canonical_dish" as const, id: r.id, label: r.canonical_name }));
  }
}

function parsePriceCeiling(filters?: string): number | undefined {
  if (!filters) return undefined;
  const match = filters.split(",").find((f) => f.trim().startsWith("price_ceiling:"));
  if (!match) return undefined;
  const value = Number(match.split(":")[1]);
  return Number.isFinite(value) ? value : undefined;
}

function medianOf(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function classifyVsMedian(price: number, median: number | undefined): "below" | "at" | "above" {
  if (median === undefined) return "at";
  const tolerance = median * 0.02;
  if (price < median - tolerance) return "below";
  if (price > median + tolerance) return "above";
  return "at";
}
