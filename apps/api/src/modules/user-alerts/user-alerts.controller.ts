import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserAlertsService } from "./user-alerts.service";
import { SavedResponseDto } from "./dto/saved.dto";

@ApiTags("user-alerts")
@Controller("v1/me")
export class UserAlertsController {
  constructor(private readonly userAlertsService: UserAlertsService) {}

  @Get("saved")
  @ApiOperation({ summary: "Saved dishes and alert configuration." })
  @ApiOkResponse({ type: SavedResponseDto })
  getSaved(): Promise<SavedResponseDto> {
    return this.userAlertsService.getSaved();
  }
}
