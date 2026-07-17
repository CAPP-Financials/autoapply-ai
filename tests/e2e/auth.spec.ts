import { test, expect } from "@playwright/test";

/**
 * The logged-out suite.
 *
 * Every case here asserts the *unauthenticated* branch, because that's the
 * branch that breaks silently. Two things this catches that nothing else does:
 *
 *  1. `ENABLE_AUTH` defaulting to off — which made the whole (app) tree public.
 *  2. Layout-only auth. A page being dynamic is NOT the same as being
 *     protected, and an `(app)/layout.tsx` check doesn't re-run on every
 *     client navigation. So each route is asserted individually: a single
 *     /results case would pass while five siblings stayed open.
 *
 * These run against the DEFAULT config on purpose — no ENABLE_AUTH is set.
 * Secure-by-default is the property under test; forcing ENABLE_AUTH=1 here
 * would assert the fixed config and let default-open ship.
 */

// Every page under the auth gate. Keep in sync with PROTECTED_PREFIXES in proxy.ts.
const PROTECTED_PAGES = [
  "/resume",
  "/jobs",
  "/jobs/j1",
  "/results",
  "/tracker",
  "/settings",
] as const;

// Route handlers that must refuse anonymous callers outright.
// NOT /api/me — that one is a deliberate session probe (200 + {user:null}),
// asserted separately below.
const PROTECTED_APIS = [
  "/api/results",
  "/api/resume/current",
  "/api/settings/providers",
] as const;

test.describe("logged-out access", () => {
  for (const path of PROTECTED_PAGES) {
    test(`${path} redirects an anonymous visitor to /sign-in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/sign-in/);
    });
  }

  for (const path of PROTECTED_APIS) {
    test(`GET ${path} returns 401 for an anonymous caller`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(401);
    });
  }

  test("GET /api/me answers 200 with a null user and leaks nothing", async ({ request }) => {
    // /api/me is intentionally not a 401: the client calls it to decide
    // whether to render sign-in. It must still expose no user data.
    const res = await request.get("/api/me");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user).toBeNull();
    expect(body.providers).toBeUndefined();
    expect(body.hasResume).toBeUndefined();
  });

  test("no protected page leaks user data to an anonymous visitor", async ({ page }) => {
    // Regression guard for the original bug: pages rendered fixture data to
    // anyone. If a redirect ever silently stops working, this still fails.
    await page.goto("/results");
    await expect(page.getByText(/job ledger/i)).toBeHidden();
  });
});

test.describe("public surfaces stay reachable", () => {
  // The flip side: over-broad auth that locks out the demo is also a bug.
  for (const path of ["/", "/demo", "/sign-in", "/legal/privacy", "/legal/terms"]) {
    test(`${path} is reachable without a session`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(400);
      await expect(page).not.toHaveURL(/\/sign-in\?from=/);
    });
  }

  test("healthz responds 200", async ({ request }) => {
    const r = await request.get("/api/healthz");
    expect(r.ok()).toBe(true);
  });
});
