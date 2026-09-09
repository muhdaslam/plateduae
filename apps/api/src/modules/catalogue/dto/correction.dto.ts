import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateCorrectionDto {
  @ApiProperty({ description: "Loose reference to the target entity, e.g. 'menu_item:<uuid>'." })
  @IsString()
  targetRef!: string;

  @ApiProperty({ description: "The field being corrected, e.g. 'base_price'." })
  @IsString()
  field!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reportedValue?: string;

  @ApiProperty({ enum: ["user", "owner"] })
  @IsIn(["user", "owner"])
  reporterType!: "user" | "owner";
}

export class CorrectionAckDto {
  @ApiProperty() accepted!: boolean;
  @ApiProperty() id!: string;
}
