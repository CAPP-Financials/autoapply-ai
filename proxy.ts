/**
 * Next 16 Proxy (formerly middleware) — auth routing + minimal CSP.
 * Full hardening (rate limit, audit, Turnstile injection) lands in Phase 14.
 *
 * Better Auth sessions live in HttpOnly cookies; here we just check
 * presence of a session cookie cheap to avoid cold-DB hits in proxy.
 * The actual session validation happens in `requireSession()` server-side.
 */
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/resume", "/jobs", "/results", "/tracker", "/settings"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Phase 1: while auth isn't fully wired into the (app) layout we
  // intentionally don't block protected paths — the demo flows through
  // them with fixture data. Phase 3 flips this on by setting
  // ENABLE_AUTH=1 in env.
  const enabled = process.env.ENABLE_AUTH === "1";
  if (enabled && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const cookie = req.cookies.get("better-auth.session_token");
    if (!cookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  const res = NextResponse.next();

  // Hardening headers (full CSP via nonces lands in Phase 14).
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  return res;
}

export const config = {
  matcher: [
    // Exclude static assets, /_next, /api/auth (Better Auth manages its own
    // cookies/CSRF), favicon, and Next's image optimization.
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
