import { BadGatewayException, Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { eq } from "drizzle-orm";
import { dishMapping, menuItem, canonicalDish, type Database } from "@plated/db";
import { DATABASE } from "../../database/database.module";
import { EnqueueIngestDto, EnqueueAckDto, ReviewQueueItemDto, ReviewDecisionDto } from "./dto/ingest.dto";

/**
 * Bridge to the data plane (PDF section 6). The review queue (section 5.2
 * stage 8) is wired to the real dish_mapping table below.
 *
 * `enqueueIngest` calls the data-workers FastAPI service's POST /enqueue
 * over HTTP rather than dispatching the Arq job directly from here: Arq's
 * default job serialisation is Python's pickle, a Python-specific binary
 * format, so a Node process can't hand-construct a compatible job payload
 * without either reverse-engineering that wire protocol or forking Arq's
 * serialisation config away from every other Python-side consumer. HTTP to
 * a service that already speaks Arq natively is the boring, robust choice.
 *
 * dish_mapping's primary key is menu_item_id (see packages/db schema) —
 * there's no separate mapping id, so the `id` path param on
 * POST /internal/review/:id below IS a menu_item_id.
 */
@Injectable()
export class InternalService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly config: ConfigService,
  ) {}

  async enqueueIngest(dto: EnqueueIngestDto): Promise<EnqueueAckDto> {
    const dataWorkersUrl = this.config.get<string>("DATA_WORKERS_URL");
    let response: Response;
    try {
      response = await fetch(`${dataWorkersUrl}/enqueue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artefact_id: dto.artefactId, branch_id: dto.branchId, channel: dto.channel }),
      });
    } catch {
      throw new ServiceUnavailableException(
        `Could not reach the data-workers service at ${dataWorkersUrl}. Is it running (uvicorn app.main:app)?`,
      );
    }

    if (!response.ok) {
      const body = await response.text();
      throw new BadGatewayException(`data-workers rejected the enqueue request (${response.status}): ${body}`);
    }

    const { job_id: jobId } = (await response.json()) as { job_id: string };
    return { accepted: true, jobId };
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
      // LEFT join: canonicalDishId is null for the <0.70-confidence band
      // (PDF 5.3) — those rows belong in the queue too, just with no
      // candidate name to show.
      .leftJoin(canonicalDish, eq(dishMapping.canonicalDishId, canonicalDish.id))
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
