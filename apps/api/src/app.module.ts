import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./config/env.validation";
import { HealthController } from "./common/health.controller";
import { DatabaseModule } from "./database/database.module";
import { StorageModule } from "./storage/storage.module";
import { SearchModule } from "./modules/search";
import { CatalogueModule } from "./modules/catalogue";
import { PricingModule } from "./modules/pricing";
import { GeoVenueModule } from "./modules/geo-venue";
import { UserAlertsModule } from "./modules/user-alerts";
import { InternalModule } from "./modules/internal";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DatabaseModule,
    StorageModule,
    SearchModule,
    CatalogueModule,
    PricingModule,
    GeoVenueModule,
    UserAlertsModule,
    InternalModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
