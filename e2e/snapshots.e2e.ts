/** Snapshots: freeze, immutability, correction, sharing, revoking and export. A snapshot is the only
 *  thing that ever leaves Sendrow (contracts/invariants.md §13), so each check compares what the
 *  consultant sees or downloads with the frozen row in the database. Consultant A owns the demo
 *  workspace. Each test makes its own client (ids start with e2e_snap_) so tests stay independent. */
import type { Page } from "@playwright/test";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { test, expect, statePath } from "./fixtures";
import { sql } from "./db";
import { BASE_URL } from "./env";
import { snapshotHash, type SnapshotTotals } from "../lib/snapshots";

type Totals = { scope1: number; scope2Location: number; scope3: number; total: number };
type SnapRow = { label: string; totals: SnapshotTotals; line_items: Record<string, unknown>[]; sha256: string; item_count: number };

const SECTION_STATUS = {
  scope1: "not_started", scope2: "not_started", scope3: "not_started",
  social: "not_started", governance: "not_started", reports: "not_started",
};

/** Mapped rows the ledger shows. Each row has its own source_ref so a test can find it. */
const SEED_ROWS = [
  { ref: "E2E fleet diesel A", scope: 1, category: "mobile_combustion", raw: 820, unit: "gallon", perUnitKg: 10.21, factor: "fuel.diesel.2025" },
  { ref: "E2E fleet diesel B", scope: 1, category: "mobile_combustion", raw: 760, unit: "gallon", perUnitKg: 10.21, factor: "fuel.diesel.2025" },
  { ref: "E2E site electricity A", scope: 2, category: "electricity", raw: 3200, unit: "kWh", perUnitKg: 0.386, factor: "egrid.USAVG.2024" },
  { ref: "E2E site electricity B", scope: 2, category: "electricity", raw: 3350, unit: "kWh", perUnitKg: 0.386, factor: "egrid.USAVG.2024" },
];

const made: string[] = [];

/** Rounds like the app does for totals (two decimals). */
const round2 = (n: number) => Math.round(n * 100) / 100;

