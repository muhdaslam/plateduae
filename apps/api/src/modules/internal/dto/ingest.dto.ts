import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";

export class EnqueueIngestDto {
  @ApiProperty({ description: "Object storage key of the captured source artefact." })
  @IsString()
  artefactId!: string;

  @ApiProperty({
    description:
      "The branch this menu belongs to. Required: menu.branch_id is not-null, and section 5.1's supply " +
      "strategy has this known at upload time (restaurant self-upload, partner integration) rather than " +
      "inferred from the artefact itself — extraction's venue_hint is a cross-check against this, not a " +
      "substitute for it.",
  })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ enum: ["dine_in", "delivery", "takeaway"] })
  @IsIn(["dine_in", "delivery", "takeaway"])
  channel!: "dine_in" | "delivery" | "takeaway";
}

export class EnqueueAckDto {
  @ApiProperty() accepted!: boolean;
  @ApiProperty() jobId!: string;
}

export class ReviewQueueItemDto {
  @ApiProperty() dishMappingId!: string;
  @ApiProperty() menuItemName!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Null when nothing in the taxonomy matched confidently (PDF 5.3's <0.70 band) — needs a brand-new canonical dish, not just confirmation.",
  })
  candidateCanonicalDishName!: string | null;
  @ApiProperty() confidence!: number;
}

export class ReviewDecisionDto {
  @ApiProperty({ enum: ["confirm", "reject"] })
  @IsIn(["confirm", "reject"])
  decision!: "confirm" | "reject";

  @ApiProperty({ required: false, description: "Required when decision is 'reject' and a different canonical dish applies." })
  @IsOptional()
  @IsString()
  reassignToCanonicalDishId?: string;
}
