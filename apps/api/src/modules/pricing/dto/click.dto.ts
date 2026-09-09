import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class RecordClickDto {
  @ApiProperty()
  @IsUUID()
  menuItemId!: string;

  @ApiProperty({ description: "Resolved outbound URL the user was sent to." })
  @IsString()
  destination!: string;

  @ApiProperty({ description: "venue_channel, or a delivery platform slug." })
  @IsString()
  partner!: string;

  @ApiProperty({ required: false, description: "Omitted for logged-out users." })
  @IsOptional()
  @IsUUID()
  userRef?: string;
}

export class ClickAckDto {
  @ApiProperty() accepted!: boolean;
  @ApiProperty() id!: string;
}
