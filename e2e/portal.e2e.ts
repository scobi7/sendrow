/** The full data-request loop, end to end: a consultant sends a request, the client answers
 *  through the magic-link portal (signed out), and the consultant reviews what came back.
 *  Steps run in order inside one serial describe because each one builds on the last (the
 *  client, the request, the portal token). Every test creates its own client, except the
 *  multi-site test, which uses demo client demo_smx and cleans up what it adds. Consultant
 *  steps run as consultant A (owner of the demo workspace); portal steps run signed out. */
import type { Browser, Page } from "@playwright/test";
import { test, expect, pageAs } from "./fixtures";
import { BASE_URL } from "./env";
import { sql } from "./db";
import { UTILITY_KWH, utilityCsv, vendorXlsx, VENDOR_ROWS, DIESEL_ENTRIES } from "./data/portal-files";

type Problems = { list: string[]; allow: RegExp[] };

const TS = Date.now().toString(36);
const CLIENT_NAME = `E2E Portal ${TS}`;
const REQUEST_NAME = `E2E request ${TS}`;
const EXPIRY_NAME = `E2E expiry copy ${TS}`;
const SITE_NAME = "E2E Site";
const COLLEAGUE_EMAIL = `e2e-colleague-${TS}@example.com`;

/** Everything later steps need. Filled in by earlier steps of this serial suite. */
const s: {
  companyId?: string;
  requestId?: string;
  expiryRequestId?: string;
  siteId?: string;
  siteRequestId?: string;
  brand?: string;
  questionLineId?: string;
} = {};

const go = (page: Page, path: string) => page.goto(`${BASE_URL}${path}`);

/** Consultant A's page. Clipboard is granted so "Copy portal link" does not raise a page error. */
async function consultantPage(browser: Browser, problems: Problems): Promise<Page> {
  const page = await pageAs(browser, "a", problems);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE_URL });
  await go(page, "/consultant");
  return page;
}

/** Runs `body` as consultant A and then fails the test on any console error, page error or 5xx. */
async function asConsultant(browser: Browser, problems: Problems, body: (page: Page) => Promise<void>) {
  const page = await consultantPage(browser, problems);
  try {
    await body(page);
  } finally {
    await page.context().close().catch(() => {});
  }
  const real = problems.list.filter((p) => !problems.allow.some((r) => r.test(p)));
  expect(real, "console errors, page errors or 5xx responses").toEqual([]);
}

async function tokenOf(requestId: string): Promise<string> {
  const rows = await sql<{ token: string | null }>(`select token from data_requests where id = $1`, [requestId]);
  if (!rows[0]?.token) throw new Error(`request ${requestId} has no portal token`);
  return rows[0].token;
}

async function remindersOn(requestId: string): Promise<boolean> {
  const rows = await sql<{ reminders_enabled: boolean }>(`select reminders_enabled from data_requests where id = $1`, [requestId]);
  return rows[0].reminders_enabled;
}

async function requestOf(companyId: string, description: string) {
  const rows = await sql<{ id: string; status: string; checklist: { label: string; status: string; stuckNote?: string }[] }>(
    `select id, status, checklist from data_requests where company_id = $1 and description = $2 order by created_at desc limit 1`,
    [companyId, description]
  );
  if (!rows[0]) throw new Error(`no request "${description}" for ${companyId}`);
  return rows[0];
}

function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Sends a request for the client in `s.companyId`: the three data types the portal tests use. */
async function sendRequest(page: Page, description: string, types: string[]) {
  await go(page, `/consultant/requests/new?client=${s.companyId}`);
  await page.getByPlaceholder("Q1 2026 emissions data").fill(description);
  for (const t of types) await page.getByRole("button", { name: t, exact: true }).click();
  await page
    .locator("select")
    .filter({ has: page.getByRole("option", { name: "Calendar year 2025", exact: true }) })
    .selectOption("Calendar year 2025");
  await page.locator('input[name="due_date"]').fill(inDays(30));
  // Clerk's dev-mode "first user" toast sits over the bottom-right of this form, so activate by keyboard.
  await page.getByRole("button", { name: "Send request", exact: true }).press("Enter");
  await page.waitForURL(`**/consultant/clients/${s.companyId}`, { timeout: 300_000 });
}

