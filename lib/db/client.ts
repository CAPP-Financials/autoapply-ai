/**
 * Postgres client + Drizzle ORM instance.
 *
 * Lazy: the connection is opened on first use, not at import. That lets
 * `next build` collect page data for routes that don't actually touch
 * the DB (the marketing landing, the static legal pages, the demo) even
 * if `DATABASE_URL` is missing.
 *
 * On Vercel Fluid Compute the function instance is reused across requests,
 * so we cache on globalThis to avoid re-opening connections during dev HMR.
 */
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { assertEnv } from "@/lib/env";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pg: ReturnType<typeof postgres> | undefined;
}

let _db: PostgresJsDatabase<typeof schema> | null = null;

function open(): PostgresJsDatabase<typeof schema> {
  const url = assertEnv("DATABASE_URL");
  const client = globalThis.__pg ?? postgres(url, { max: 5, prepare: false });
  if (process.env.NODE_ENV !== "production") globalThis.__pg = client;
  return drizzle(client, { schema, casing: "snake_case" });
}

/**
 * Drizzle DB instance. Backed by a Proxy that opens the connection on
 * first method access, so importing this module doesn't require env vars.
 */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    _db ??= open();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = Reflect.get(_db as any, prop, receiver);
    return typeof v === "function" ? v.bind(_db) : v;
  },
});

export { schema };
export type DB = typeof db;
