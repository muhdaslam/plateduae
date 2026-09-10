import { ApiProperty } from "@nestjs/swagger";

export class SearchResultItemDto {
  @ApiProperty({
    description:
      "The specific menu_item behind this result — a venue can have more than one menu_item mapped to " +
      "the same canonical dish (e.g. across menu versions), so this, not venueId+canonicalDishId, is the " +
      "real unique identifier for a result row.",
  })
  menuItemId!: string;
  @ApiProperty() canonicalDishId!: string;
  @ApiProperty() dishName!: string;
  @ApiProperty() venueId!: string;
  @ApiProperty() venueName!: string;
  @ApiProperty() distanceKm!: number;
  @ApiProperty() price!: number;
  @ApiProperty() currency!: string;
  @ApiProperty({
    enum: ["below", "at", "above"],
    description: "Position of this price within the local canonical-dish distribution.",
  })
  priceVsMedian!: "below" | "at" | "above";
  @ApiProperty({ description: "ISO timestamp of the last-verified price." })
  lastVerifiedAt!: string;
}

export class SearchResultDto {
  @ApiProperty({ type: [SearchResultItemDto] })
  items!: SearchResultItemDto[];

  @ApiProperty({ type: String, nullable: true, description: "Opaque cursor for the next page, or null if none." })
  cursor!: string | null;
}

export class SuggestResultDto {
  @ApiProperty({ enum: ["canonical_dish", "cuisine", "venue"] })
  type!: "canonical_dish" | "cuisine" | "venue";

  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;
}
