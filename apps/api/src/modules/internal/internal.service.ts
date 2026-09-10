import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { BadGatewayException, Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { eq, sql } from "drizzle-orm";
import { dishMapping, menuItem, canonicalDish, branch, restaurant, type Database } from "@plated/db";
import { DATABASE } from "../../database/database.module";
import { StorageService } from "../../storage/storage.service";
import { EnqueueIngestDto, EnqueueAckDto, ReviewQueueItemDto, ReviewDecisionDto } from "./dto/ingest.dto";
import { UploadMenuDto, UploadMenuResponseDto, VenueDetectionResultDto } from "./dto/upload.dto";
import { VenueSearchResultDto, CreateVenueDto, CreateVenueResponseDto } from "./dto/venue.dto";

// How many candidates the upload page's combobox shows per keystroke.
const VENUE_SEARCH_LIMIT = 8;
// Below this pg_trgm similarity, a result is noise rather than a real
// near-match — looser than a single-resolve threshold would need, since
// the user visually picks from the list rather than one being trusted
// automatically.
const VENUE_SEARCH_MIN_SCORE = 0.15;

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
    private readonly storage: StorageService,
  ) {}

  /** Fires the moment a file is dropped on the upload page, before the
   * venue is even picked — a synchronous, single-image vision call
   * (data-workers' POST /detect-venue) purely to seed the combobox's
   * initial search query. The user still picks (or creates) the real
   * venue themselves; this hint is never trusted as a resolved id. */
  async detectVenue(file: Express.Multer.File): Promise<VenueDetectionResultDto> {
    const dataWorkersUrl = this.config.get<string>("DATA_WORKERS_URL");
    const form = new FormData();
    form.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);

    let response: Response;
    try {
      response = await fetch(`${dataWorkersUrl}/detect-venue`, { method: "POST", body: form });
    } catch {
      throw new ServiceUnavailableException(
        `Could not reach the data-workers service at ${dataWorkersUrl}. Is it running (uvicorn app.main:app)?`,
      );
    }

    if (!response.ok) {
      const body = await response.text();
      throw new BadGatewayException(`data-workers rejected the detect-venue request (${response.status}): ${body}`);
    }

    const parsed = (await response.json()) as { name: string; branch_hint: string | null; currency: string };
    return { name: parsed.name, branchHint: parsed.branch_hint, currency: parsed.currency };
  }

  /** The actual "restaurant self-upload" entry point (section 5.1): the
   * combobox has already resolved a real branchId (picked from search, or
   * just created via createVenue) by the time this fires, so it's just
   * storage + enqueue — same as if a caller had already uploaded elsewhere
   * and knew the artefact_id, which this is the only code path to generate. */
  async uploadMenu(file: Express.Multer.File, dto: UploadMenuDto): Promise<UploadMenuResponseDto> {
    const key = `uploads/${dto.branchId}/${randomUUID()}${extname(file.originalname)}`;
    await this.storage.uploadObject(key, file.buffer, file.mimetype);

    const ack = await this.enqueueIngest({ artefactId: key, branchId: dto.branchId, channel: dto.channel });
    return { accepted: ack.accepted, artefactId: key, jobId: ack.jobId };
  }

  /** Backs the upload page's venue combobox. No owner auth exists yet to
   * scope "your own venues" (out of scope for this pass), so it searches
   * *all* known branches — pg_trgm fuzzy match against the brand name alone
   * and against "brand name — community", taking whichever scores higher
   * per branch. An empty query returns a default browsable list rather than
   * nothing, so the combobox isn't blank before the user types. */
  async searchVenues(q: string): Promise<VenueSearchResultDto[]> {
    const trimmed = q.trim();
    const rows = trimmed
      ? await this.db.execute<{ id: string; name: string; address: string }>(sql`
          SELECT b.id AS id, r.brand_name || ' — ' || b.community AS name, b.address AS address
          FROM branch b
          JOIN restaurant r ON r.id = b.restaurant_id
          WHERE GREATEST(
            similarity(r.brand_name, ${trimmed}),
            similarity(r.brand_name || ' — ' || b.community, ${trimmed})
          ) > ${VENUE_SEARCH_MIN_SCORE}
          ORDER BY GREATEST(
            similarity(r.brand_name, ${trimmed}),
            similarity(r.brand_name || ' — ' || b.community, ${trimmed})
          ) DESC
          LIMIT ${VENUE_SEARCH_LIMIT}
        `)
      : await this.db.execute<{ id: string; name: string; address: string }>(sql`
          SELECT b.id AS id, r.brand_name || ' — ' || b.community AS name, b.address AS address
          FROM branch b
          JOIN restaurant r ON r.id = b.restaurant_id
          ORDER BY r.brand_name ASC
          LIMIT ${VENUE_SEARCH_LIMIT}
        `);
    return rows.rows;
  }

  /** The "add as a new venue" path (section 5.1): creates the restaurant
   * and its first branch together, since a self-upload flow has no reason
   * to create one without the other. lat/lng come from a manual map pin —
   * see venue.dto.ts for why this isn't geocoded from the address text. */
  async createVenue(dto: CreateVenueDto): Promise<CreateVenueResponseDto> {
    const [newRestaurant] = await this.db
      .insert(restaurant)
      .values({ legalName: dto.name, brandName: dto.name, cuisineTags: [] })
      .returning();

    const [newBranch] = await this.db
      .insert(branch)
      .values({
        restaurantId: newRestaurant!.id,
        geoPoint: `POINT(${dto.lng} ${dto.lat})`,
        address: dto.address,
        community: dto.community,
        status: "unverified",
      })
      .returning();

    return { id: newBranch!.id, name: `${dto.name} — ${dto.community}` };
  }

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
