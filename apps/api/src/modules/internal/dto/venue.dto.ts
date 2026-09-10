import { ApiProperty } from "@nestjs/swagger";
import { IsLatitude, IsLongitude, IsNotEmpty, IsString } from "class-validator";

/** Backs the upload page's venue combobox — a live fuzzy search over real
 * branches, not a full listing (InternalService.searchVenues). */
export class VenueSearchResultDto {
  @ApiProperty() id!: string;
  @ApiProperty({ description: '"Brand name — community", e.g. "Corner Kitchen — Business Bay".' })
  name!: string;
  @ApiProperty() address!: string;
}

/** The "add as a new venue" path when a search turns up nothing close
 * enough — creates both the restaurant and its first branch. lat/lng come
 * from a manual map pin (apps/web's VenueMapPicker), not geocoding: there's
 * no geocoding integration in this codebase, and branch.geo_point is a
 * required column real distance/radius search depends on, so it can't be
 * left null or defaulted to a placeholder. */
export class CreateVenueDto {
  @ApiProperty({ description: "Restaurant brand name." })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ description: 'e.g. "Business Bay" — the launch-polygon unit.' })
  @IsString()
  @IsNotEmpty()
  community!: string;

  @ApiProperty()
  @IsLatitude()
  lat!: number;

  @ApiProperty()
  @IsLongitude()
  lng!: number;
}

export class CreateVenueResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ description: '"Brand name — community", matching VenueSearchResultDto.name.' })
  name!: string;
}
