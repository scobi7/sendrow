/** Tenant isolation and the admin gate, end to end. Consultant A owns the demo workspace (and is
 *  the admin). Consultant B owns nothing. Every denial below must be a real denial: A's copies of
 *  the same pages must load, so a broken page cannot pass as "no leak". See contracts/invariants.md
 *  §6 (company scope), §7 (consultant ownership) and §8 (portal tokens). */
import type { APIResponse, Browser, BrowserContext, Page } from "@playwright/test";
import { test, expect, pageAs, statePath } from "./fixtures";
import { BASE_URL, type UserKey } from "./env";
import { sql } from "./db";

/** Every client name in the demo workspace. None may appear in B's view. */
const A_NAMES = ["Golden Gate Coffee", "Bayshore", "Pacific Coast", "Sierra Materials"];

/** A's client pages, each with the client name A must see there. */
const CLIENT_PAGES: { path: string; name: string }[] = [
  { path: "/consultant/clients/demo_bayb", name: "Bayshore Bottling" },
  { path: "/consultant/clients/demo_pcl", name: "Pacific Coast Logistics" },
  { path: "/consultant/clients/demo_ggcr", name: "Golden Gate Coffee" },
  { path: "/consultant/clients/demo_smx", name: "Sierra Materials" },
  { path: "/consultant/clients/demo_bayb/ledger", name: "Bayshore Bottling" },
  { path: "/consultant/clients/demo_bayb/review", name: "Bayshore Bottling" },
  { path: "/consultant/clients/demo_bayb/activity", name: "Bayshore Bottling" },
  { path: "/consultant/clients/demo_bayb/manage", name: "Bayshore Bottling" },
  { path: "/consultant/clients/demo_bayb/manage/scope1", name: "Bayshore Bottling" },
  { path: "/consultant/clients/demo_bayb/manage/scope2", name: "Bayshore Bottling" },
  { path: "/consultant/clients/demo_bayb/manage/scope3", name: "Bayshore Bottling" },
  { path: "/consultant/clients/demo_bayb/manage/reports", name: "Bayshore Bottling" },
  { path: "/consultant/clients/demo_pcl/snapshots/snap_demo_pcl_1", name: "Pacific Coast Logistics" },
  { path: "/consultant/clients/demo_ggcr/requests/dr_demo_ggcr_1/chasing", name: "Golden Gate Coffee" },
];

/** ADMIN_PAGES: the routes middleware.ts gates on ADMIN_CLERK_ID. */
const ADMIN_PAGES = ["/admin/accounts", "/admin/factors", "/admin/referrals", "/admin/waitlist"];

/** lib/formats.ts FORMATS keys: every format the snapshot export route supports. */
const SNAPSHOT_FORMATS = ["excel", "sb253", "questionnaire", "pact"];

/** Chrome logs every 404 response as a console error. A denied page is supposed to be a 404, so
 *  those console lines are ignored only when the test has also seen the matching 404 response. */
const NOT_FOUND_CONSOLE = /status of 404 \(Not Found\)/;

/** Closing a context can fail with ENOENT while Playwright writes its trace files, because this
 *  repo's path contains parentheses ("codine (coding)"). The test has already decided by then, so
 *  that close error is ignored. */
const closeQuietly = (context: BrowserContext) => context.close().catch(() => {});

const url = (p: string) => `${BASE_URL}${p}`;

/** A context signed in as `user` (or signed out when omitted), with the base URL set so
 *  relative API paths work. Close it when done. */
async function contextFor(browser: Browser, user?: UserKey) {
  const context = await browser.newContext({ baseURL: BASE_URL, ...(user ? { storageState: statePath(user) } : {}) });
  if (user) {
    // Clerk renews the short-lived session cookie in the browser, not in a bare request context.
    // Without this page visit the API call arrives unauthenticated, and Clerk's auth.protect()
    // answers 404 to it. That would look like a denial even for the owner, so warm the session up.
    const page = await context.newPage();
    await page.goto("/consultant");
    await page.close();
  }
  return context;
}

/** A denied API response: a 401, 403 or 404 with none of A's client names in the body. */
async function expectDenied(res: APIResponse, label: string) {
  expect([401, 403, 404], `${label}: status`).toContain(res.status());
  const body = await res.text();
  for (const name of A_NAMES) expect(body, `${label}: body leaks "${name}"`).not.toContain(name);
}

