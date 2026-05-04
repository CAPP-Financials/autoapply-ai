import { z } from "zod";

/**
 * Validated environment, lazily.
 *
 * Importing `env` never throws — that lets `next build` collect page data
 * for routes that don't actually need the DB. Validation runs the first
 * time you access a server-only field; missing-or-malformed values throw
 * at use. Public (NEXT_PUBLIC_*) fields are validated eagerly because
 * they're cheap and never sensitive.
 */

const isServer = typeof window === "undefined";

const ServerSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  KEY_ENCRYPTION_KEY: z.string().min(32),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default("noreply@autoapply.ai"),
  SENTRY_DSN: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
});

const PublicSchema = z.object({
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

type ServerEnv = z.infer<typeof ServerSchema>;
type PublicEnv = z.infer<typeof PublicSchema>;
type Env = Partial<ServerEnv> & PublicEnv;

let cached: Env | null = null;

function build(): Env {
  const publicResult = PublicSchema.safeParse({
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!publicResult.success) {
    throw new Error("Invalid public env: " + JSON.stringify(publicResult.error.format()));
  }

  if (!isServer) return publicResult.data;

  // Soft-parse server env. Missing values stay undefined; callers use
  // `assertEnv` when they need a field.
  const partial: Partial<ServerEnv> = {};
  for (const k of Object.keys(ServerSchema.shape) as (keyof ServerEnv)[]) {
    const raw = process.env[k as string];
    if (raw == null || raw === "") continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const field = (ServerSchema.shape as any)[k];
    const r = field.safeParse(raw);
    if (r.success) partial[k] = r.data;
    else if (process.env.NODE_ENV !== "test") {
      // eslint-disable-next-line no-console
      console.warn(`[env] ${k} invalid: ${r.error.issues[0]?.message}`);
    }
  }

  // Apply defaults from the schema for fields with defaults
  // (NODE_ENV, LOG_LEVEL, EMAIL_FROM, BETTER_AUTH_URL).
  const withDefaults = ServerSchema.partial().safeParse({});
  if (withDefaults.success) {
    Object.assign(partial, withDefaults.data, partial);
  }

  return { ...partial, ...publicResult.data };
}

export const env = new Proxy({} as Env, {
  get(_, prop) {
    cached ??= build();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (cached as any)[prop];
  },
});

/**
 * Assert that a server env var is set; throws with a useful message if not.
 * Use at the entry of any code path that genuinely needs the value.
 */
export function assertEnv<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const v = (env as ServerEnv)[key];
  if (v == null || v === "") {
    throw new Error(
      `Required env var ${String(key)} is missing. Add it to .env.local — see .env.example.`,
    );
  }
  return v as NonNullable<ServerEnv[K]>;
}

export type { Env };
