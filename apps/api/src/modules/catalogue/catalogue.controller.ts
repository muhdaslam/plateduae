import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CatalogueService } from "./catalogue.service";
import { DishDetailDto, DishOfferDto } from "./dto/dish-detail.dto";
import { CreateCorrectionDto, CorrectionAckDto } from "./dto/correction.dto";
import { OffersQueryDto } from "./dto/offers-query.dto";

@ApiTags("catalogue")
@Controller("v1")
export class CatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Get("dishes/:id")
  @ApiOperation({ summary: "Canonical dish detail with local price distribution." })
  @ApiOkResponse({ type: DishDetailDto })
  getDish(@Param("id") id: string): Promise<DishDetailDto | null> {
    return this.catalogueService.getDish(id);
  }

  @Get("dishes/:id/offers")
  @ApiOperation({ summary: "Every nearby menu item mapped to this canonical dish, ranked." })
  @ApiQuery({ name: "lat", required: false, type: Number, description: "Omit distance from lat/lng if not given." })
  @ApiQuery({ name: "lng", required: false, type: Number })
  @ApiOkResponse({ type: [DishOfferDto] })
  getOffers(@Param("id") id: string, @Query() query: OffersQueryDto): Promise<DishOfferDto[]> {
    return this.catalogueService.getOffers(id, query.lat, query.lng);
  }

  @Post("corrections")
  @ApiOperation({ summary: "Submit a price or availability correction." })
  @ApiOkResponse({ type: CorrectionAckDto })
  createCorrection(@Body() dto: CreateCorrectionDto): Promise<CorrectionAckDto> {
    return this.catalogueService.createCorrection(dto);
  }
}
