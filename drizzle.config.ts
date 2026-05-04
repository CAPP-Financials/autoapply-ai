import type { Config } from "drizzle-kit";

const url = process.env.DATABASE_URL;
if (!url && process.env.NODE_ENV !== "test") {
  // eslint-disable-next-line no-console
  console.warn("DATABASE_URL not set — drizzle-kit commands will fail until you add one.");
}

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: url ?? "postgres://invalid" },
  strict: true,
  verbose: true,
} satisfies Config;
