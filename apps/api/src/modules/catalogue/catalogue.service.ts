import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DishDetailDto, DishOfferDto } from "./dto/dish-detail.dto";
import { CreateCorrectionDto, CorrectionAckDto } from "./dto/correction.dto";

/**
 * Catalogue and dish service (PDF section 6 application plane). Owns
 * canonical_dish lookups, dish_market_stat reads (materialised, see section
 * 6 read-path decision), and the correction-report write path (anchor user
 * story 7 — a report should resolve in under 2 minutes for owner-verified
 * corrections). No real DB access wired yet.
 */
@Injectable()
export class CatalogueService {
  async getDish(_id: string): Promise<DishDetailDto | null> {
    return null;
  }

  async getOffers(_id: string): Promise<DishOfferDto[]> {
    return [];
  }

  async createCorrection(dto: CreateCorrectionDto): Promise<CorrectionAckDto> {
    void dto;
    return { accepted: true, id: randomUUID() };
  }
}
