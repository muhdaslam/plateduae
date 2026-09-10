import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsUUID } from "class-validator";

/** The non-file fields of POST /internal/upload's multipart form — the
 * file itself arrives via @UploadedFile(), not a class-validator-checked
 * body field. The venue combobox (apps/web's VenueCombobox) always resolves
 * to a real branch id before this fires — either an existing branch picked
 * from search, or one just created via POST /internal/venues — so no
 * server-side name resolution is needed here. */
export class UploadMenuDto {
  @ApiProperty({ description: "The branch this menu belongs to." })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ enum: ["dine_in", "delivery", "takeaway"] })
  @IsIn(["dine_in", "delivery", "takeaway"])
  channel!: "dine_in" | "delivery" | "takeaway";
}

export class UploadMenuResponseDto {
  @ApiProperty() accepted!: boolean;
  @ApiProperty({ description: "The object storage key the file was stored under." })
  artefactId!: string;
  @ApiProperty({ description: "The Arq job id processing this upload." })
  jobId!: string;
}

export class VenueDetectionResultDto {
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true, type: String }) branchHint!: string | null;
  @ApiProperty() currency!: string;
}
