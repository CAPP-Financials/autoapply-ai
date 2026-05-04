/**
 * Better Auth server setup.
 *
 * - Drizzle adapter against `lib/db/client.ts`.
 * - Magic-link as the primary auth path; GitHub + Google OAuth optional.
 * - Email transport defaults to console-logging the magic link in dev so
 *   the project boots without an email provider; in production we expect
 *   a Resend (or other) transport to be wired in via env.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const sendMagicLink = async ({ email, url }: { email: string; url: string }) => {
  if (env.RESEND_API_KEY) {
    // Phase 17 wires the Resend transport. Until then we still
    // log so a developer can copy the link from the server console.
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM ?? "AutoApply.AI <noreply@autoapply.ai>",
          to: email,
          subject: "Sign in to AutoApply.AI",
          text: `Click to sign in:\n${url}\n\nIf you didn't request this, ignore.`,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      logger.error({ err, email }, "magic-link send failed");
    }
  }
  // Always log in non-production so dev iteration doesn't depend on email.
  if (env.NODE_ENV !== "production") {
    logger.info({ email, url }, "magic-link issued (dev console transport)");
  }
};

const oauthProviders: Record<string, { clientId: string; clientSecret: string }> = {};
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  oauthProviders.github = {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  };
}
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  oauthProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: { enabled: false },
  socialProviders: oauthProviders,
  plugins: [magicLink({ sendMagicLink })],
  user: {
    additionalFields: {
      currencyPref: { type: "string", required: false },
      defaultProvider: { type: "string", required: false },
      defaultModel: { type: "string", required: false },
      redactPii: { type: "boolean", required: false, defaultValue: true },
      accentHex: { type: "string", required: false },
      cardStyle: { type: "string", required: false, defaultValue: "ledger" },
      fitViz: { type: "string", required: false, defaultValue: "ring" },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min
    },
  },
});

export type Auth = typeof auth;
