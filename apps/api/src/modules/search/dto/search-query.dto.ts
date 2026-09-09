import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class SearchQueryDto {
  @ApiPropertyOptional({ description: "Free-text dish, cuisine, or loose description." })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: "Latitude of the search origin." })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({ description: "Longitude of the search origin." })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  @ApiPropertyOptional({ description: "Search radius in kilometres.", default: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(50)
  radius?: number = 3;

  @ApiPropertyOptional({ description: "Comma-separated filters, e.g. 'dietary:halal,price_ceiling:30'." })
  @IsOptional()
  @IsString()
  filters?: string;

  @ApiPropertyOptional({ enum: ["relevance", "price_asc", "price_desc", "distance"] })
  @IsOptional()
  @IsIn(["relevance", "price_asc", "price_desc", "distance"])
  sort?: "relevance" | "price_asc" | "price_desc" | "distance" = "relevance";

  @ApiPropertyOptional({ description: "Opaque pagination cursor." })
  @IsOptional()
  @IsString()
  cursor?: string;
}
