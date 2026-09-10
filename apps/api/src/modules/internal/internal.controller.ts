import {
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InternalService } from "./internal.service";
import { EnqueueIngestDto, EnqueueAckDto, ReviewQueueItemDto, ReviewDecisionDto } from "./dto/ingest.dto";
import { BranchListItemDto } from "./dto/branch-list.dto";
import { UploadMenuDto, UploadMenuResponseDto } from "./dto/upload.dto";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // menus are photos/PDFs, not video

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

  @Get("branches")
  @ApiOperation({ summary: "List branches — backs the menu-upload page's venue picker." })
  @ApiOkResponse({ type: [BranchListItemDto] })
  listBranches(): Promise<BranchListItemDto[]> {
    return this.internalService.listBranches();
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
