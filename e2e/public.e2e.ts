/** Everything a signed-out visitor can reach: marketing and legal pages, the referral and demo
 *  forms, the public API routes, the signed-out redirects and the error pages. */
import { test, expect, statePath } from "./fixtures";
import { BASE_URL } from "./env";
import { sql } from "./db";

const PUBLIC_ROUTES = [
  "/",
  "/how-it-works",
  "/for-consultants",
  "/get-matched",
  "/demo",
  "/pricing/agency",
  "/pricing/agency/submitted",
  "/security",
  "/privacy",
  "/terms",
  "/dpa",
  "/login",
  "/signup",
];

const SIGN_IN_URL = /\/login|sign-in|accounts\./;

// ---------------------------------------------------------------------------
// 1. Every public route renders
// ---------------------------------------------------------------------------
// Intermittent, not asserted as a failure: on 2026-11-13 the first run of this file hit a React
// hydration error ("Hydration failed because the server rendered HTML didn't match the client") on
// /login and /signup, in the Clerk <SignIn/> and <SignUp/> components (app/login/[[...sign-in]],
// app/signup/[[...sign-up]]). The next run and a direct probe did not reproduce it. Left unmarked
// so the suite stays green; if it shows up again, record it as a BUG with the evidence.
for (const route of PUBLIC_ROUTES) {
  test(`renders ${route} with a heading and no errors`, async ({ page }) => {
    const waitUntil = route === "/login" || route === "/signup" ? "load" : "domcontentloaded";
    const response = await page.goto(route, { waitUntil });
    expect(response, `no response for ${route}`).not.toBeNull();
    expect(response!.status(), `status for ${route}`).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });
}

// ---------------------------------------------------------------------------
// 2. /pricing redirects to /for-consultants
// ---------------------------------------------------------------------------
test("/pricing redirects to /for-consultants, which shows a Pricing section", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page).toHaveURL(/\/for-consultants$/);
  await expect(page.getByRole("heading", { name: "Pricing", exact: true })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 3. Link check: every same-origin link on the public pages resolves
// ---------------------------------------------------------------------------
test("every same-origin link on the public pages resolves below 400", async ({ page, request }) => {
  const origin = new URL(BASE_URL).origin;
  const found = new Set<string>();

  for (const route of PUBLIC_ROUTES) {
    const waitUntil = route === "/login" || route === "/signup" ? "load" : "domcontentloaded";
    await page.goto(route, { waitUntil });
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    for (const href of hrefs) {
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) continue;
      const url = new URL(href, `${origin}${route}`);
      if (url.origin !== origin) continue;
      found.add(url.pathname + url.search);
    }
  }

  const broken: string[] = [];
  for (const path of [...found].sort()) {
    const res = await request.get(path, { failOnStatusCode: false });
    if (res.status() >= 400) broken.push(`${res.status()} ${path}`);
  }

  // BUG check: a failing list here is a real broken link on a public page, not a test problem.
  expect(broken, `broken links (checked ${found.size} paths)`).toEqual([]);
});

// ---------------------------------------------------------------------------
// 4. Signed-out access to app and admin routes
// ---------------------------------------------------------------------------
const PROTECTED_ROUTES = ["/consultant", "/consultant/clients/demo_bayb", "/admin/accounts", "/checkout"];

for (const route of PROTECTED_ROUTES) {
  test(`signed out: ${route} sends the visitor to sign-in and shows no app data`, async ({ page, allowErrors }) => {
    // Clerk's hosted sign-in page (accounts.dev) logs a CSP note. It is not app code; checked 2026-11-13.
    allowErrors(/script-src/);
    await page.goto(route, { waitUntil: "load" });
    await expect(page).toHaveURL(SIGN_IN_URL);
    await expect(page.getByText("Bayshore Bottling")).toHaveCount(0);
    await expect(page.getByText("Golden Gate Coffee")).toHaveCount(0);
  });
}

test("signed out: /onboarding sends the visitor to /login", async ({ page }) => {
  await page.goto("/onboarding", { waitUntil: "load" });
  await expect(page).toHaveURL(/\/login/);
});