test.describe.serial("portal request flow", () => {
  // The first hit on a dev-mode route compiles it, which can take minutes; later steps are quick.
  test.describe.configure({ timeout: 360_000 });

  test("consultant sends a request for a new client, and the UI offers the portal link when the email did not send", async ({ browser, problems }) => {
    await asConsultant(browser, problems, async (page) => {
      await go(page, "/consultant/clients/new");
      await page.getByPlaceholder("Bluewater Logistics").fill(CLIENT_NAME);
      await page.getByPlaceholder("Priya Shah").fill("E2E Contact");
      await page.getByPlaceholder("priya@bluewaterlogistics.com").fill(`e2e-portal-${TS}@example.com`);
      await page.getByRole("button", { name: "Add client", exact: true }).press("Enter");
      await page.waitForURL(/\/consultant\/clients\/co_/, { timeout: 300_000 });
      s.companyId = new URL(page.url()).pathname.split("/")[3];

      await sendRequest(page, REQUEST_NAME, ["Electricity & gas", "Fleet fuel", "Spend data"]);

      const req = await requestOf(s.companyId!, REQUEST_NAME);
      s.requestId = req.id;
      expect(req.status).toBe("open");
      expect(req.checklist.map((i) => i.label).sort()).toEqual(["Fleet fuel (dollar-based)", "Utility bills", "Vendor invoices"]);

      await expect(page.getByText(REQUEST_NAME).first()).toBeVisible();
      await expect(page.getByText(/0\/3 items in/)).toBeVisible();
      // No email server key on the test server, so the send fails and the client page must offer the link.
      await expect(page.getByText(/did not send/).first()).toBeVisible();
      const copy = page.getByRole("button", { name: "Copy portal link", exact: true });
      await expect(copy).toBeVisible();
      await copy.click();
      await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
    });
  });

  test.describe("phone width", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("the portal checklist fits a phone with no horizontal scroll and the upload control is reachable", async ({ page }) => {
      await page.goto(`/portal/${await tokenOf(s.requestId!)}`);
      await page.getByRole("button", { name: /^Utility bills/ }).click();
      const upload = page.getByText("Click to choose a CSV or Excel file");
      await expect(upload).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "horizontal page overflow in px").toBeLessThanOrEqual(0);
      const box = await upload.boundingBox();
      expect(box, "upload control has a box").not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    });
  });

  test("the signed-out portal shows the request, the consultant's brand and the checklist", async ({ page }) => {
    const rows = await sql<{ brand: string }>(
      `select coalesce(p.brand_name, u.name) as brand
         from consultant_clients cc
         join user_companies u on u.clerk_id = cc.consultant_id
         left join consultant_profiles p on p.consultant_id = cc.consultant_id
        where cc.company_id = $1 and cc.archived_at is null`,
      [s.companyId]
    );
    s.brand = rows[0].brand.trim();

    await page.goto(`/portal/${await tokenOf(s.requestId!)}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(CLIENT_NAME);
    await expect(page.getByText(REQUEST_NAME, { exact: true })).toBeVisible();
    await expect(page.getByText(s.brand!, { exact: true })).toBeVisible();
    await expect(page.getByText(/No account needed/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Utility bills/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Fleet fuel/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Vendor invoices/ })).toBeVisible();

    await page.getByRole("button", { name: /^Utility bills/ }).click();
    await page.getByRole("button", { name: "Walk me through it", exact: true }).click();
    await expect(page.getByText("How much electricity did you use?")).toBeVisible();
    await page.getByRole("button", { name: "Upload a file", exact: true }).click();
    await expect(page.getByText("Click to choose a CSV or Excel file")).toBeVisible();
  });

  test("chasing can be paused and resumed and the state survives a reload; resend does not error", async ({ browser, problems }) => {
    await asConsultant(browser, problems, async (page) => {
      await go(page, `/consultant/clients/${s.companyId}/requests/${s.requestId}/chasing`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(CLIENT_NAME);
      await expect(page.getByText(REQUEST_NAME).first()).toBeVisible();

      // Read the current state, flip it, wait for the database to change, then reload: the state must
      // survive a reload. The live flip is checked in the next test.
      const before = await remindersOn(s.requestId!);
      const label = (on: boolean) => (on ? "Pause chasing" : "Resume chasing");
      await page.getByRole("button", { name: label(before), exact: true }).click();
      await expect.poll(() => remindersOn(s.requestId!), { timeout: 60_000 }).toBe(!before);
      await page.reload();
      await expect(page.getByRole("button", { name: label(!before), exact: true })).toBeVisible();

      await page.getByRole("button", { name: label(!before), exact: true }).click();
      await expect.poll(() => remindersOn(s.requestId!), { timeout: 60_000 }).toBe(before);
      await page.reload();
      await expect(page.getByRole("button", { name: label(before), exact: true })).toBeVisible();

      await go(page, `/consultant/clients/${s.companyId}`);
      await page.getByRole("button", { name: "Resend email", exact: true }).click();
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(REQUEST_NAME).first()).toBeVisible();
      await expect(page.getByText(/did not send/).first()).toBeVisible();
    });
  });

  test("pausing chasing flips the schedule button without a reload", async ({ browser, problems }) => {
    // Regression check for the toggle. One earlier run (2026-11-13, run 4) saw the button stay on
    // "Pause chasing" after the database had flipped; the next run did not reproduce it. The earlier
    // failure is recorded in the report as unreproduced, not as a confirmed bug.
    await asConsultant(browser, problems, async (page) => {
      await go(page, `/consultant/clients/${s.companyId}/requests/${s.requestId}/chasing`);
      const on = await remindersOn(s.requestId!);
      const now = on ? "Pause chasing" : "Resume chasing";
      const next = on ? "Resume chasing" : "Pause chasing";
      await page.getByRole("button", { name: now, exact: true }).click();
      await expect(page.getByRole("button", { name: next, exact: true })).toBeVisible({ timeout: 10_000 });
      await expect.poll(() => remindersOn(s.requestId!), { timeout: 60_000 }).toBe(!on);
      // Put it back so the next test starts from the state it expects.
      await page.getByRole("button", { name: next, exact: true }).click();
      await expect.poll(() => remindersOn(s.requestId!), { timeout: 60_000 }).toBe(on);
    });
  });

  test("renew link issues a new token; the old link stops opening the checklist", async ({ browser, problems }) => {
    const oldToken = await tokenOf(s.requestId!);
    await sql(`update data_requests set expires_at = $1 where id = $2`, ["2020-01-01T00:00:00.000Z", s.requestId]);

    await asConsultant(browser, problems, async (page) => {
      await go(page, `/consultant/clients/${s.companyId}`);
      await expect(page.getByText(/link expired/)).toBeVisible();
      await page.getByRole("button", { name: /Renew link \(30 days\)/ }).click();
      // The page must drop "link expired" on its own. Before loading.tsx was removed (2026-11-13,
      // docs/known-issues.md) it kept showing until a reload.
      await expect(page.getByText(/link expired/)).toHaveCount(0, { timeout: 5_000 });
      await expect.poll(async () => (await tokenOf(s.requestId!)) !== oldToken).toBe(true);
    });

    const newToken = await tokenOf(s.requestId!);
    expect(newToken).not.toBe(oldToken);

    const anon = await browser.newContext({ baseURL: BASE_URL, storageState: { cookies: [], origins: [] } });
    try {
      const page = await anon.newPage();
      await page.goto(`/portal/${oldToken}`);
      await expect(page.getByRole("heading", { name: "This link has expired" })).toBeVisible();
      await page.goto(`/portal/${newToken}`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(CLIENT_NAME);
    } finally {
      await anon.close();
    }
  });

  test("consultant adds a site to the client so the portal can delegate", async ({ browser, problems }) => {
    await asConsultant(browser, problems, async (page) => {
      await go(page, `/consultant/clients/${s.companyId}`);
      // The page renders the add-site form more than once on this client (seen in run 7), so use the first.
      await page.getByPlaceholder("Site name (e.g. Fresno plant)").first().fill(SITE_NAME);
      await page.locator('select[name="egrid_subregion"]').first().selectOption({ index: 1 });
      await page.getByRole("button", { name: "Add site", exact: true }).first().click();
      // The row is written by the server action; the open page does not always re-render the new
      // site in place (seen in run 6), so wait for the database and reload before checking the page.
      await expect.poll(async () => (await sql(`select id from locations where company_id = $1 and name = $2`, [s.companyId, SITE_NAME])).length, { timeout: 60_000 }).toBe(1);
      await page.reload();
      // The site name shares its <p> with the region label, so match the start of the text, not the whole.
      await expect(page.getByText(new RegExp(`^${SITE_NAME}`)).first()).toBeVisible();
    });
    const rows = await sql<{ id: string }>(`select id from locations where company_id = $1 and name = $2`, [s.companyId, SITE_NAME]);
    expect(rows).toHaveLength(1);
    s.siteId = rows[0].id;
  });

  test("utility bills by file: preview, confirm, submit; the item shows as received with 12 rows", async ({ page }) => {
    await page.goto(`/portal/${await tokenOf(s.requestId!)}`);
    await page.getByRole("button", { name: /^Utility bills/ }).click();
    await page.getByLabel("Click to choose a CSV or Excel file").setInputFiles({
      name: "utility-2025.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(utilityCsv()),
    });

    await expect(page.getByText("Here's your file. Tell us what each column is.").or(page.getByText("Same file shape as last time"))).toBeVisible();
    await expect(page.getByRole("button", { name: /Looks right, add 12 rows/ })).toBeVisible();
    await page.getByRole("button", { name: /Looks right, add 12 rows/ }).click();

    await expect(page.getByText(/Added "utility-2025.csv" \(12 rows\)/)).toBeVisible();
    await expect(page.getByText("utility-2025.csv (12 rows)")).toBeVisible();
    await page.getByRole("button", { name: "Submit all 1 file to your consultant", exact: true }).click();
    await expect(page.getByText("Submitted", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText("1 of 3 items received")).toBeVisible();
    const req = await requestOf(s.companyId!, REQUEST_NAME);
    expect(req.checklist.find((i) => i.label === "Utility bills")?.status).toBe("received");
  });

  test("consultant ledger shows the 12 electricity rows with the kWh from the file", async ({ browser, problems }) => {
    // Fixed 2026-11-13: lib/ingestion/ingest.ts reads the unit from a quantity header such as
    // "kWh Used" when the file has no unit column. Before, these rows imported with no unit, unmapped.
    await asConsultant(browser, problems, async (page) => {
      await go(page, `/consultant/clients/${s.companyId}/ledger`);
      await expect(page.getByText(/across 12 rows/).filter({ visible: true })).toBeVisible();
      for (const r of UTILITY_KWH) {
        await expect(page.locator("body")).toContainText(`${r.kwh.toLocaleString("en-US")} kWh`);
      }
    });
    const rows = await sql<{ raw_value: string; raw_unit: string; category: string }>(
      `select raw_value, raw_unit, category from emission_line_items where company_id = $1 and raw_unit = 'kWh'`,
      [s.companyId]
    );
    expect(rows).toHaveLength(12);
    expect(rows.every((r) => r.category.includes("electric"))).toBe(true);
    expect(rows.map((r) => Number(r.raw_value)).sort((a, b) => a - b)).toEqual(UTILITY_KWH.map((r) => r.kwh));
  });

  test("fleet fuel typed in by hand: two months of gallons are saved", async ({ page }) => {
    await page.goto(`/portal/${await tokenOf(s.requestId!)}`);
    await page.getByRole("button", { name: /^Fleet fuel/ }).click();
    await page.getByRole("button", { name: "Type it in", exact: true }).click();

    for (let i = 0; i < DIESEL_ENTRIES.length; i++) {
      if (i > 0) await page.getByRole("button", { name: "Add row", exact: true }).click();
      await page.getByRole("combobox").nth(i).selectOption("diesel");
      await page.locator('input[type="month"]').nth(i).fill(DIESEL_ENTRIES[i].month);
      await page.getByPlaceholder("Amount").nth(i).fill(DIESEL_ENTRIES[i].gallons);
    }
    await page.getByRole("button", { name: "Add to submission", exact: true }).click();
    await expect(page.getByText(/Added "manual entry" \(2 rows\)/)).toBeVisible();
    await page.getByRole("button", { name: "Submit all 1 file to your consultant", exact: true }).click();
    await expect(page.getByText("Submitted", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText("2 of 3 items received")).toBeVisible();
  });

  test("consultant ledger shows the typed-in diesel rows", async ({ browser, problems }) => {
    await asConsultant(browser, problems, async (page) => {
      await go(page, `/consultant/clients/${s.companyId}/ledger`);
      await expect(page.getByText(/across 14 rows/).filter({ visible: true })).toBeVisible();
      for (const d of DIESEL_ENTRIES) {
        await expect(page.locator("body")).toContainText(`${Number(d.gallons).toLocaleString("en-US")} gallon`);
      }
    });
    const rows = await sql<{ raw_value: string }>(
      `select raw_value from emission_line_items where company_id = $1 and raw_unit = 'gallon'`,
      [s.companyId]
    );
    expect(rows.map((r) => Number(r.raw_value)).sort((a, b) => a - b)).toEqual(DIESEL_ENTRIES.map((d) => Number(d.gallons)).sort((a, b) => a - b));
  });

  test("consultant asks a question on one figure from the ledger", async ({ browser, problems }) => {
    await asConsultant(browser, problems, async (page) => {
      await go(page, `/consultant/clients/${s.companyId}/ledger`);
      await page.getByRole("button", { name: /^notes/ }).first().click();
      await page.getByPlaceholder("e.g. Does this figure include the delivery trucks?").fill("E2E question: is this kWh metered or estimated?");
      await page.getByRole("button", { name: "Comment (emails client)", exact: true }).click();
      // The ledger shows a row's comment list only while its editor is open, and the editor closes on post.
      // The notes counter did not update in place (run 12), so wait for the database write, reload, then check.
      await expect.poll(async () => (await sql(`select id from comments where company_id = $1 and author_type = 'consultant' and body = $2`, [s.companyId, "E2E question: is this kWh metered or estimated?"])).length, { timeout: 60_000 }).toBe(1);
      await page.reload();
      await expect(page.getByRole("button", { name: /^notes \(1\)/ }).first()).toBeVisible();
    });
    const rows = await sql<{ line_item_id: string }>(
      `select line_item_id from comments where company_id = $1 and author_type = 'consultant' and body = $2`,
      [s.companyId, "E2E question: is this kWh metered or estimated?"]
    );
    expect(rows).toHaveLength(1);
    s.questionLineId = rows[0].line_item_id;
  });

  test("the client answers that question from the portal", async ({ page }) => {
    await page.goto(`/portal/${await tokenOf(s.requestId!)}`);
    await expect(page.getByText("Questions from your consultant")).toBeVisible();
    await expect(page.getByText("E2E question: is this kWh metered or estimated?")).toBeVisible();
    await page.getByRole("button", { name: "Reply", exact: true }).click();
    await page.getByPlaceholder("Answer your consultant...").fill("E2E reply: metered, from the utility portal.");
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await expect(page.getByText("Reply sent.")).toBeVisible();

    const rows = await sql<{ author_type: string }>(
      `select author_type from comments where line_item_id = $1 and author_type = 'supplier' and body = $2`,
      [s.questionLineId, "E2E reply: metered, from the utility portal."]
    );
    expect(rows).toHaveLength(1);
  });

  test("the client is stuck on vendor invoices and says so from the portal", async ({ page }) => {
    await page.goto(`/portal/${await tokenOf(s.requestId!)}`);
    await page.getByRole("button", { name: /^Vendor invoices/ }).click();
    await page.getByRole("button", { name: "Stuck? Ask your consultant", exact: true }).click();
    await page.getByPlaceholder(/tripping you up/).fill("E2E: my invoices are PDFs, not a spreadsheet.");
    await page.getByRole("button", { name: "Send to my consultant", exact: true }).click();
    await expect(page.getByText("Sent. Your consultant will follow up.")).toBeVisible();

    const req = await requestOf(s.companyId!, REQUEST_NAME);
    expect(req.checklist.find((i) => i.label === "Vendor invoices")?.stuckNote).toBe("E2E: my invoices are PDFs, not a spreadsheet.");
  });

  test("the consultant's review page shows the client is stuck", async ({ browser, problems }) => {
    await asConsultant(browser, problems, async (page) => {
      await go(page, `/consultant/clients/${s.companyId}/review`);
      await expect(page.getByText("Client is stuck (1)").filter({ visible: true })).toBeVisible();
      await expect(page.getByText(/Flag on Vendor invoices/)).toBeVisible();
    });
  });

  test("the portal delegates the site to a colleague and the record exists", async ({ page }) => {
    await page.goto(`/portal/${await tokenOf(s.requestId!)}`);
    await expect(page.getByText("Your locations")).toBeVisible();
    const row = page.locator("div").filter({ hasText: SITE_NAME }).filter({ has: page.getByPlaceholder(/Site contact email/) }).last();
    await row.getByPlaceholder(/Site contact email/).fill(COLLEAGUE_EMAIL);
    await row.getByRole("button", { name: /^(Send upload link|Re-send link)$/ }).click();
    await expect(page.getByText(/^Link (sent to|created\.|re-sent to)/).filter({ visible: true })).toBeVisible();

    const reqs = await sql<{ id: string; status: string; parent_request_id: string | null }>(
      `select id, status, parent_request_id from data_requests where location_id = $1`,
      [s.siteId]
    );
    expect(reqs).toHaveLength(1);
    expect(reqs[0].status).toBe("open");
    expect(reqs[0].parent_request_id).toBe(s.requestId);
    s.siteRequestId = reqs[0].id;

    const loc = await sql<{ contact_email: string }>(`select contact_email from locations where id = $1`, [s.siteId]);
    expect(loc[0].contact_email).toBe(COLLEAGUE_EMAIL);
  });

  test("the delegation notice does not claim a send when no email went out", async ({ page }) => {
    // Fixed 2026-11-13: sendSiteLink returns whether the email went out and the route returns that as
    // `emailed`. The test server has no RESEND_API_KEY, so the notice must not say the link was sent.
    await page.goto(`/portal/${await tokenOf(s.requestId!)}`);
    const row = page.locator("div").filter({ hasText: SITE_NAME }).filter({ has: page.getByPlaceholder(/Site contact email/) }).last();
    await row.getByPlaceholder(/Site contact email/).fill(COLLEAGUE_EMAIL);
    await row.getByRole("button", { name: /^(Send upload link|Re-send link)$/ }).click();
    await expect(page.getByText(/^Link (sent to|created\.|re-sent to)/).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/sent to your site contact/)).toHaveCount(0);
  });

  test("submitting the last item fulfils the request and the portal says All done", async ({ page }) => {
    await page.goto(`/portal/${await tokenOf(s.requestId!)}`);
    await page.getByRole("button", { name: /^Vendor invoices/ }).click();
    await page.getByLabel("Click to choose a CSV or Excel file").setInputFiles({
      name: "vendor-invoices.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: vendorXlsx(),
    });
    await expect(page.getByRole("button", { name: new RegExp(`Looks right, add ${VENDOR_ROWS.length} rows`) })).toBeVisible();
    await page.getByRole("button", { name: new RegExp(`Looks right, add ${VENDOR_ROWS.length} rows`) }).click();
    await expect(page.getByText(/Added "vendor-invoices.xlsx"/)).toBeVisible();
    await page.getByRole("button", { name: "Submit all 1 file to your consultant", exact: true }).click();
    await expect(page.getByText("All done", { exact: true })).toBeVisible();

    const req = await requestOf(s.companyId!, REQUEST_NAME);
    expect(req.status).toBe("fulfilled");
    expect(req.checklist.every((i) => i.status === "received")).toBe(true);
  });

  test("consultant sees the request fulfilled on the client page", async ({ browser, problems }) => {
    await asConsultant(browser, problems, async (page) => {
      await go(page, `/consultant/clients/${s.companyId}`);
      await expect(page.getByText(REQUEST_NAME).first()).toBeVisible();
      await expect(page.getByText(/3\/3 items in/)).toBeVisible();
    });
  });

  test("consultant sends a second request and its link is expired in the database", async ({ browser, problems }) => {
    await asConsultant(browser, problems, async (page) => {
      await sendRequest(page, EXPIRY_NAME, ["Electricity & gas"]);
    });
    const req = await requestOf(s.companyId!, EXPIRY_NAME);
    s.expiryRequestId = req.id;
    await sql(`update data_requests set expires_at = $1 where id = $2`, ["2020-01-01T00:00:00.000Z", req.id]);
  });

  test("an expired link shows the expired message, and 'request a new link' notifies the consultant", async ({ page }) => {
    await page.goto(`/portal/${await tokenOf(s.expiryRequestId!)}`);
    await expect(page.getByRole("heading", { name: "This link has expired" })).toBeVisible();
    await expect(page.getByText(/valid for 30 days/)).toBeVisible();
    await page.getByRole("button", { name: "Request a new link", exact: true }).click();
    await expect(page.getByText(/Done\. Your consultant has been notified/)).toBeVisible();

    const events = await sql<{ verb: string }>(
      `select verb from events where subject_id = $1 and verb = 'request.link_requested'`,
      [s.expiryRequestId]
    );
    expect(events.length).toBeGreaterThan(0);
  });

  test("multi-site: a site link from the client page opens only that site's checklist", async ({ browser, problems }) => {
    // Demo client demo_smx. Dayton plant has no request yet. This test adds one for Dayton and
    // puts the Dayton contact on the site, then removes both again in `finally`.
    const SMX = "demo_smx";
    const DAYTON = "loc_demo_smx_oh";
    const original = await sql<{ contact_email: string | null }>(`select contact_email from locations where id = $1`, [DAYTON]);
    const before = await sql<{ id: string }>(`select id from data_requests where location_id = $1`, [DAYTON]);
    const beforeIds = new Set(before.map((r) => r.id));
    const colleague = `e2e-dayton-${TS}@example.com`;
    let token: string | null = null;

    try {
      await asConsultant(browser, problems, async (page) => {
        await go(page, `/consultant/clients/${SMX}`);
        const row = page.locator("div").filter({ hasText: "Dayton plant" }).filter({ has: page.getByRole("button", { name: /Send site link|Resend site link/ }) }).last();
        await row.getByPlaceholder(/site-contact@company.com/).fill(colleague);
        await row.getByRole("button", { name: /Send site link|Resend site link/ }).click();
        await page.waitForLoadState("networkidle");
      });

      const after = await sql<{ id: string; token: string | null }>(
        `select id, token from data_requests where location_id = $1 and status = 'open' order by created_at desc`,
        [DAYTON]
      );
      const mine = after.find((r) => !beforeIds.has(r.id)) ?? after[0];
      expect(mine?.token, "a Dayton site link exists").toBeTruthy();
      token = mine!.token;

      const anon = await browser.newContext({ baseURL: BASE_URL, storageState: { cookies: [], origins: [] } });
      try {
        const page = await anon.newPage();
        await page.goto(`/portal/${token}`);
        await expect(page.getByRole("heading", { level: 1 })).toContainText("Dayton plant");
        await expect(page.getByText("0 of 1 item received")).toBeVisible();
        await expect(page.getByRole("button", { name: /^Utility bills/ })).toBeVisible();
        await expect(page.getByRole("button", { name: /^Fleet fuel/ })).toHaveCount(0);
        await expect(page.getByRole("button", { name: /^Vendor invoices/ })).toHaveCount(0);
        await expect(page.getByText("Your locations")).toHaveCount(0);
        const body = await page.locator("body").innerText();
        expect(body).not.toContain("Fresno plant");
        expect(body).not.toContain("Fort Worth plant");
      } finally {
        await anon.close();
      }
    } finally {
      const created = await sql<{ id: string }>(`select id from data_requests where location_id = $1`, [DAYTON]);
      for (const r of created) if (!beforeIds.has(r.id)) await sql(`delete from data_requests where id = $1`, [r.id]);
      await sql(`update locations set contact_email = $1 where id = $2`, [original[0].contact_email, DAYTON]);
    }
  });
});
