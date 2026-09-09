import { ApiProperty } from "@nestjs/swagger";

export class VenueDetailDto {
  @ApiProperty() id!: string;
  @ApiProperty() brandName!: string;
  @ApiProperty() address!: string;
  @ApiProperty() community!: string;
  @ApiProperty({ type: [String], description: "Outbound channels: venue's own ordering links." })
  outboundChannels!: string[];
}

export class MenuItemFieldFreshnessDto {
  @ApiProperty() field!: string;
  @ApiProperty() lastVerifiedAt!: string;
  @ApiProperty({ description: "True once the field is past its TTL (PDF section 5.4)." })
  stale!: boolean;
}

export class VenueMenuItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() basePrice!: number;
  @ApiProperty() currency!: string;
  @ApiProperty({ type: [MenuItemFieldFreshnessDto] })
  freshness!: MenuItemFieldFreshnessDto[];
}

export class VenueMenuDto {
  @ApiProperty() venueId!: string;
  @ApiProperty({ type: [VenueMenuItemDto] })
  items!: VenueMenuItemDto[];
}
