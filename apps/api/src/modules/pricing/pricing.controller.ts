import { Body, Controller, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PricingService } from "./pricing.service";
import { RecordClickDto, ClickAckDto } from "./dto/click.dto";

@ApiTags("pricing")
@Controller("v1")
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post("clicks")
  @ApiOperation({ summary: "Record an outbound click for attribution." })
  @ApiOkResponse({ type: ClickAckDto })
  recordClick(@Body() dto: RecordClickDto): Promise<ClickAckDto> {
    return this.pricingService.recordClick(dto);
  }
}
