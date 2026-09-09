import createClient from "openapi-fetch";
import type { paths } from "./generated/schema";

/**
 * Typed client for the Plated API (apps/api). Types are generated from
 * apps/api's OpenAPI document via `pnpm api-client:generate` — see
 * ../../apps/api/src/generate-openapi.ts and package.json's `generate`
 * script. Do not hand-edit src/generated/schema.d.ts.
 */
export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}

export type ApiClient = ReturnType<typeof createApiClient>;
