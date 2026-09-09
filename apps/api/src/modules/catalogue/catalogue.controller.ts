import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CatalogueService } from "./catalogue.service";
import { DishDetailDto, DishOfferDto } from "./dto/dish-detail.dto";
import { CreateCorrectionDto, CorrectionAckDto } from "./dto/correction.dto";

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
  @ApiOkResponse({ type: [DishOfferDto] })
  getOffers(@Param("id") id: string): Promise<DishOfferDto[]> {
    return this.catalogueService.getOffers(id);
  }

  @Post("corrections")
  @ApiOperation({ summary: "Submit a price or availability correction." })
  @ApiOkResponse({ type: CorrectionAckDto })
  createCorrection(@Body() dto: CreateCorrectionDto): Promise<CorrectionAckDto> {
    return this.catalogueService.createCorrection(dto);
  }
}
