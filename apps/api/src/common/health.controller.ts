import { Controller, Get } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";

@ApiExcludeController()
@Controller()
export class HealthController {
  @Get("healthz")
  healthz() {
    return { status: "ok" };
  }
}
