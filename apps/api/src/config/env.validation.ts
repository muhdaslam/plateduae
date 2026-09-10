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