/** Records the path of every 404 response the page receives. */
function track404s(page: Page): string[] {
  const seen: string[] = [];
  page.on("response", (r) => {
    if (r.status() === 404) seen.push(new URL(r.url()).pathname);
  });
  return seen;
}

test.describe("consultant B cannot open A's client pages", () => {
  for (const { path } of CLIENT_PAGES) {
    test(`B gets a 404 and no client data on ${path}`, async ({ browser, problems, allowErrors }) => {
      // Chrome logs the expected 404 response as a console error.
      allowErrors(/status of 404 \(Not Found\)/);
      const page = await pageAs(browser, "b", problems);
      try {
        const res = await page.goto(url(path));
        expect(res?.status(), `${path}: status`).toBe(404);
        const text = await page.locator("body").innerText();
        for (const name of A_NAMES) expect(text, `${path}: page shows "${name}"`).not.toContain(name);
      } finally {
        await closeQuietly(page.context());
      }
      expect(problems.list.filter((p) => !problems.allow.some((r) => r.test(p))), "console errors, page errors or 5xx").toEqual([]);
    });
  }

  // B must get the same 404 and "Page not found" screen (with noindex) that a client id that never
  // existed gets, so a page never confirms that a client exists. Until 2026-11-13 these pages streamed
  // behind app/consultant/loading.tsx and answered 200 (a soft 404); that file is gone.
  test("B gets the not-found screen on A's client pages, same as for a made-up id", async ({ browser, problems, allowErrors }) => {
    test.setTimeout(600_000);
    allowErrors(/status of 404 \(Not Found\)/);
    const page = await pageAs(browser, "b", problems);
    try {
      for (const { path } of [...CLIENT_PAGES, { path: "/consultant/clients/co_does_not_exist" }]) {
        const res = await page.goto(url(path));
        expect(res?.status(), `${path}: status`).toBe(404);
        await expect(page.getByText("Page not found"), `${path}: not-found screen`).toBeVisible();
        await expect(page.locator('meta[name="robots"][content*="noindex"]'), `${path}: noindex`).toHaveCount(1);
      }
    } finally {
      await closeQuietly(page.context());
    }
  });

  test("B's own dashboard lists none of A's clients", async ({ browser, problems }) => {
    const page = await pageAs(browser, "b", problems);
    try {
      const res = await page.goto(url("/consultant"));
      expect(res?.status()).toBe(200);
      const text = await page.locator("body").innerText();
      for (const name of A_NAMES) expect(text, `dashboard shows "${name}"`).not.toContain(name);
    } finally {
      await closeQuietly(page.context());
    }
    expect(problems.list.filter((p) => !problems.allow.some((r) => r.test(p))), "console errors, page errors or 5xx").toEqual([]);
  });

  test("the Cmd+K search lists none of A's clients for B", async ({ browser, problems }) => {
    const page = await pageAs(browser, "b", problems);
    try {
      await page.goto(url("/consultant"));
      await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      const text = await dialog.innerText();
      for (const name of A_NAMES) expect(text, `command menu shows "${name}"`).not.toContain(name);
    } finally {
      await closeQuietly(page.context());
    }
    expect(problems.list.filter((p) => !problems.allow.some((r) => r.test(p))), "console errors, page errors or 5xx").toEqual([]);
  });
});

test.describe("consultant A (owner) sees the same pages", () => {
  test.use({ storageState: statePath("a") });

  for (const { path, name } of CLIENT_PAGES) {
    test(`A sees ${name} on ${path}`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status(), `${path}: status`).toBe(200);
      await expect(page.locator("body"), `${path}: client name`).toContainText(name);
    });
  }

  test("the Cmd+K search lists A's clients", async ({ page }) => {
    await page.goto("/consultant");
    await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Bayshore Bottling");
    await expect(dialog).toContainText("Pacific Coast Logistics");
  });
});

