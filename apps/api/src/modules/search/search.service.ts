import { Inject, Injectable } from "@nestjs/common";
import { sql, type SQL } from "drizzle-orm";
import { type Database } from "@plated/db";
import { DATABASE } from "../../database/database.module";
import { SearchQueryDto } from "./dto/search-query.dto";
import { SearchResultDto, SearchResultItemDto, SuggestResultDto } from "./dto/search-result.dto";

// PDF section 9.3's weighted ranking model, renormalised to the four
// signals this pass actually has real data for. Original plan weights:
// text/semantic relevance 30%, distance 20%, price position 18%,
// freshness 12%, quality signal 10%, availability/fees 6%,
// personalisation 4%. The last three are omitted rather than faked:
//   - quality signal: no ratings data exists anywhere in the schema yet —
//     even the plan's own non-scope (2.4) defers this to "licensed or
//     public sources in v1", not launch.
//   - availability/fees: branch.hours is unparsed jsonb (no "open now"
//     evaluation exists) and channel_listing isn't joined into search —
//     wiring either is new feature work, not a ranking-formula change.
//   - personalisation: always zero without auth per the plan's own rule
//     for logged-out users, which is every current user — a permanently-
//     zero term is dead code, not a signal.
// Renormalising 30/20/18/12 (sum 80) by /80 keeps the *relative* weight
// of what's real identical to the plan's own ratios among those signals.
const WEIGHT_TEXT_RELEVANCE = 30 / 80;
const WEIGHT_DISTANCE = 20 / 80;
const WEIGHT_PRICE_POSITION = 18 / 80;
const WEIGHT_FRESHNESS = 12 / 80;

// Distance decay curve (9.3: "decay curve, not linear"). Exponential decay
// tied to the default search radius: at radius_km away, score ~= 1/e.
// The plan calls for this being steeper for delivery than dine-in intent;
// query intent isn't modelled yet (no dish/cuisine/venue/attribute
// classifier — section 9.1), so one constant is used for now.
const DISTANCE_DECAY_KM = 3;

// Price freshness TTL (section 5.4): past this many days, an observation
// is fully stale and contributes nothing to the freshness signal.
const PRICE_FRESHNESS_TTL_DAYS = 30;

/**
 * Query understanding + retrieval (PDF section 9). Query understanding
 * (9.1) is still just a geo pre-filter + pg_trgm fuzzy text match, not the
 * full dish/cuisine/venue/attribute intent classifier; retrieval (9.2) is
 * plain Postgres, not hybrid BM25+vector over OpenSearch. Ranking (9.3) IS
 * real for "relevance" sort — see the weight constants above for exactly
 * which signals and why three are omitted rather than faked. Real cursor
 * pagination (LIMIT-only for now) and dietary/cuisine/open-now filters are
 * still separate, larger pieces of work.
 *
 * Only 'confirmed'/'auto_mapped' dish_mapping rows are searchable —
 * 'pending_review' (canonicalisation's 0.70-0.90 confidence band) hasn't
 * been human-verified, and surfacing an unverified match as a real result
 * is the "confidently wrong" failure mode section 5.4 warns against.
 */
@Injectable()
export class SearchService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async search(query: SearchQueryDto): Promise<SearchResultDto> {
    const hasGeo = query.lat !== undefined && query.lng !== undefined;
    const conditions: SQL[] = [sql`dm.review_state IN ('confirmed', 'auto_mapped')`];

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
      : sql`NULL::float8`; // untyped NULL defaults to `text`, breaking `-distance_km` in the ranking expression below

    // pg_trgm similarity, not a live embedding call — section 6 rules out
    // LLM/embedding calls in the request path (extraction and
    // canonicalisation only). Neutral 1.0 in browse mode (no q) so an
    // absent query term doesn't zero out the whole relevance score.
    const textRelevanceSelect = query.q
      ? sql`GREATEST(
          similarity(cd.canonical_name, ${query.q}),
          similarity(mi.name, ${query.q}),
          COALESCE((SELECT MAX(similarity(alias, ${query.q})) FROM unnest(cd.aliases) AS alias), 0)
        )`
      : sql`1.0`;

