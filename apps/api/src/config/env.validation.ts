import { IsInt, IsString, IsUrl, Min, validateSync } from "class-validator";
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
