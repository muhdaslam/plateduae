import { Module } from "@nestjs/common";
import { GeoVenueController } from "./geo-venue.controller";
import { GeoVenueService } from "./geo-venue.service";

@Module({
  controllers: [GeoVenueController],
  providers: [GeoVenueService],
})
export class GeoVenueModule {}
