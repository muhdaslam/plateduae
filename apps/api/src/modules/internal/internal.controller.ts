import {
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { InternalService } from "./internal.service";
import { EnqueueIngestDto, EnqueueAckDto, ReviewQueueItemDto, ReviewDecisionDto } from "./dto/ingest.dto";
import { UploadMenuDto, UploadMenuResponseDto, VenueDetectionResultDto } from "./dto/upload.dto";
import { VenueSearchResultDto, CreateVenueDto, CreateVenueResponseDto } from "./dto/venue.dto";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // menus are photos/PDFs, not video

const FILE_UPLOAD_BODY = {
  schema: {
    type: "object",
    properties: {
      file: { type: "string", format: "binary" },
    },
  },
} as const;

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

  @Post("detect-venue")
  @ApiOperation({ summary: "Quick synchronous venue-name guess from a dropped file, to pre-fill the upload form." })
  @ApiConsumes("multipart/form-data")
  @ApiBody(FILE_UPLOAD_BODY)
  @ApiOkResponse({ type: VenueDetectionResultDto })
  @UseInterceptors(FileInterceptor("file"))
  detectVenue(
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: MAX_UPLOAD_BYTES })] }))
    file: Express.Multer.File,
  ): Promise<VenueDetectionResultDto> {
    return this.internalService.detectVenue(file);
  }

  @Get("venues")
  @ApiOperation({ summary: "Fuzzy-search real venues — backs the upload page's venue combobox." })
  @ApiQuery({ name: "q", required: false, description: "Search text; empty returns a default browsable list." })
  @ApiOkResponse({ type: [VenueSearchResultDto] })
  searchVenues(@Query("q") q?: string): Promise<VenueSearchResultDto[]> {
    return this.internalService.searchVenues(q ?? "");
  }

  @Post("venues")
  @ApiOperation({ summary: "Create a new restaurant + branch (the combobox's \"add as new venue\" path)." })
  @ApiOkResponse({ type: CreateVenueResponseDto })
  createVenue(@Body() dto: CreateVenueDto): Promise<CreateVenueResponseDto> {
    return this.internalService.createVenue(dto);
  }

  @Post("upload")
  @ApiOperation({ summary: "Upload a menu photo/PDF and enqueue it for extraction (section 5.1 self-upload)." })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        branchId: { type: "string" },
        channel: { type: "string", enum: ["dine_in", "delivery", "takeaway"] },
      },
    },
  })
  @ApiOkResponse({ type: UploadMenuResponseDto })
  @UseInterceptors(FileInterceptor("file"))
  uploadMenu(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_UPLOAD_BYTES })],
        // Nest's file-type check only trusts the client-supplied mimetype
        // (not a magic-byte sniff) — a quick first-line UX rejection, not
        // the authoritative check. That's tasks/extraction.py's
        // to_page_images/sniff_content_type, which reads real magic bytes.
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadMenuDto,
  ): Promise<UploadMenuResponseDto> {
    return this.internalService.uploadMenu(file, dto);
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
