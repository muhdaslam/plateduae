import { IsInt, IsOptional, IsString, IsUrl, Min, validateSync } from "class-validator";
import { plainToInstance } from "class-transformer";

class EnvironmentVariables {
  @IsInt()
  @Min(1)
  API_PORT: number = 3001;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_URL!: string;

  @IsUrl({ require_tld: false })
  OPENSEARCH_URL!: string;

  // Optional: the API boots and serves everything except POST
  // /internal/ingest without the data-workers service running. Only that
  // one endpoint needs it, at request time, not at boot.
  @IsOptional()
  @IsUrl({ require_tld: false })
  DATA_WORKERS_URL: string = "http://localhost:8000";

  // Object storage for POST /internal/upload — optional with dev defaults
  // matching docker-compose's MinIO service, same values
  // services/data-workers reads for the same bucket.
  @IsOptional()
  @IsString()
  S3_ENDPOINT: string = "http://localhost:9000";

  @IsOptional()
  @IsString()
  S3_REGION: string = "me-central-1";

  @IsOptional()
  @IsString()
  S3_ACCESS_KEY: string = "plated";

  @IsOptional()
  @IsString()
  S3_SECRET_KEY: string = "plated_dev_secret";

  @IsOptional()
  @IsString()
  S3_BUCKET: string = "plated-artefacts";

  // apps/web calls this API directly from the browser for multipart uploads
  // (the typed openapi-fetch client is JSON-only) — that's a cross-origin
  // request in dev (3000 vs 3001), so the API needs to allow it explicitly.
  @IsOptional()
  @IsString()
  WEB_URL: string = "http://localhost:3000";
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration: ${errors.toString()}`);
  }
  return validated;
}
