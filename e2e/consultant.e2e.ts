/** Everyday consultant features, end to end: dashboard, clients (add, contact, archive, undo,
 *  delete), branding (saved values reach the supplier portal), templates, formats, calendar,
 *  Cmd+K, the phone menu, sign-out and first-time onboarding. Consultant A owns the demo
 *  workspace. Demo clients (ids starting demo_) are only read here, never changed. Clients this
 *  file creates are named "E2E ..." and unlinked from A when the test ends. */
import type { Page } from "@playwright/test";
import { test, expect, statePath } from "./fixtures";
import { USERS } from "./env";
import { ensureUser, signInToken, deleteUser } from "./clerk";
import { sql } from "./db";

const stamp = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

/** Demo clients on A's dashboard (names from scripts/reset-demo.ts). */
const DEMO_CLIENTS = ["Golden Gate Coffee", "Bayshore Bottling", "Pacific Coast Logistics", "Sierra Materials"];

/** Chrome logs every 404 response as a console error. A deleted or archived client is supposed to
 *  answer 404, so these lines are allowed only in the tests that expect that 404. */
const NOT_FOUND_CONSOLE = /status of 404 \(Not Found\)/;

/** Fills and submits /consultant/clients/new. Returns the new company id. */
async function addClient(page: Page, name: string): Promise<string> {
  await page.goto("/consultant/clients/new");
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="contact_name"]').fill("E2E Contact");
  await page.locator('input[name="contact_email"]').fill(`e2e-${stamp()}@example.com`);
  await page.getByRole("button", { name: "Add client" }).click();
  await page.waitForURL(/\/consultant\/clients\/(?!new)[^/?]+$/);
  return new URL(page.url()).pathname.split("/").pop()!;
}

/** Removes A's link to a client this file created. The app's own delete does the same thing:
 *  it removes the consultant link and leaves the company row. */
async function unlink(companyId: string) {
  await sql("delete from consultant_clients where company_id = $1", [companyId]);
}

/** The dashboard table row for a client name. */
function clientRow(page: Page, name: string) {
  return page.getByRole("row").filter({ hasText: name });
}

/** Signs a fresh browser page in with a Clerk sign-in ticket (same flow as auth.setup.e2e.ts). */
async function signInWithTicket(page: Page, userId: string) {
  const ticket = await signInToken(userId);
  await page.goto("/login", { waitUntil: "load" });
  await page.waitForFunction(() => window.Clerk?.loaded === true);
  const status = await page.evaluate(async (t) => {
    const si = await window.Clerk!.client.signIn.create({ strategy: "ticket", ticket: t });
    await window.Clerk!.setActive({ session: si.createdSessionId });
    return si.status;
  }, ticket);
  expect(status).toBe("complete");
}

/** Shared declarations for window.Clerk, as in auth.setup.e2e.ts. */
declare global {
  interface Window {
    Clerk?: {
      loaded: boolean;
      client: { signIn: { create(p: { strategy: "ticket"; ticket: string }): Promise<{ status: string; createdSessionId: string }> } };
      setActive(p: { session: string }): Promise<void>;
    };
  }
}