test.describe("API tenant isolation", () => {
  test("client export: B is denied, A gets a zip, signed out is not 200", async ({ browser, request }) => {
    const b = await contextFor(browser, "b");
    try {
      await expectDenied(await b.request.get("/api/clients/demo_bayb/export"), "B client export");
    } finally {
      await closeQuietly(b);
    }

    const a = await contextFor(browser, "a");
    try {
      const res = await a.request.get("/api/clients/demo_bayb/export");
      expect(res.status(), "A client export status").toBe(200);
      expect(res.headers()["content-type"], "A client export content-type").toContain("application/zip");
    } finally {
      await closeQuietly(a);
    }

    const out = await request.get("/api/clients/demo_bayb/export");
    expect(out.status(), "signed-out client export status").not.toBe(200);
  });

  for (const format of SNAPSHOT_FORMATS) {
    test(`snapshot export (${format}): B is denied, A gets a file, signed out is not 200`, async ({ browser, request }) => {
      const path = `/api/snapshots/snap_demo_pcl_1/export?format=${format}`;
      const b = await contextFor(browser, "b");
      try {
        await expectDenied(await b.request.get(path), `B ${format} export`);
      } finally {
        await closeQuietly(b);
      }

      const a = await contextFor(browser, "a");
      try {
        const res = await a.request.get(path);
        expect(res.status(), `A ${format} export status`).toBe(200);
        expect(res.headers()["content-type"], `A ${format} content-type`).toBeTruthy();
        expect(res.headers()["content-type"], `A ${format} content-type`).not.toContain("text/html");
        expect(res.headers()["content-disposition"], `A ${format} disposition`).toContain("attachment");
        expect((await res.body()).length, `A ${format} body`).toBeGreaterThan(0);
      } finally {
        await closeQuietly(a);
      }

      const out = await request.get(path);
      expect(out.status(), `signed-out ${format} export status`).not.toBe(200);
    });
  }

  test("PDF report: B is denied and signed out is not 200", async ({ browser, request }) => {
    const path = "/api/report/pdf?companyId=demo_bayb";
    const b = await contextFor(browser, "b");
    try {
      await expectDenied(await b.request.get(path), "B PDF report");
    } finally {
      await closeQuietly(b);
    }

    const out = await request.get(path);
    expect(out.status(), "signed-out PDF status").not.toBe(200);
  });

  test("PDF report: A gets a PDF", async ({ browser }) => {
    // Seen once on 2026-11-13 as HTTP 500 with an empty body on the first hit after a dev compile
    // (not reproduced on the next runs). If it returns, treat it as a bug in app/api/report/pdf/route.tsx.
    const a = await contextFor(browser, "a");
    try {
      const res = await a.request.get("/api/report/pdf?companyId=demo_bayb");
      expect(res.status(), "A PDF status").toBe(200);
      expect(res.headers()["content-type"], "A PDF content-type").toContain("application/pdf");
    } finally {
      await closeQuietly(a);
    }
  });

  test("evidence file: B is denied, A gets 200, signed out is not 200", async ({ browser, request }) => {
    // Evidence is not seeded by scripts/reset-demo.ts. Use an existing row, never create one.
    const rows = await sql<{ id: string }>("select id from evidence where company_id = $1 limit 1", ["demo_bayb"]);
    test.skip(rows.length === 0, "no evidence row for demo_bayb in the test database; nothing created (per brief)");
    const path = `/api/evidence/${rows[0].id}`;

    const b = await contextFor(browser, "b");
    try {
      await expectDenied(await b.request.get(path), "B evidence");
    } finally {
      await closeQuietly(b);
    }

    const a = await contextFor(browser, "a");
    try {
      const res = await a.request.get(path);
      expect(res.status(), "A evidence status").toBe(200);
    } finally {
      await closeQuietly(a);
    }

    const out = await request.get(path);
    expect(out.status(), "signed-out evidence status").not.toBe(200);
  });
});

test.describe("audit log export is admin only", () => {
  test("B is denied, A (admin and owner) gets CSV, signed out is not 200", async ({ browser, request }) => {
    const path = "/api/events/export?companyId=demo_bayb";
    const b = await contextFor(browser, "b");
    try {
      await expectDenied(await b.request.get(path), "B events export");
    } finally {
      await closeQuietly(b);
    }

    const a = await contextFor(browser, "a");
    try {
      const res = await a.request.get(path);
      expect(res.status(), "A events export status").toBe(200);
      expect(res.headers()["content-type"], "A events content-type").toContain("text/csv");
    } finally {
      await closeQuietly(a);
    }

    const out = await request.get(path);
    expect(out.status(), "signed-out events export status").not.toBe(200);
  });
});

