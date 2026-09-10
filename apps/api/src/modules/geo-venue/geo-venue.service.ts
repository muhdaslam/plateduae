import { Inject, Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { branch, restaurant, menu, type Database } from "@plated/db";
import { DATABASE } from "../../database/database.module";
import { VenueDetailDto, VenueMenuDto } from "./dto/venue-detail.dto";

// PDF section 5.4: price is the highest-volatility field class, TTL 30 days.
const PRICE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Geo and venue service (PDF section 6 application plane). Owns branch
 * lookups and structured menu reads with per-field freshness metadata.
 *
 * `outboundChannels` has no dedicated column in section 8's data model —
 * derived here as the distinct channels (dine_in/delivery/takeaway) this
 * branch has a menu for, which is a reasonable real-data stand-in rather
 * than inventing a new schema field for this pass.
 */
@Injectable()
export class GeoVenueService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getVenue(id: string): Promise<VenueDetailDto | null> {
    const [row] = await this.db
      .select({
        id: branch.id,
        brandName: restaurant.brandName,
        address: branch.address,
        community: branch.community,
      })
      .from(branch)
      .innerJoin(restaurant, eq(branch.restaurantId, restaurant.id))
      .where(eq(branch.id, id));
    if (!row) return null;

    const channelRows = await this.db.selectDistinct({ channel: menu.channel }).from(menu).where(eq(menu.branchId, id));

    return { ...row, outboundChannels: channelRows.map((c) => c.channel) };
  }

  async getVenueMenu(id: string): Promise<VenueMenuDto> {
    const rows = await this.db.execute<{
      id: string;
      name: string;
      currency: string;
      price: number;
      observed_at: string;
    }>(sql`
      SELECT mi.id, mi.name, mi.currency, cp.price::float8 AS price, cp.observed_at
      FROM menu_item mi
      JOIN menu m ON m.id = mi.menu_id
      JOIN current_price cp ON cp.menu_item_id = mi.id
      WHERE m.branch_id = ${id}
    `);

    return {
      venueId: id,
      items: rows.rows.map((r) => {
        const lastVerifiedAt = new Date(r.observed_at).toISOString();
        const stale = Date.now() - new Date(r.observed_at).getTime() > PRICE_TTL_MS;
        return {
          id: r.id,
          name: r.name,
          basePrice: r.price,
          currency: r.currency,
          freshness: [{ field: "base_price", lastVerifiedAt, stale }],
        };
      }),
    };
  }
}
