import { createApiClient } from "@plated/api-client";

/**
 * Single shared instance of the typed API client, pointed at apps/api.
 * Server components call through this directly (SSR); it can also be
 * used from client components once auth/session is wired.
 */
export const apiClient = createApiClient(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");
