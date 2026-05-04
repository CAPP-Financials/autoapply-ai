/**
 * Postgres client + Drizzle ORM instance.
 *
 * One pooled `postgres-js` instance per process. On Vercel Fluid Compute the
 * function instance is reused across requests, so we cache on globalThis to
 * avoid re-opening connections on hot module reload during dev.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pg: ReturnType<typeof postgres> | undefined;
}

const url = env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required to use the DB client.");
}

const client = globalThis.__pg ?? postgres(url, { max: 5, prepare: false });
if (env.NODE_ENV !== "production") globalThis.__pg = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export { schema };
export type DB = typeof db;
