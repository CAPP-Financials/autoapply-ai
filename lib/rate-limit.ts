/**
 * Sliding-window rate limit via Upstash Redis. No-op (always allow) when
 * Upstash isn't configured — useful for local dev. Production deploys
 * should always have these env vars set.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

let _redis: Redis | null = null;
function redis(): Redis | null {
  if (_redis) return _redis;
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

const limiters: Record<string, Ratelimit> = {};
function get(name: string, requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  const r = redis();
  if (!r) return null;
  if (!limiters[name]) {
    limiters[name] = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: false,
      prefix: `rl:${name}`,
    });
  }
  return limiters[name];
}

export type RateLimitVerdict = { ok: true } | { ok: false; reset: number; remaining: number };

export async function checkRate(opts: {
  bucket: "user" | "ip" | "analyze" | "upload";
  key: string;
}): Promise<RateLimitVerdict> {
  const limit =
    opts.bucket === "user"
      ? get("user", 60, "1 m")
      : opts.bucket === "ip"
        ? get("ip", 200, "1 m")
        : opts.bucket === "analyze"
          ? get("analyze", 10, "1 m")
          : get("upload", 3, "1 m");
  if (!limit) {
    if (env.NODE_ENV === "production") {
      logger.warn({ bucket: opts.bucket }, "rate limit misconfigured — Upstash env missing");
    }
    return { ok: true };
  }
  const r = await limit.limit(opts.key);
  if (r.success) return { ok: true };
  return { ok: false, reset: r.reset, remaining: r.remaining };
}