test.describe("consultant A: dashboard and clients", () => {
  test.use({ storageState: statePath("a") });

  test("dashboard lists the demo clients and the stat cards", async ({ page }) => {
    await page.goto("/consultant");
    await expect(page.getByRole("heading", { name: "Clients", exact: true })).toBeVisible();
    for (const name of DEMO_CLIENTS) {
      await expect(page.getByRole("link", { name: new RegExp(name) }).first(), `demo client ${name}`).toBeVisible();
    }
    for (const label of ["Overdue", "Ready to review", "Awaiting response"]) {
      await expect(page.getByText(label, { exact: true }), `stat card ${label}`).toBeVisible();
    }
  });

  test("add a client: required name blocks an empty submit, a filled one opens its page and lists it", async ({ page }) => {
    await page.goto("/consultant/clients/new");
    const nameInput = page.locator('input[name="name"]');
    await page.getByRole("button", { name: "Add client" }).click();
    await expect(page).toHaveURL(/\/consultant\/clients\/new$/);
    await expect(nameInput).toHaveJSProperty("validity.valueMissing", true);

    const name = `E2E create ${stamp()}`;
    const companyId = await addClient(page, name);
    try {
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();

      await page.goto("/consultant");
      await expect(clientRow(page, name)).toBeVisible();
    } finally {
      await unlink(companyId);
    }
  });

  test("edit the client contact on its page and see it after reload", async ({ page }) => {
    const name = `E2E contact ${stamp()}`;
    const companyId = await addClient(page, name);
    try {
      const contactForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Save contact" }) });
      const newName = `E2E Priya ${stamp()}`;
      const newEmail = `e2e-new-${stamp()}@example.com`;
      await contactForm.locator('input[name="contact_name"]').fill(newName);
      await contactForm.locator('input[name="contact_email"]').fill(newEmail);
      await Promise.all([
        page.waitForResponse((r) => r.request().method() === "POST"),
        contactForm.getByRole("button", { name: "Save contact" }).click(),
      ]);

      await page.reload();
      const saved = page.locator("form").filter({ has: page.getByRole("button", { name: "Save contact" }) });
      await expect(saved.locator('input[name="contact_name"]')).toHaveValue(newName);
      await expect(saved.locator('input[name="contact_email"]')).toHaveValue(newEmail);
    } finally {
      await unlink(companyId);
    }
  });

  test("archive shows the Undo toast, and Undo brings the client back", async ({ page }) => {
    const name = `E2E undo ${stamp()}`;
    const companyId = await addClient(page, name);
    try {
      await page.goto("/consultant");
      await clientRow(page, name).getByRole("button", { name: "Archive" }).click();
      await page.waitForURL(/\/consultant\?archived=/);

      const toast = page.getByRole("status");
      await expect(toast).toContainText(`Archived ${name}.`);
      await expect(clientRow(page, name)).toHaveCount(0);

      await toast.getByRole("button", { name: "Undo" }).click();
      await expect(clientRow(page, name)).toBeVisible();
      await expect(page.getByRole("status")).toHaveCount(0);
    } finally {
      await unlink(companyId);
    }
  });

  test("archive without Undo removes the client from the active list", async ({ page }) => {
    const name = `E2E archive ${stamp()}`;
    const companyId = await addClient(page, name);
    try {
      await page.goto("/consultant");
      await clientRow(page, name).getByRole("button", { name: "Archive" }).click();
      await page.waitForURL(/\/consultant\?archived=/);
      await page.goto("/consultant");
      await expect(clientRow(page, name)).toHaveCount(0);
      await expect(page.getByRole("link", { name: new RegExp(name) })).toHaveCount(0);
    } finally {
      // Restore the row so the cleanup below is the only remaining change.
      await sql("update consultant_clients set archived_at = null where company_id = $1", [companyId]);
      await unlink(companyId);
    }
  });

  // Once the 8-second Undo toast has gone, the dashboard's "Archived clients" list is the way back.
  // Restore must update the dashboard on its own, with no reload: before loading.tsx was removed
  // (docs/known-issues.md, the server action stall), the row only came back after a refresh.
  test("an archived client can be restored from the dashboard after the Undo window", async ({ page }) => {
    const name = `E2E restore ${stamp()}`;
    const companyId = await addClient(page, name);
    try {
      await page.goto("/consultant");
      await clientRow(page, name).getByRole("button", { name: "Archive" }).click();
      await page.waitForURL(/\/consultant\?archived=/);
      await page.goto("/consultant");
      await expect(clientRow(page, name)).toHaveCount(0);

      const archived = page.locator("details", { has: page.getByText(/^Archived clients \(\d+\)$/) });
      await archived.locator("summary").click();
      const item = archived.getByRole("listitem").filter({ hasText: name });
      await expect(item).toBeVisible();
      await item.getByRole("button", { name: "Restore" }).click();

      await expect(clientRow(page, name)).toBeVisible({ timeout: 5000 });
      await expect(archived.getByRole("listitem").filter({ hasText: name })).toHaveCount(0);
      const row = await sql<{ archived_at: string | null }>("select archived_at from consultant_clients where company_id = $1", [companyId]);
      expect(row[0]?.archived_at).toBeNull();
    } finally {
      await sql("update consultant_clients set archived_at = null where company_id = $1", [companyId]);
      await unlink(companyId);
    }
  });

  test("delete asks for confirmation, then removes the client; its page is gone", async ({ page, allowErrors }) => {
    allowErrors(NOT_FOUND_CONSOLE);
    const name = `E2E delete ${stamp()}`;
    const companyId = await addClient(page, name);
    await page.goto("/consultant");
    const row = clientRow(page, name);

    // First attempt: the confirm dialog appears and cancelling keeps the client.
    const seen: string[] = [];
    page.once("dialog", (d) => {
      seen.push(d.message());
      void d.dismiss();
    });
    await row.getByRole("button", { name: "Delete" }).click();
    await expect.poll(() => seen.length).toBe(1);
    expect(seen[0]).toContain(`Permanently delete ${name}?`);
    await expect(clientRow(page, name)).toBeVisible();

    // Second attempt: confirm.
    page.once("dialog", (d) => void d.accept());
    await Promise.all([
      page.waitForURL(/\/consultant$/),
      clientRow(page, name).getByRole("button", { name: "Delete" }).click(),
    ]);
    await page.goto("/consultant");
    await expect(clientRow(page, name)).toHaveCount(0);

    // The client pages stream behind app/consultant/loading.tsx, so the status is already 200 when
    // requireOwnedClient() calls notFound(). What matters is the not-found screen and no client data.
    await page.goto(`/consultant/clients/${companyId}`);
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByText(name)).toHaveCount(0);
  });
});

