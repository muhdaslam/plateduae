import { Injectable } from "@nestjs/common";
import { VenueDetailDto, VenueMenuDto } from "./dto/venue-detail.dto";

/**
 * Geo and venue service (PDF section 6 application plane). Owns branch
 * lookups and full structured menu reads with per-field freshness metadata
 * (section 5.4's TTL/decay model). No real DB access wired yet.
 */
@Injectable()
export class GeoVenueService {
  async getVenue(_id: string): Promise<VenueDetailDto | null> {
    return null;
  }

  async getVenueMenu(id: string): Promise<VenueMenuDto> {
    return { venueId: id, items: [] };
  }
}
