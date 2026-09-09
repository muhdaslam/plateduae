import { customType } from "drizzle-orm/pg-core";

/**
 * PostGIS point, stored/read as WKT text, SRID 4326 (WGS84 — plain lat/lng).
 *
 * Uses `geometry(Point, 4326)` rather than `geography(Point, 4326)`:
 * drizzle-kit's DDL generator has a fixed allowlist of native Postgres/
 * PostGIS type names it emits unquoted (includes "geometry" and "vector",
 * not "geography" — see pgNativeTypes in drizzle-kit's generator), so a
 * `geography` column type gets wrapped in double quotes and produces
 * invalid SQL. `geometry(Point, 4326)` sidesteps that entirely. Distance
 * queries that need spherical (not planar) accuracy should cast at query
 * time, e.g. `geo_point::geography <-> other::geography` or
 * `ST_DistanceSphere(...)` — real radius-search queries are geo-venue
 * module work, out of scope for this pass.
 */
export const geoPoint = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geometry(Point, 4326)";
  },
  toDriver(value: string): string {
    // Expects a WKT string, e.g. "POINT(55.2708 25.2048)" (lng lat order).
    return `ST_GeomFromText('${value}', 4326)`;
  },
  fromDriver(value: string): string {
    return value;
  },
});

/**
 * pgvector column. Requires `CREATE EXTENSION vector` (done once in
 * infra/postgres/init.sql, not by a Drizzle migration).
 *
 * Dimension is a placeholder pending embedding model choice — see PDF
 * section 5.3 (dish canonicalisation) and the non-scope note in the plan.
 */
export const vector = (dimensions: number) =>
  customType<{ data: number[] }>({
    dataType() {
      return `vector(${dimensions})`;
    },
    toDriver(value: number[]): string {
      return `[${value.join(",")}]`;
    },
    fromDriver(value: unknown): number[] {
      if (Array.isArray(value)) return value as number[];
      const raw = String(value).replace(/^\[|\]$/g, "");
      return raw.length ? raw.split(",").map(Number) : [];
    },
  });
