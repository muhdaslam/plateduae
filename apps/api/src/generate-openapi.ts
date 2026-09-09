import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { AppModule } from "./app.module";

export function buildOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Plated API")
    .setDescription("Dish-first search and price-comparison API. See Appendix A of the Application Development Plan.")
    .setVersion("1.0")
    .build();
  return SwaggerModule.createDocument(app, config);
}

/**
 * Standalone script (`pnpm --filter @plated/api generate:openapi`): boots a
 * full Nest application (HTTP adapter attached, but `listen()` is never
 * called) so `SwaggerModule.createDocument` has what it needs, writes the
 * OpenAPI document to apps/api/openapi.json, then closes immediately.
 * packages/api-client's `generate` script turns that file into TypeScript
 * types for apps/web.
 */
async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = buildOpenApiDocument(app);
  const outPath = resolve(__dirname, "../openapi.json");
  writeFileSync(outPath, JSON.stringify(document, null, 2));
  // eslint-disable-next-line no-console
  console.log(`Wrote OpenAPI document to ${outPath}`);
  await app.close();
}

if (require.main === module) {
  main();
}
