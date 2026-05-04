import { test, expect } from "@playwright/test";

/**
 * Smoke test for the design parity flow: every screen renders against
 * fixture MOCK_JOBS without requiring auth or real provider keys.
 */
test.describe("demo flow (fixture data)", () => {
  test("landing → demo redirect → resume", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/autoapply.*\.ai/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /try the demo/i })).toBeVisible();
    await page.goto("/demo");
    // /demo redirects to /resume
    await page.waitForURL(/\/resume$/);
    await expect(page.getByRole("heading", { name: /upload your resume/i })).toBeVisible();
  });

  test("jobs screen renders the streaming console", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByText(/paste jd/i)).toBeVisible();
    await expect(page.getByText(/analysis console/i)).toBeVisible();
    await expect(page.getByText(/batch progress/i, { exact: false })).toBeVisible();
  });

  test("results dashboard shows KPIs and ledger", async ({ page }) => {
    await page.goto("/results");
    await expect(page.getByText(/jobs analyzed/i)).toBeVisible();
    await expect(page.getByText(/avg fit/i)).toBeVisible();
    await expect(page.getByText(/job ledger/i)).toBeVisible();
    // The 6 mock companies in the ledger.
    for (const co of ["Linear", "Notion", "Vercel", "Stripe", "Supabase", "Raycast"]) {
      await expect(page.getByText(co, { exact: true }).first()).toBeVisible();
    }
  });

  test("job detail (Linear) renders radar + tabs", async ({ page }) => {
    await page.goto("/jobs/j1");
    await expect(page.getByRole("heading", { name: /staff frontend engineer/i })).toBeVisible();
    await expect(page.getByText(/skill radar/i)).toBeVisible();
    await page.getByRole("button", { name: /cover letter/i }).click();
    await expect(page.getByText(/cover_letter\.md/i)).toBeVisible();
  });

  test("tracker shows applications by status", async ({ page }) => {
    await page.goto("/tracker");
    for (const col of ["Ready", "Applied", "Interviewing", "Offer", "Rejected"]) {
      await expect(page.getByText(col, { exact: true }).first()).toBeVisible();
    }
  });

  test("healthz responds 200", async ({ request }) => {
    const r = await request.get("/api/healthz");
    expect(r.ok()).toBe(true);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(body.name).toBe("autoapply-ai");
  });
});