/** A client linked to consultant A with four mapped line items (two Scope 1, two Scope 2). */
async function makeClient(label: string): Promise<string> {
  const id = `e2e_snap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const [owner] = await sql<{ consultant_id: string }>(`select consultant_id from consultant_clients where company_id = 'demo_pcl' limit 1`);
  if (!owner) throw new Error("demo_pcl has no consultant link; the demo workspace is missing");
  await sql(
    `insert into companies (id, name, industry, headcount_range, created_at, section_status) values ($1, $2, 'Logistics', '50_150', $3, $4::jsonb)`,
    [id, `E2E ${label} ${id.slice(-6)}`, now, JSON.stringify(SECTION_STATUS)]
  );
  await sql(`insert into consultant_clients (id, consultant_id, company_id, added_at, archived_at) values ($1, $2, $3, $4, null)`, [`cc_${id}`, owner.consultant_id, id, now]);
  await sql(`insert into pipeline_status (company_id, status, updated_at) values ($1, 'in_progress', $2)`, [id, now]);
  for (const [i, r] of SEED_ROWS.entries()) {
    const kg = (r.raw * r.perUnitKg).toFixed(4);
    await sql(
      `insert into emission_line_items (id, company_id, source_ref, scope, category, raw_value, raw_unit, co2e_kg, confidence, status, period, activity_date, factor_id, calc_log, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, 'actual', 'mapped', '2025', $9, $10, $11::jsonb, $12)`,
      [
        `li_${id}_${i}`, id, r.ref, r.scope, r.category, String(r.raw), r.unit, kg, `2025-0${i + 1}`, r.factor,
        JSON.stringify({ factor_id: r.factor, formula: `${r.raw} ${r.unit} x ${r.perUnitKg} kg/${r.unit}` }), now,
      ]
    );
  }
  made.push(id);
  return id;
}

/** Adds a manual fleet-diesel entry through the Scope 1 manage form (the on-behalf path). */
async function addManualDiesel(page: Page, id: string, gallons: number) {
  await page.goto(`/consultant/clients/${id}/manage/scope1`);
  await page.locator('input[name="fleet_diesel_gal"]').fill(String(gallons));
  await page.getByRole("button", { name: "Save Scope 1" }).click();
  await expect.poll(async () => (await sql<{ n: number }>(`select count(*)::int as n from calcs where company_id = $1`, [id]))[0].n).toBeGreaterThan(0);
}

/** Live totals from the rows the workspace uses: mapped line items plus manual calcs. */
async function liveTotals(id: string): Promise<Totals> {
  const li = await sql<{ scope: number; kg: number }>(
    `select scope, coalesce(sum(co2e_kg), 0)::float8 as kg from emission_line_items where company_id = $1 and status = 'mapped' group by scope`,
    [id]
  );
  const manual = await sql<{ scope: number; t: number }>(
    `select scope, coalesce(sum(co2e_tons), 0)::float8 as t from calcs where company_id = $1 group by scope`,
    [id]
  );
  const sum = (scope: number) => (li.find((r) => r.scope === scope)?.kg ?? 0) / 1000 + (manual.find((r) => r.scope === scope)?.t ?? 0);
  const scope1 = round2(sum(1));
  const scope2Location = round2(sum(2));
  const scope3 = round2(sum(3));
  return { scope1, scope2Location, scope3, total: round2(scope1 + scope2Location + scope3) };
}

async function snapshotRow(snapId: string): Promise<SnapRow> {
  const [row] = await sql<SnapRow>(`select label, totals, line_items, sha256, item_count from snapshots where id = $1`, [snapId]);
  if (!row) throw new Error(`no snapshot row ${snapId}`);
  return row;
}

const pick = (text: string, re: RegExp): number => {
  const m = text.match(re);
  if (!m) throw new Error(`figure not on page: ${re}`);
  return Number(m[1].replace(/,/g, ""));
};

/** The three figures on the snapshot page (scope cards and the total line). */
async function snapshotPageFigures(page: Page) {
  const text = await page.locator("body").innerText();
  return {
    scope1: pick(text, /scope 1\s+([\d,.]+)\s*tco2e/i),
    scope2: pick(text, /scope 2\s+([\d,.]+)\s*tco2e/i),
    total: pick(text, /total\s+([\d,.]+)\s*tco2e/i),
  };
}

/** Freezes the client's approved data from the review page and returns the new snapshot id. */
async function freeze(page: Page, id: string, label: string): Promise<string> {
  await page.goto(`/consultant/clients/${id}/review`);
  await page.getByPlaceholder(/footprint/).fill(label);
  await page.getByRole("button", { name: "Approve, freeze & go to snapshot" }).click();
  await page.waitForURL(new RegExp(`/consultant/clients/${id}/snapshots/[^/?#]+$`));
  return page.url().split("/snapshots/")[1];
}

async function shareFromSnapshotPage(page: Page, id: string, snapId: string, label: string, email: string) {
  await page.goto(`/consultant/clients/${id}/snapshots/${snapId}`);
  await page.getByPlaceholder("Recipient, e.g. Elena Ruiz, Northgate Retail").fill(label);
  await page.getByPlaceholder("their@email.com").fill(email);
  await page.getByRole("button", { name: "Confirm & share" }).click();
  await expect(page.getByText(`To ${label}`)).toBeVisible();
}

/** Excludes a ledger row by its source ref (the ledger's Exclude control). */
async function excludeInLedger(page: Page, id: string, sourceRef: string) {
  await page.goto(`/consultant/clients/${id}/ledger`);
  const row = page.locator("tr", { hasText: sourceRef });
  await row.getByRole("button", { name: "Exclude" }).click();
  await expect(row.getByRole("button", { name: "Restore" })).toBeVisible();
  // The button flips at once (optimistic); wait for the server action to write the row.
  await expect
    .poll(async () => (await sql<{ status: string }>(`select status from emission_line_items where company_id = $1 and source_ref = $2`, [id, sourceRef])).map((r) => r.status))
    .toEqual(["excluded"]);
}

/** Signed-out view: clears the session cookies on this page's context. */
async function signOut(page: Page) {
  // Leave the consultant page first: if it is still open when the session goes, its tab links'
  // background prefetches hit the sign-in redirect and log CORS errors (seen 2026-11-15).
  await page.goto("about:blank");
  await page.context().clearCookies();
}

/** Exports one snapshot format as the signed-in consultant. */
async function download(page: Page, snapId: string, format: string) {
  const res = await page.request.get(`/api/snapshots/${snapId}/export?format=${format}`);
  expect(res.status(), `export ${format} status`).toBe(200);
  return { type: res.headers()["content-type"], disposition: res.headers()["content-disposition"], body: await res.body() };
}

async function dropClients() {
  for (const id of made.splice(0)) {
    for (const table of ["events", "comments", "share_links", "snapshots", "emission_line_items", "calcs", "company_inputs", "pipeline_status", "audit_log", "consultant_clients"]) {
      await sql(`delete from ${table} where company_id = $1`, [id]);
    }
    await sql(`delete from companies where id = $1`, [id]);
  }
}

/** Freeze v1, share it to a recipient, exclude a row, freeze v2 (the correction). */
async function correctAfterSharing(page: Page, id: string): Promise<{ v1: string; v2: string }> {
  const v1 = await freeze(page, id, "FY2026 v1");
  await shareFromSnapshotPage(page, id, v1, "E2E Recipient", "e2e-recipient@example.com");
  await excludeInLedger(page, id, "E2E fleet diesel B");
  const v2 = await freeze(page, id, "FY2026 v2");
  return { v1, v2 };
}

const fmt2 = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

test.describe("consultant A: freeze, share and export a snapshot", () => {
  test.use({ storageState: statePath("a") });
  test.afterAll(async () => {
    await dropClients();
  });

  test("1. approving freezes a dated, labelled snapshot whose figures equal the live totals", async ({ page }) => {
    const id = await makeClient("freeze");
    const live = await liveTotals(id);
    const snapId = await freeze(page, id, "FY2026 freeze check");
    const row = await snapshotRow(snapId);

    await expect(page.getByRole("heading", { name: /Snapshot: E2E freeze/ })).toBeVisible();
    await expect(page.getByText("FY2026 freeze check", { exact: true })).toBeVisible();
    await expect(page.getByText(/Locked · .*2026/)).toBeVisible();

    expect(row.label).toBe("FY2026 freeze check");
    expect(Math.abs(row.totals.scope1 - live.scope1), "frozen Scope 1 vs live").toBeLessThan(0.01);
    expect(Math.abs(row.totals.scope2Location - live.scope2Location), "frozen Scope 2 vs live").toBeLessThan(0.01);
    expect(Math.abs(row.totals.total - live.total), "frozen total vs live").toBeLessThan(0.01);
    expect(row.item_count).toBe(SEED_ROWS.length);

    const shown = await snapshotPageFigures(page);
    expect(Math.abs(shown.scope1 - live.scope1), "page Scope 1").toBeLessThan(0.06);
    expect(Math.abs(shown.scope2 - live.scope2Location), "page Scope 2").toBeLessThan(0.06);
    expect(Math.abs(shown.total - live.total), "page total").toBeLessThan(0.06);
  });

  test("2. changing a live line item after freezing leaves the snapshot, its page and its export unchanged", async ({ page }) => {
    const id = await makeClient("immutable");
    const snapId = await freeze(page, id, "FY2026 immutable");
    const frozen = await snapshotRow(snapId);
    const shownBefore = await snapshotPageFigures(page);
    const excelBefore = XLSX.utils.sheet_to_json<Record<string, unknown>>((await loadWorkbook(page, snapId)).Sheets["Summary"]);
    const liveBefore = await liveTotals(id);

    await excludeInLedger(page, id, "E2E fleet diesel B");

    const liveAfter = await liveTotals(id);
    expect(liveAfter.scope1, "the live total must move, or this test proves nothing").toBeLessThan(liveBefore.scope1 - 7);

    await page.goto(`/consultant/clients/${id}/snapshots/${snapId}`);
    expect(await snapshotRow(snapId), "stored snapshot row").toEqual(frozen);
    expect(await snapshotPageFigures(page), "snapshot page figures").toEqual(shownBefore);

    const wb = await loadWorkbook(page, snapId);
    expect(XLSX.utils.sheet_to_json(wb.Sheets["Summary"]), "export summary").toEqual(excelBefore);
  });

  test("3. a correction freezes a new version, and the old one stays viewable and unchanged", async ({ page }) => {
    const id = await makeClient("correction");
    const v1 = await freeze(page, id, "FY2026 v1");
    const v1Row = await snapshotRow(v1);
    const v1Shown = await snapshotPageFigures(page);
    await shareFromSnapshotPage(page, id, v1, "E2E Recipient", "e2e-recipient@example.com");
    await excludeInLedger(page, id, "E2E fleet diesel B");
    const v2 = await freeze(page, id, "FY2026 v2");

    expect(v2).not.toBe(v1);
    const v2Row = await snapshotRow(v2);
    expect(v2Row.totals.total, "v2 carries the correction").toBeLessThan(v1Row.totals.total - 7);

    await page.goto(`/consultant/clients/${id}/snapshots/${v1}`);
    await expect(page.getByText(/superseded by a newer snapshot/)).toBeVisible();
    expect(await snapshotRow(v1), "v1 row after v2 was frozen").toEqual(v1Row);
    expect(await snapshotPageFigures(page), "v1 page figures after v2").toEqual(v1Shown);

    await page.goto(`/consultant/clients/${id}`);
    await expect(page.getByRole("link", { name: /FY2026 v2/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /FY2026 v1/ })).toBeVisible();
  });

  test("3b. recipients of the old version get a restatement record", async ({ page }) => {
    // Fixed 2026-11-13: each restatement send is awaited and logged per recipient. The test server has
    // no RESEND_API_KEY, so the record is an email.failed entry that names the recipient.
    const id = await makeClient("restatement");
    await correctAfterSharing(page, id);
    const restated = () =>
      sql<{ verb: string; subject: string }>(
        `select verb, subject from events where company_id = $1 and subject ilike '%restatement%'`,
        [id]
      );
    await expect.poll(async () => (await restated()).length, { message: "one restatement record" }).toBe(1);
    const [entry] = await restated();
    expect(entry.verb).toBe("email.failed");
    expect(entry.subject).toContain("e2e-recipient@example.com");
  });

  test("4. sharing a snapshot creates a live link that opens signed out with its figures and no edit controls", async ({ page }) => {
    const id = await makeClient("share");
    const snapId = await freeze(page, id, "FY2026 share");
    const row = await snapshotRow(snapId);
    const [{ name }] = await sql<{ name: string }>(`select name from companies where id = $1`, [id]);

    await shareFromSnapshotPage(page, id, snapId, "E2E Recipient", "e2e-recipient@example.com");
    const [share] = await sql<{ token: string; recipient_email: string; revoked_at: string | null }>(
      `select token, recipient_email, revoked_at from share_links where snapshot_id = $1`,
      [snapId]
    );
    expect(share, "share link row").toBeTruthy();
    expect(share.recipient_email).toBe("e2e-recipient@example.com");
    expect(share.revoked_at).toBeNull();
    const verbs = (await sql<{ verb: string }>(`select verb from events where company_id = $1`, [id])).map((r) => r.verb);
    expect(verbs).toContain("snapshot.shared");

    await signOut(page);
    const res = await page.goto(`/shared/${share.token}`);
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: `Emissions summary for ${name}` })).toBeVisible();
    const text = await page.locator("body").innerText();
    expect(Math.abs(pick(text, /scope 1: direct\s+([\d,.]+)\s*t co2e/i) - row.totals.scope1), "shared Scope 1").toBeLessThan(0.01);
    expect(Math.abs(pick(text, /scope 2: electricity \(location\)\s+([\d,.]+)\s*t co2e/i) - row.totals.scope2Location), "shared Scope 2").toBeLessThan(0.01);
    expect(Math.abs(pick(text, /^total\s+([\d,.]+)\s*t co2e/im) - row.totals.total), "shared total").toBeLessThan(0.01);
    await expect(page.getByRole("button")).toHaveCount(0);
    await expect(page.getByRole("textbox")).toHaveCount(0);
    await expect(page.locator("input, textarea, select, form")).toHaveCount(0);
  });

  test("5. revoking a share link makes it inactive for the recipient", async ({ page, browser }) => {
    const id = await makeClient("revoke");
    const snapId = await freeze(page, id, "FY2026 revoke");
    await shareFromSnapshotPage(page, id, snapId, "E2E Recipient", "e2e-recipient@example.com");
    const [share] = await sql<{ token: string }>(`select token from share_links where snapshot_id = $1`, [snapId]);

    // Still live before revoking (a signed-out request context, so the check is not console-watched).
    const anon = await browser.newContext({ baseURL: BASE_URL });
    const before = await anon.request.get(`/shared/${share.token}`);
    expect(before.status()).toBe(200);
    expect(await before.text()).toContain("Emissions summary for");
    await anon.close();

    await page.goto(`/consultant/clients/${id}/snapshots/${snapId}`);
    await page.getByRole("button", { name: "Revoke link" }).click();
    await expect(page.getByRole("button", { name: "Revoke link" })).toHaveCount(0);
    const [revoked] = await sql<{ revoked_at: string | null }>(`select revoked_at from share_links where token = $1`, [share.token]);
    expect(revoked.revoked_at).not.toBeNull();
    const verbs = (await sql<{ verb: string }>(`select verb from events where company_id = $1`, [id])).map((r) => r.verb);
    expect(verbs).toContain("share.revoked");

    await signOut(page);
    const res = await page.goto(`/shared/${share.token}`);
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: "This link is no longer active" })).toBeVisible();
    await expect(page.getByText("Emissions summary for")).toHaveCount(0);
  });

  test("6. every snapshot export has the right type, and its figures add up to the frozen snapshot", async ({ page }) => {
    const id = await makeClient("export");
    await addManualDiesel(page, id, 500);
    const snapId = await freeze(page, id, "FY2026 export");
    const row = await snapshotRow(snapId);
    const { total, scope1, scope2Location } = row.totals;
    expect(row.line_items.some((i) => i.origin === "manual"), "manual entry frozen into the snapshot").toBe(true);

    // The links the snapshot page offers point at the export route for each format.
    await page.goto(`/consultant/clients/${id}/snapshots/${snapId}`);
    for (const [name, key] of [["Excel", "excel"], ["SB 253", "sb253"], ["Questionnaire", "questionnaire"], ["PACT V3", "pact"]]) {
      await expect(page.getByRole("link", { name, exact: true })).toHaveAttribute("href", `/api/snapshots/${snapId}/export?format=${key}`);
    }

    // Excel: the line items add up to the snapshot total, and the manual row is in them.
    const excel = await download(page, snapId, "excel");
    expect(excel.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(excel.disposition).toContain("attachment");
    const wb = XLSX.read(excel.body, { type: "buffer" });
    const items = XLSX.utils.sheet_to_json<Record<string, string | number>>(wb.Sheets["Line items"]);
    const sumT = (scope?: number) =>
      items.filter((r) => scope === undefined || Number(r.Scope) === scope).reduce((s, r) => s + Number(r["kg CO2e"]), 0) / 1000;
    expect(Math.abs(sumT() - total), "Excel line items vs total").toBeLessThan(0.01);
    expect(Math.abs(sumT(1) - scope1), "Excel Scope 1 rows").toBeLessThan(0.01);
    expect(Math.abs(sumT(2) - scope2Location), "Excel Scope 2 rows").toBeLessThan(0.01);
    expect(items.filter((r) => r.Origin === "Manual entry").length, "manual rows in Excel").toBeGreaterThanOrEqual(1);
    expect(items.length).toBe(row.item_count);
    const summary = XLSX.utils.sheet_to_json<Record<string, string | number>>(wb.Sheets["Summary"]);
    const summaryTotal = Number(summary.find((r) => r.Figure === "Total")?.["t CO2e"]);
    expect(Math.abs(summaryTotal - total), "Excel summary total").toBeLessThan(0.01);

    // SB 253 draft (markdown): the total line and the integrity hash.
    const sb = await download(page, snapId, "sb253");
    expect(sb.type).toBe("text/markdown");
    const md = sb.body.toString("utf8");
    expect(md).toContain(`**${fmt2(total)}**`);
    expect(md).toContain(row.sha256);

    // Questionnaire (CSV): the total answer and the hash.
    const q = await download(page, snapId, "questionnaire");
    expect(q.type).toBe("text/csv");
    const csv = q.body.toString("utf8");
    expect(csv).toContain(`"Total emissions (tCO2e)","${fmt2(total)}"`);
    expect(csv).toContain(row.sha256);

    // PACT (JSON): parses, total matches, breakdown adds up.
    const pact = await download(page, snapId, "pact");
    expect(pact.type).toBe("application/json");
    const doc = JSON.parse(pact.body.toString("utf8"));
    expect(Math.abs(doc.pcf.fossilGhgEmissions - total), "PACT total").toBeLessThan(0.01);
    const b = doc.pcf.breakdown;
    expect(Math.abs(b.scope1_tCO2e + b.scope2_locationBased_tCO2e + b.scope3_tCO2e - total), "PACT breakdown sums").toBeLessThan(0.01);
    expect(doc.integrity.sha256).toBe(row.sha256);
    expect(doc.integrity.lineItemCount).toBe(row.item_count);

    // An unknown format is refused.
    const bad = await page.request.get(`/api/snapshots/${snapId}/export?format=nope`);
    expect(bad.status()).toBe(400);
  });

  test("7. the client export zip is a real zip with data.json holding the frozen snapshot", async ({ page }) => {
    const id = await makeClient("zip");
    const snapId = await freeze(page, id, "FY2026 zip");
    const row = await snapshotRow(snapId);

    const res = await page.request.get(`/api/clients/${id}/export`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("application/zip");
    expect(res.headers()["content-disposition"]).toContain("sendrow-export.zip");
    const buf = await res.body();
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");

    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files);
    expect(names).toContain("data.json");
    expect(names).toContain("evidence/");
    const data = JSON.parse(await zip.file("data.json")!.async("string"));
    expect(data.company.id).toBe(id);
    const exported = data.snapshots.find((s: { id: string }) => s.id === snapId);
    expect(exported, "snapshot in the export").toBeTruthy();
    expect(exported.totals).toEqual(row.totals);
    expect(exported.sha256).toBe(row.sha256);
    const [{ n }] = await sql<{ n: number }>(`select count(*)::int as n from emission_line_items where company_id = $1`, [id]);
    expect(data.emissionLineItems.length).toBe(n);
  });

  test("8. the demo client's existing results link shows the frozen figures, signed out", async ({ page }) => {
    const [share] = await sql<{ token: string }>(
      `select token from share_links where snapshot_id = 'snap_demo_pcl_1' and revoked_at is null order by created_at limit 1`
    );
    expect(share, "demo_pcl share link").toBeTruthy();
    const row = await snapshotRow("snap_demo_pcl_1");

    await page.goto(`/consultant/clients/demo_pcl/snapshots/snap_demo_pcl_1`);
    const owner = await snapshotPageFigures(page);
    expect(Math.abs(owner.total - row.totals.total)).toBeLessThan(0.06);

    await signOut(page);
    const res = await page.goto(`/shared/${share.token}`);
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: /Pacific Coast Logistics/ })).toBeVisible();
    const text = await page.locator("body").innerText();
    const shared = {
      scope1: pick(text, /scope 1: direct\s+([\d,.]+)\s*t co2e/i),
      scope2: pick(text, /scope 2: electricity \(location\)\s+([\d,.]+)\s*t co2e/i),
      total: pick(text, /^total\s+([\d,.]+)\s*t co2e/im),
    };
    expect(Math.abs(shared.total - row.totals.total), "shared total vs frozen row").toBeLessThan(0.01);
    expect(Math.abs(shared.scope1 - row.totals.scope1), "shared Scope 1 vs frozen row").toBeLessThan(0.01);
    expect(Math.abs(shared.scope2 - row.totals.scope2Location), "shared Scope 2 vs frozen row").toBeLessThan(0.01);
    expect(Math.abs(shared.total - owner.total), "shared total vs snapshot page").toBeLessThan(0.06);
  });

  test("9. a stored snapshot still reproduces its own sha256", async ({ page }) => {
    // Fixed 2026-11-13: snapshotHash hashes canonical JSON (keys sorted), so the stored totals and line
    // items re-hash to the stored sha256 whatever key order Postgres jsonb returns them in.
    // Snapshots frozen before the fix keep their insertion-order hash (docs/known-issues.md).
    const id = await makeClient("hash");
    const snapId = await freeze(page, id, "FY2026 hash");
    const row = await snapshotRow(snapId);
    expect(snapshotHash(row.totals, row.line_items), "re-derived sha256 vs stored").toBe(row.sha256);
  });

  test("10. the Generate report page shows the same live totals as the snapshot", async ({ page }) => {
    // Fixed 2026-11-13: the reports page uses combinedTotals (line items plus manual), like the PDF
    // and the snapshot. Before, it summed manual calcs only and showed 0 for a line-item-only client.
    const id = await makeClient("reports");
    const live = await liveTotals(id);
    await page.goto(`/consultant/clients/${id}/manage/reports`);
    const text = await page.locator("body").innerText();
    const shown = pick(text, /scope 1\s+([\d,.]+)\s*tco2e/i);
    expect(Math.abs(shown - live.scope1), `reports page Scope 1 (${shown}) vs live (${live.scope1})`).toBeLessThan(0.06);
  });
});

/** Downloads the Excel export and parses it. */
async function loadWorkbook(page: Page, snapId: string): Promise<XLSX.WorkBook> {
  const excel = await download(page, snapId, "excel");
  return XLSX.read(excel.body, { type: "buffer" });
}
