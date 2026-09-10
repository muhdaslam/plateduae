import { Global, Module } from "@nestjs/common";
import { StorageService } from "./storage.service";

/** @Global for the same reason as DatabaseModule — every domain module
 * that needs object storage can inject StorageService without each one
 * re-importing this module. */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