test.describe("admin gate", () => {
  test.describe("as A (the admin)", () => {
    test.use({ storageState: statePath("a") });

    for (const path of ADMIN_PAGES) {
      test(`${path} loads with a heading`, async ({ page }) => {
        const res = await page.goto(path);
        expect(res?.status()).toBe(200);
        expect(new URL(page.url()).pathname).toBe(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      });
    }
  });

  for (const path of ADMIN_PAGES) {
    test(`as B, ${path} redirects to /consultant`, async ({ browser, problems }) => {
      const page = await pageAs(browser, "b", problems);
      const notFound = track404s(page);
      try {
        await page.goto(url(path));
        await expect(page, `${path} should redirect`).toHaveURL(/\/consultant$/);
        expect(new URL(page.url()).pathname).not.toMatch(/^\/admin/);
        expect(notFound.filter((p) => p !== "/consultant"), `${path}: unexpected 404 responses`).toEqual([]);
      } finally {
        await closeQuietly(page.context());
      }
      expect(problems.list.filter((p) => !NOT_FOUND_CONSOLE.test(p)), "console errors, page errors or 5xx").toEqual([]);
    });
  }

  test("signed out, admin pages do not open", async ({ browser, problems }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    try {
      for (const path of ADMIN_PAGES) {
        // Clerk sends a signed-out visitor to its sign-in page; do not wait for that page to finish loading.
        await page.goto(url(path), { waitUntil: "commit" });
        await page.waitForURL((u) => !u.pathname.startsWith("/admin"), { timeout: 30_000, waitUntil: "commit" });
      }
    } finally {
      await closeQuietly(context);
    }
    expect(problems.list.filter((p) => !problems.allow.some((r) => r.test(p))), "console errors, page errors or 5xx").toEqual([]);
  });
});

test.describe("portal APIs reject a bogus token", () => {
  // Bodies are shaped like the real calls (see app/api/portal/*/route.ts). Every token here is
  // made up, so each route must answer 4xx: never a 5xx, never a 2xx.
  const BOGUS = "e2e-not-a-real-token";
  const CALLS: { path: string; body: Record<string, unknown> }[] = [
    {
      path: "/api/portal/import",
      body: { token: BOGUS, itemId: "item_1", rows: [{ date: "2025-01-01", activity_type: "electricity", quantity: "100", unit: "kWh" }], filename: "e2e.csv", source: "entry" },
    },
    { path: "/api/portal/line-comment", body: { token: BOGUS, lineItemId: "li_demo_bayb_6", message: "e2e reply" } },
    { path: "/api/portal/mapping-preview", body: { token: BOGUS, itemId: "item_1", headers: ["Date", "kWh"] } },
    { path: "/api/portal/request-new-link", body: { token: BOGUS } },
    { path: "/api/portal/stuck", body: { token: BOGUS, itemId: "item_1", message: "e2e stuck" } },
    { path: "/api/portal/delegate", body: { token: BOGUS, locationId: "loc_demo_smx_ca", contactName: "", contactEmail: "" } },
  ];

  for (const { path, body } of CALLS) {
    test(`POST ${path} answers 4xx`, async ({ request }) => {
      const res = await request.post(path, { data: body });
      expect(res.status(), `${path} status`).toBeGreaterThanOrEqual(400);
      expect(res.status(), `${path} status`).toBeLessThan(500);
    });
  }
});

test.describe("shared snapshot link works signed out", () => {
  test("the share link shows the frozen snapshot with no edit controls", async ({ page }) => {
    const rows = await sql<{ token: string }>("select token from share_links where snapshot_id = $1 limit 1", ["snap_demo_pcl_1"]);
    expect(rows.length, "a share link for snap_demo_pcl_1 exists").toBe(1);

    const res = await page.goto(`/shared/${rows[0].token}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("Pacific Coast Logistics");

    await expect(page.getByRole("textbox")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /edit|delete|approve|save|remove|freeze|archive/i })).toHaveCount(0);
  });
});
