import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDb, type Database } from "@plated/db";

export const DATABASE = Symbol("DATABASE");

/**
 * Single shared Drizzle client, injected wherever a module needs real DB
 * access. @Global so every domain module can inject DATABASE without each
 * one re-importing this module (same rationale as ConfigModule.forRoot's
 * isGlobal: true in app.module.ts).
 */
@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => createDb(config.get<string>("DATABASE_URL")),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
