import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export function createDb(connectionString: string = process.env.DATABASE_URL ?? "") {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create the Plated db client.");
  }
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

export type Database = ReturnType<typeof createDb>;
export * from "./schema";
