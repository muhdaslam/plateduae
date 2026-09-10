import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { dishMapping, menuItem, canonicalDish, type Database } from "@plated/db";
import { DATABASE } from "../../database/database.module";
import { EnqueueIngestDto, EnqueueAckDto, ReviewQueueItemDto, ReviewDecisionDto } from "./dto/ingest.dto";

/**
 * Bridge to the data plane (PDF section 6). The review queue (section 5.2
 * stage 8) is wired to the real dish_mapping table below. `enqueueIngest`
 * stays a stub: actually dispatching a job to the Python Arq worker
 * (services/data-workers) means either replicating Arq's Redis wire
 * protocol from Node or adding a shared queue abstraction both languages
 * speak — a distinct integration task, not "read/write Postgres" like
 * every other endpoint wired in this pass.
 *
 * dish_mapping's primary key is menu_item_id (see packages/db schema) —
 * there's no separate mapping id, so the `id` path param on
 * POST /internal/review/:id below IS a menu_item_id.
 */
@Injectable()
export class InternalService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async enqueueIngest(dto: EnqueueIngestDto): Promise<EnqueueAckDto> {
    void dto;
    return { accepted: true, jobId: randomUUID() };
  }

  async getReviewQueue(): Promise<ReviewQueueItemDto[]> {
    const rows = await this.db
      .select({
        dishMappingId: dishMapping.menuItemId,
        menuItemName: menuItem.name,
        candidateCanonicalDishName: canonicalDish.canonicalName,
        confidence: dishMapping.confidence,
      })
      .from(dishMapping)
      .innerJoin(menuItem, eq(dishMapping.menuItemId, menuItem.id))
      .innerJoin(canonicalDish, eq(dishMapping.canonicalDishId, canonicalDish.id))
      .where(eq(dishMapping.reviewState, "pending_review"));
    return rows;
  }

  async submitReviewDecision(id: string, dto: ReviewDecisionDto): Promise<{ id: string; recorded: boolean }> {
    if (dto.decision === "confirm") {
      await this.db.update(dishMapping).set({ reviewState: "confirmed" }).where(eq(dishMapping.menuItemId, id));
    } else if (dto.reassignToCanonicalDishId) {
      // Reviewer corrected it to a different canonical dish - that IS the
      // fix, so the corrected mapping is confirmed, not left rejected.
      await this.db
        .update(dishMapping)
        .set({ canonicalDishId: dto.reassignToCanonicalDishId, reviewState: "confirmed" })
        .where(eq(dishMapping.menuItemId, id));
    } else {
      await this.db.update(dishMapping).set({ reviewState: "rejected" }).where(eq(dishMapping.menuItemId, id));
    }
    return { id, recorded: true };
  }
}
