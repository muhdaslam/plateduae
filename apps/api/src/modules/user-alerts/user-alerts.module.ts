import { Module } from "@nestjs/common";
import { UserAlertsController } from "./user-alerts.controller";
import { UserAlertsService } from "./user-alerts.service";

@Module({
  controllers: [UserAlertsController],
  providers: [UserAlertsService],
})
export class UserAlertsModule {}
