import { Controller, Get, Param } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GeoVenueService } from "./geo-venue.service";
import { VenueDetailDto, VenueMenuDto } from "./dto/venue-detail.dto";

@ApiTags("geo-venue")
@Controller("v1")
export class GeoVenueController {
  constructor(private readonly geoVenueService: GeoVenueService) {}

  @Get("venues/:id")
  @ApiOperation({ summary: "Branch detail: hours, geo, outbound channels." })
  @ApiOkResponse({ type: VenueDetailDto })
  getVenue(@Param("id") id: string): Promise<VenueDetailDto | null> {
    return this.geoVenueService.getVenue(id);
  }

  @Get("venues/:id/menu")
  @ApiOperation({ summary: "Full structured menu with freshness metadata per field." })
  @ApiOkResponse({ type: VenueMenuDto })
  getVenueMenu(@Param("id") id: string): Promise<VenueMenuDto> {
    return this.geoVenueService.getVenueMenu(id);
  }
}