test.describe("consultant A: branding reaches the portal", () => {
  test.use({ storageState: statePath("a") });

  test("saved brand name and accent color persist and show on the supplier portal", async ({ page }) => {
    const aId = await ensureUser(USERS.a.email, USERS.a.first, USERS.a.last);
    // Read the current profile first so it can be restored exactly, nulls included.
    const before = await sql<{ brand_name: string | null; accent_color: string | null }>(
      "select brand_name, accent_color from consultant_profiles where consultant_id = $1",
      [aId]
    );
    const brandName = `E2E Brand ${stamp()}`;
    const accent = "#1d4ed8";
    try {
      await page.goto("/consultant/settings");
      await page.getByPlaceholder("Pacific Sustainability Advisors").fill(brandName);
      await page.locator('input[type="color"]').fill(accent);
      await Promise.all([
        page.waitForResponse((r) => r.request().method() === "POST"),
        page.getByRole("button", { name: "Save branding" }).click(),
      ]);

      await page.reload();
      await expect(page.getByPlaceholder("Pacific Sustainability Advisors")).toHaveValue(brandName);
      await expect(page.locator('input[type="color"]')).toHaveValue(accent);

      // The portal of one of A's demo requests, opened without signing in (magic link).
      const [request] = await sql<{ token: string | null }>("select token from data_requests where id = $1", ["dr_demo_ggcr_1"]);
      expect(request?.token, "portal token for dr_demo_ggcr_1").toBeTruthy();
      await page.goto(`/portal/${request!.token}`);
      await expect(page.getByText(brandName).or(page.getByAltText(brandName)).first()).toBeVisible();
      const primary = await page.locator("main").first().evaluate((el) => getComputedStyle(el).getPropertyValue("--primary").trim().toLowerCase());
      expect(primary).toBe(accent);
    } finally {
      if (before.length) {
        await sql("update consultant_profiles set brand_name = $2, accent_color = $3 where consultant_id = $1", [
          aId,
          before[0].brand_name,
          before[0].accent_color,
        ]);
      } else {
        await sql("delete from consultant_profiles where consultant_id = $1", [aId]);
      }
    }
  });
});

