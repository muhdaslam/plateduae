import { Inject, Injectable } from "@nestjs/common";
import { outboundClick, type Database } from "@plated/db";
import { DATABASE } from "../../database/database.module";
import { RecordClickDto, ClickAckDto } from "./dto/click.dto";

/**
 * Pricing and comparison (PDF section 6 application plane). Owns
 * outbound_click writes for affiliate attribution (section 10's first
 * revenue line). Ranking (section 9.3) and the actual affiliate/commission
 * settlement pipeline are separate, larger pieces of work — out of scope
 * here; this only records the click event truthfully.
 */
@Injectable()
export class PricingService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async recordClick(dto: RecordClickDto): Promise<ClickAckDto> {
    const [row] = await this.db
      .insert(outboundClick)
      .values({
        userRef: dto.userRef ?? null,
        menuItemId: dto.menuItemId,
        destination: dto.destination,
        partner: dto.partner,
        commissionState: "pending",
      })
      .returning();
    return { accepted: true, id: row!.id };
  }
}
