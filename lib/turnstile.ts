/**
 * Cloudflare Turnstile verification.
 *
 * The client renders the widget with `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and
 * submits the resulting token; the server posts it back to Cloudflare with
 * `TURNSTILE_SECRET_KEY` to verify. Returns true if missing config — that
 * matches the dev-friendly posture, but production deploys should always
 * have the secret set.
 */
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (env.NODE_ENV === "production") {
      logger.warn("Turnstile not configured — challenge bypassed");
    }
    return true;
  }
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const json = (await res.json()) as { success?: boolean };
    return Boolean(json.success);
  } catch (err) {
    logger.warn({ err }, "Turnstile verify failed");
    return false;
  }
}