// ---------------------------------------------------------------------------
// 5. Missing page and invalid tokens
// ---------------------------------------------------------------------------
test.describe("unknown path, signed in", () => {
  test.use({ storageState: statePath("a") });

  test("an unknown path shows the 404 page, not a server error", async ({ page, allowErrors }) => {
    // The browser logs every 404 document response; that is the expected status here.
    allowErrors(/status of 404 \(Not Found\)/);
    const response = await page.goto("/this-does-not-exist");
    expect(response!.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});

// BUG: a signed-out visitor to an unknown path is sent to Clerk's sign-in page instead of the
// 404 page. Expected: 404 page with "Page not found" (the signed-out 404 the brief asks for).
// Actual: middleware.ts runs auth.protect() on every path that is not in isPublicRoute, before
// Next.js resolves the route, so /this-does-not-exist redirects to choice-sloth-54.accounts.dev/sign-in
// (status 200 after redirect). Checked 2026-11-13. Decide whether a 404 page is wanted here.
test.fail("BUG: signed-out unknown path shows the 404 page", async ({ page, allowErrors }) => {
  allowErrors(/script-src/);
  const response = await page.goto("/this-does-not-exist");
  expect(response!.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("a fake portal token shows a friendly message", async ({ page }) => {
  const response = await page.goto("/portal/not-a-real-token");
  expect(response!.status()).toBeLessThan(500);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("a fake shared token shows a friendly message", async ({ page }) => {
  const response = await page.goto("/shared/not-a-real-token");
  expect(response!.status()).toBeLessThan(500);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 6. Homepage navigation and example dashboard
// ---------------------------------------------------------------------------
test.describe("homepage at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Menu opens the links and Escape closes them", async ({ page }) => {
    await page.goto("/");
    const menu = page.getByRole("button", { name: "Menu", exact: true });
    await expect(menu).toHaveAttribute("aria-expanded", "false");

    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    const mobileNav = page.getByRole("navigation", { name: "Mobile" });
    await expect(mobileNav.getByRole("link", { name: "How it works" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Sign in" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(mobileNav.getByRole("link", { name: "How it works" })).toBeHidden();
  });
});

test("example dashboard: selecting another ledger row changes How calculated", async ({ page }) => {
  await page.goto("/");
  const example = page.getByRole("region", { name: "Example data request" });
  const rows = example.getByRole("table").getByRole("button");
  await expect(rows.nth(1)).toBeVisible();

  const panel = page.getByRole("complementary", { name: "How calculated" });
  const before = await panel.innerText();

  await rows.nth(1).click();
  await expect(rows.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(panel).not.toHaveText(before);
});

// ---------------------------------------------------------------------------
// 7. /get-matched referral form
// ---------------------------------------------------------------------------
test("get-matched: an empty submit is blocked by the browser and does not navigate", async ({ page }) => {
  await page.goto("/get-matched");
  await page.getByRole("button", { name: "Request an introduction" }).click();
  // Browser validation focuses the first invalid field and keeps the page on the form.
  await expect(page.locator('input[name="name"]')).toBeFocused();
  await expect(page).toHaveURL(`${BASE_URL}/get-matched`);
  await expect(page.getByRole("heading", { name: "Request received" })).toHaveCount(0);
});

test("get-matched: a valid submit shows the success state and writes a lead", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  try {
    await page.goto("/get-matched");
    await page.locator('input[name="name"]').fill("E2E Tester");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="company"]').fill("E2E Co");
    await page.getByRole("button", { name: "Request an introduction" }).click();

    await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();

    const rows = await sql<{ id: string; company: string }>(
      "select id, company from referral_leads where email = $1",
      [email]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].company).toBe("E2E Co");
  } finally {
    await sql("delete from referral_leads where email = $1", [email]);
  }
});

// ---------------------------------------------------------------------------
// 8. /demo request form
// ---------------------------------------------------------------------------
test("demo: a valid request shows the success state with no booking link", async ({ page }) => {
  await page.goto("/demo");
  await page.getByPlaceholder("Alex Johnson").fill("E2E Tester");
  await page.getByPlaceholder("alex@company.com").fill(`e2e-demo-${Date.now()}@example.com`);
  await page.getByPlaceholder("Pacific Coast Logistics").fill("E2E Co");
  await page.getByRole("button", { name: "Request demo" }).click();

  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();
  // NEXT_PUBLIC_CALENDLY_URL is unset on the test server, so no booking link appears.
  await expect(page.getByRole("link", { name: "Book a time" })).toHaveCount(0);
  await expect(page.locator('a[href*="calendly"]')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// 9. /pricing/agency quote form
// ---------------------------------------------------------------------------
test("agency quote: filling the required fields lands on the submitted page", async ({ page }) => {
  await page.goto("/pricing/agency");
  await page.locator('input[name="name"]').fill("E2E Tester");
  await page.locator('input[name="email"]').fill(`e2e-agency-${Date.now()}@example.com`);
  await page.locator('input[name="firm"]').fill("E2E Partners");
  await page.locator('select[name="team_size"]').selectOption("2–5");
  await page.locator('select[name="client_count"]').selectOption("Under 10");
  await page.locator('select[name="timeline"]').selectOption("ASAP");
  await page.getByRole("button", { name: "Submit request" }).click();

  await expect(page).toHaveURL(/\/pricing\/agency\/submitted$/);
  await expect(page.getByRole("heading", { name: "Thanks, we have your request" })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 10. Public API routes
// ---------------------------------------------------------------------------
test("POST /api/track accepts an allowed event and rejects an unknown one", async ({ request }) => {
  const sessionId = `e2e_track_${Date.now()}`;
  try {
    const ok = await request.post("/api/track", {
      data: { eventName: "page_view", path: "/", sessionId },
      failOnStatusCode: false,
    });
    expect(ok.status()).toBeGreaterThanOrEqual(200);
    expect(ok.status()).toBeLessThan(300);

    const bad = await request.post("/api/track", {
      data: { eventName: "not_an_allowed_event", path: "/", sessionId },
      failOnStatusCode: false,
    });
    expect(bad.status()).toBeGreaterThanOrEqual(400);
    expect(bad.status()).toBeLessThan(500);
  } finally {
    await sql("delete from marketing_events where session_id = $1", [sessionId]);
  }
});

test("GET /api/cron/reminders needs the cron secret", async ({ request }) => {
  const noAuth = await request.get("/api/cron/reminders", { failOnStatusCode: false });
  expect(noAuth.status()).toBe(401);

  const withAuth = await request.get("/api/cron/reminders", {
    headers: { Authorization: "Bearer e2e-cron-secret" },
    failOnStatusCode: false,
  });
  expect(withAuth.status()).toBe(200);
});

test("POST /api/webhooks/stripe rejects a junk body with no signature", async ({ request }) => {
  const res = await request.post("/api/webhooks/stripe", {
    headers: { "Content-Type": "text/plain" },
    data: "junk, not a stripe event",
    failOnStatusCode: false,
  });
  expect(res.status()).toBeGreaterThanOrEqual(400);
  expect(res.status()).toBeLessThan(500);
});
