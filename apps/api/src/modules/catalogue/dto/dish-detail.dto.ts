import { ApiProperty } from "@nestjs/swagger";

export class PriceDistributionDto {
  @ApiProperty() p25!: number;
  @ApiProperty() median!: number;
  @ApiProperty() p75!: number;
  @ApiProperty() sampleSize!: number;
}

export class DishDetailDto {
  @ApiProperty() id!: string;
  @ApiProperty() canonicalName!: string;
  @ApiProperty({ nullable: true }) nameAr!: string | null;
  @ApiProperty({ nullable: true }) cuisine!: string | null;
  @ApiProperty({ type: PriceDistributionDto, nullable: true })
  priceDistribution!: PriceDistributionDto | null;
}

export class DishOfferDto {
  @ApiProperty() menuItemId!: string;
  @ApiProperty() venueId!: string;
  @ApiProperty() venueName!: string;
  @ApiProperty() price!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() distanceKm!: number;
  @ApiProperty() lastVerifiedAt!: string;
}
