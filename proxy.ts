/**
 * Next 16 Proxy (formerly middleware) — auth gating + CSP + baseline headers.
 *
 * - Better Auth sessions live in HttpOnly cookies; we just check cookie
 *   presence here (cheap) so unauthenticated users get redirected before
 *   hitting the (app) tree. Real session verification happens server-side
 *   via `requireSession()` in route handlers + page loaders.
 * - CSP uses a per-request nonce so any inline scripts (e.g. Next's
 *   route announcer) can be allowed without `unsafe-inline`.
 */
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/resume", "/jobs", "/results", "/tracker", "/settings"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth gate, opt-in via env until DB is wired in deployment.
  if (
    process.env.ENABLE_AUTH === "1" &&
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    const cookie =
      req.cookies.get("better-auth.session_token") ?? req.cookies.get("better-auth.session-token");
    if (!cookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Per-request nonce for inline scripts.
  const nonce = crypto.randomUUID().replace(/-/g, "");

  const csp = [
    `default-src 'self'`,
    // Next + Turbopack need eval in dev; nonces in prod cover everything else.
    `script-src 'self' 'nonce-${nonce}' ${process.env.NODE_ENV === "production" ? "'strict-dynamic'" : "'unsafe-eval'"} https:`,
    `style-src 'self' 'unsafe-inline' https:`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self' https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com https://api.groq.com https://openrouter.ai https://challenges.cloudflare.com https://*.upstash.io https://*.sentry.io ${process.env.NEXT_PUBLIC_APP_URL ?? ""}`,
    `frame-src https://challenges.cloudflare.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  // Forward the nonce via request header so the layout can attach it.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  return res;
}

export const config = {
  matcher: [
    // Skip static assets, image optimization, /api/auth (Better Auth manages
    // its own CSRF/cookies), and known static files.
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|webp|gif|css|js|map|woff2?)$).*)",
  ],
};
