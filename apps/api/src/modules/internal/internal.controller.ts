import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InternalService } from "./internal.service";
import { EnqueueIngestDto, EnqueueAckDto, ReviewQueueItemDto, ReviewDecisionDto } from "./dto/ingest.dto";

@ApiTags("internal")
@Controller("internal")
export class InternalController {
  constructor(private readonly internalService: InternalService) {}

  @Post("ingest")
  @ApiOperation({ summary: "Enqueue a source artefact for extraction." })
  @ApiOkResponse({ type: EnqueueAckDto })
  enqueueIngest(@Body() dto: EnqueueIngestDto): Promise<EnqueueAckDto> {
    return this.internalService.enqueueIngest(dto);
  }

  @Get("review/queue")
  @ApiOperation({ summary: "Pull the next canonicalisation review batch." })
  @ApiOkResponse({ type: [ReviewQueueItemDto] })
  getReviewQueue(): Promise<ReviewQueueItemDto[]> {
    return this.internalService.getReviewQueue();
  }

  @Post("review/:id")
  @ApiOperation({ summary: "Submit a reviewer decision; logged as training data." })
  submitReviewDecision(@Param("id") id: string, @Body() dto: ReviewDecisionDto) {
    return this.internalService.submitReviewDecision(id, dto);
  }
}
