import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

export class EnqueueIngestDto {
  @ApiProperty({ description: "Object storage key of the captured source artefact." })
  @IsString()
  artefactId!: string;

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
  @ApiProperty() candidateCanonicalDishName!: string;
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
