import { ApiProperty } from "@nestjs/swagger";

export class SavedDishDto {
  @ApiProperty() canonicalDishId!: string;
  @ApiProperty() dishName!: string;
  @ApiProperty({ description: "Alert when a nearby venue lists it cheaper or newly serves it." })
  alertOnPriceDrop!: boolean;
}

export class SavedResponseDto {
  @ApiProperty({ type: [SavedDishDto] })
  savedDishes!: SavedDishDto[];
}
