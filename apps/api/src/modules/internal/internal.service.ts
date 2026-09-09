import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { EnqueueIngestDto, EnqueueAckDto, ReviewQueueItemDto, ReviewDecisionDto } from "./dto/ingest.dto";

/**
 * Bridge to the data plane (PDF section 6): enqueues source artefacts for
 * the Python ingestion/extraction/canonicalisation workers
 * (services/data-workers) and surfaces the human review queue (section
 * 5.2 stage 8). In this pass there is no real queue connection — enqueue
 * acknowledges synchronously and the review queue is always empty.
 */
@Injectable()
export class InternalService {
  async enqueueIngest(dto: EnqueueIngestDto): Promise<EnqueueAckDto> {
    void dto;
    return { accepted: true, jobId: randomUUID() };
  }

  async getReviewQueue(): Promise<ReviewQueueItemDto[]> {
    return [];
  }

  async submitReviewDecision(id: string, dto: ReviewDecisionDto): Promise<{ id: string; recorded: boolean }> {
    void dto;
    return { id, recorded: true };
  }
}