    const orderBy =
      query.sort === "price_asc"
        ? sql`price ASC`
        : query.sort === "price_desc"
          ? sql`price DESC`
          : query.sort === "distance" && hasGeo
            ? sql`distance_km ASC`
            : hasGeo || query.q
              ? sql`relevance_score DESC`
              : sql`dish_name ASC`; // pure browse, no geo or query term to rank by — `dish_name` is the
              // CTE's output column; the outer query has no `cd` alias to reference (real bug, caught live)

    const rows = await this.db.execute<{
      menu_item_id: string;
      canonical_dish_id: string;
      dish_name: string;
      venue_id: string;
      venue_name: string;
      price: number;
      currency: string;
      last_verified_at: string;
      distance_km: number | null;
      price_percentile: number;
    }>(sql`
      WITH candidates AS (
        SELECT
          mi.id AS menu_item_id,
          cd.id AS canonical_dish_id,
          cd.canonical_name AS dish_name,
          b.id AS venue_id,
          r.brand_name AS venue_name,
          cp.price::float8 AS price,
          mi.currency AS currency,
          cp.observed_at AS last_verified_at,
          ${distanceSelect} AS distance_km,
          ${textRelevanceSelect} AS text_relevance,
          -- 0 = cheapest, 1 = priciest, within this canonical dish's own
          -- price spread across the geo-filtered candidates (section 9.3:
          -- "percentile within the canonical dish's local distribution") —
          -- computed over the full filtered set before LIMIT is applied.
          PERCENT_RANK() OVER (PARTITION BY cd.id ORDER BY cp.price) AS price_percentile,
          EXTRACT(EPOCH FROM (now() - cp.observed_at)) / 86400.0 AS age_days
        FROM menu_item mi
        JOIN dish_mapping dm ON dm.menu_item_id = mi.id
        JOIN canonical_dish cd ON cd.id = dm.canonical_dish_id
        JOIN menu m ON m.id = mi.menu_id
        JOIN branch b ON b.id = m.branch_id
        JOIN restaurant r ON r.id = b.restaurant_id
        JOIN current_price cp ON cp.menu_item_id = mi.id
        WHERE ${sql.join(conditions, sql` AND `)}
      )
      SELECT
        menu_item_id, canonical_dish_id, dish_name, venue_id, venue_name, price, currency,
        last_verified_at, distance_km, price_percentile,
        (
          ${WEIGHT_TEXT_RELEVANCE} * text_relevance +
          ${WEIGHT_DISTANCE} * COALESCE(EXP(-distance_km / ${DISTANCE_DECAY_KM}::float8), 1.0) +
          ${WEIGHT_PRICE_POSITION} * (1 - price_percentile) +
          ${WEIGHT_FRESHNESS} * GREATEST(0, 1 - age_days / ${PRICE_FRESHNESS_TTL_DAYS}::float8)
        ) AS relevance_score
      FROM candidates
      ORDER BY ${orderBy}
      LIMIT 20
    `);

    const items: SearchResultItemDto[] = rows.rows.map((r) => ({
      menuItemId: r.menu_item_id,
      canonicalDishId: r.canonical_dish_id,
      dishName: r.dish_name,
      venueId: r.venue_id,
      venueName: r.venue_name,
      distanceKm: r.distance_km ?? 0,
      price: r.price,
      currency: r.currency,
      // Derived from the same per-canonical-dish price_percentile the
      // ranking score uses, not a separate blended-across-all-results
      // median (that would compare, say, a $50 dish's price against a
      // median pulled from unrelated $10 items in the same result page).
      priceVsMedian: r.price_percentile < 0.4 ? "below" : r.price_percentile > 0.6 ? "above" : "at",
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
