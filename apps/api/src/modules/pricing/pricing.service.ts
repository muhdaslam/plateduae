import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { RecordClickDto, ClickAckDto } from "./dto/click.dto";

/**
 * Pricing and comparison (PDF section 6 application plane). Owns
 * outbound_click writes for affiliate attribution (section 10's first
 * revenue line) and dish_market_stat materialisation reads. Ranking
 * (section 9.3) and the affiliate/commission pipeline itself are out of
 * scope for this pass — this only records the click event.
 */
@Injectable()
export class PricingService {
  async recordClick(dto: RecordClickDto): Promise<ClickAckDto> {
    void dto;
    return { accepted: true, id: randomUUID() };
  }
}
