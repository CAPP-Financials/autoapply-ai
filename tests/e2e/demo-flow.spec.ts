import { test, expect } from "@playwright/test";

/**
 * /demo is the fixture-replay surface: it must work with no account, no API
 * key, and no model call.
 *
 * These assert STRUCTURE, never fixture contents. The previous version checked
 * for "Linear", "Notion", "Vercel"… which passed *because* the data was fake —
 * it would have kept passing after the real dashboard broke. A test that only
 * proves the fixtures are still hardcoded proves nothing about the product.
 */
test.describe("demo (fixture replay)", () => {
  test("landing offers the demo without signup", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /try the demo/i })).toBeVisible();
  });

  test("demo renders the dashboard anonymously and says it is sample data", async ({ page }) => {
    await page.goto("/demo");
    await expect(page).toHaveURL(/\/demo$/); // never bounced to /sign-in
    await expect(page.getByText(/sample data/i)).toBeVisible();
    await expect(page.getByText(/job ledger/i)).toBeVisible();
    await expect(page.getByText(/jobs analyzed/i)).toBeVisible();
  });

  test("demo ledger renders a row per fixture job", async ({ page }) => {
    await page.goto("/demo");
    // Count rows rather than naming companies: this fails if the ledger stops
    // rendering, and survives the fixtures being edited.
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test("demo KPIs are computed, not placeholders", async ({ page }) => {
    await page.goto("/demo");
    // computeKpis() must produce a real percentage; "—" means the empty-state
    // path leaked into a populated dashboard.
    await expect(page.getByText(/^\d+%$/).first()).toBeVisible();
  });

  test("demo never calls a provider", async ({ page }) => {
    const providerCalls: string[] = [];
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (/anthropic|openai|googleapis|groq|openrouter/.test(url)) providerCalls.push(url);
      return route.continue();
    });
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
    expect(providerCalls).toEqual([]);
  });

  test("demo hydrates without React errors", async ({ page }) => {
    // Nothing in CI caught the Sidebar rendering "ssr0" server-side and
    // Math.random() client-side. typecheck/lint/build are all blind to it;
    // only a real browser sees the mismatch.
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    const hydration = errors.filter((e) => /hydrat|did not match|didn't match/i.test(e));
    expect(hydration, `hydration errors:\n${hydration.join("\n")}`).toEqual([]);
  });

  test("healthz responds 200", async ({ request }) => {
    const r = await request.get("/api/healthz");
    expect(r.ok()).toBe(true);
    const body = await r.json();
    expect(body.ok).toBe(true);
  });
});
