import { z } from "zod";

/**
 * Validated environment. Import as `env` everywhere — never `process.env.X`.
 * Server-only fields are left undefined when running in the browser.
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

function load(): Env {
  const publicResult = PublicSchema.safeParse({
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!publicResult.success) {
    throw new Error("Invalid public env: " + JSON.stringify(publicResult.error.format()));
  }

  if (!isServer) return publicResult.data;

  const serverResult = ServerSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    KEY_ENCRYPTION_KEY: process.env.KEY_ENCRYPTION_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL,
  });

  if (!serverResult.success) {
    // Loud-fail in production; soft-warn in dev so you can scaffold without env.
    const formatted = JSON.stringify(serverResult.error.format(), null, 2);
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid server env:\n" + formatted);
    }
    // eslint-disable-next-line no-console
    console.warn("[env] some server env vars are missing — dev fallback values applied:\n" + formatted);
    return { ...publicResult.data };
  }

  return { ...serverResult.data, ...publicResult.data };
}

export const env = load();
export type { Env };
