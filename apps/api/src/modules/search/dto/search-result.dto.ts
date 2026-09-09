import { ApiProperty } from "@nestjs/swagger";

export class SearchResultItemDto {
  @ApiProperty() canonicalDishId!: string;
  @ApiProperty() dishName!: string;
  @ApiProperty() venueId!: string;
  @ApiProperty() venueName!: string;
  @ApiProperty() distanceKm!: number;
  @ApiProperty() price!: number;
  @ApiProperty() currency!: string;
  @ApiProperty({ description: "Position of this price within the local canonical-dish distribution." })
  priceVsMedian!: "below" | "at" | "above";
  @ApiProperty({ description: "ISO timestamp of the last-verified price." })
  lastVerifiedAt!: string;
}

export class SearchResultDto {
  @ApiProperty({ type: [SearchResultItemDto] })
  items!: SearchResultItemDto[];

  @ApiProperty({ nullable: true, description: "Opaque cursor for the next page, or null if none." })
  cursor!: string | null;
}

export class SuggestResultDto {
  @ApiProperty()
  type!: "canonical_dish" | "cuisine" | "venue";

  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;
}