test.describe("consultant A: templates, formats, calendar", () => {
  test.use({ storageState: statePath("a") });

  test("a new template appears in the list and is offered on the new request form", async ({ page }) => {
    const name = `E2E template ${stamp()}`;
    try {
      await page.goto("/consultant/templates");
      await page.getByRole("button", { name: "New template" }).click();
      await page.locator('form input[name="name"]').fill(name);
      await page.locator('form input[name="description"]').fill("E2E quarterly emissions data");
      await Promise.all([
        page.waitForResponse((r) => r.request().method() === "POST"),
        page.getByRole("button", { name: "Save template" }).click(),
      ]);
      await expect(page.getByText(name, { exact: true })).toBeVisible();

      await page.goto("/consultant/requests/new");
      await expect(page.getByRole("option", { name, exact: true })).toHaveCount(1);
    } finally {
      await sql("delete from request_templates where name = $1", [name]);
    }
  });

  test("the format library renders its built-in formats", async ({ page }) => {
    await page.goto("/consultant/formats");
    await expect(page.getByRole("heading", { name: "Format library" })).toBeVisible();
    for (const name of ["SB 253 draft template", "Plain Excel export", "Buyer questionnaire CSV", "PACT V3 draft"]) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
  });

  test("the compliance calendar renders, and every source link is https", async ({ page }) => {
    await page.goto("/consultant/calendar");
    await expect(page.getByRole("heading", { name: "Compliance calendar" })).toBeVisible();
    const sources = page.getByRole("link", { name: "Source", exact: true });
    await expect(sources.first()).toBeVisible();
    const count = await sources.count();
    expect(count, "source links on the calendar").toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await sources.nth(i).getAttribute("href");
      expect(href, `source link ${i} href`).toMatch(/^https:\/\//);
    }
  });
});

test.describe("consultant A: navigation", () => {
  test.use({ storageState: statePath("a") });

  test("Cmd+K finds a demo client and Enter opens it", async ({ page }) => {
    await page.goto("/consultant");
    await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
    const dialog = page.getByRole("dialog", { name: "Command menu" });
    await expect(dialog).toBeVisible();
    await page.getByPlaceholder("Search pages and clients").fill("Bayshore Bottling");
    await expect(page.getByRole("option", { name: /Bayshore Bottling/ }).first()).toBeVisible();
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/consultant\/clients\/demo_bayb$/);
    await expect(page.getByRole("heading", { name: /Bayshore Bottling/ })).toBeVisible();
  });
});

test.describe("consultant A on a phone", () => {
  test.use({ storageState: statePath("a"), viewport: { width: 390, height: 844 } });

  test("the Menu button opens the consultant nav and a link navigates", async ({ page }) => {
    await page.goto("/consultant");
    const menu = page.getByRole("button", { name: "Menu", exact: true });
    await expect(menu).toBeVisible();
    await menu.click();
    const nav = page.getByRole("navigation", { name: "Consultant" });
    await nav.getByRole("link", { name: /^Settings/ }).click();
    await page.waitForURL(/\/consultant\/settings$/);
    await expect(page.getByRole("heading", { name: "Branding" })).toBeVisible();
  });
});

test.describe("sign out", () => {
  // No saved session: this test signs in with its own ticket, so a.json stays untouched.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("log out in a new session ends it, and /consultant then goes to sign-in", async ({ page, allowErrors }) => {
    // Clerk's hosted sign-in page (accounts.dev) logs this CSP note; it is not app code.
    allowErrors(/script-src/);
    const aId = await ensureUser(USERS.a.email, USERS.a.first, USERS.a.last);
    await signInWithTicket(page, aId);
    await page.goto("/consultant");
    await expect(page.getByRole("heading", { name: "Clients", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL((u) => new URL(u).pathname === "/");

    await page.goto("/consultant");
    await page.waitForURL(/\/login|\/sign-in/);
  });
});

test.describe("onboarding for a new consultant", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("a new user sees both choices and can set up a consultant account", async ({ page }) => {
    const email = `qa-onboard-${Date.now()}+clerk_test@example.com`;
    const userId = await ensureUser(email, "QA", "Onboard");
    try {
      await signInWithTicket(page, userId);
      await page.goto("/onboarding");
      await expect(page.getByRole("heading", { name: /climate consultant/ })).toBeVisible();
      await expect(page.getByRole("heading", { name: /company, supplier or other third party/ })).toBeVisible();

      await page.getByRole("button", { name: /set up consultant account/i }).click();
      await page.waitForURL(/\/consultant$/);
      await expect(page.getByRole("heading", { name: "Get started" })).toBeVisible();
      await expect(page.getByText("Add a client", { exact: true })).toBeVisible();
    } finally {
      await deleteUser(userId);
    }
  });
});
