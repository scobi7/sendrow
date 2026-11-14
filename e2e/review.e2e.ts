/** Review and ledger, as consultant A: approving, flagging and rejecting uploads, requesting changes,
 *  the stuck-flag thread, the Data Ledger (totals, exclude/restore, quantity, category, comments,
 *  actual, "How calculated"), dollar-fuel and vendor conversions, manual entry on the manage pages,
 *  the report PDF and the activity log.
 *
 *  Bayshore Bottling (demo_bayb) is read and exclude/restore only: its rows are snapshotted before
 *  the suite and written back after every test. Everything else runs on clients this file creates
 *  (ids and names carry the e2e_ / E2E Review prefix) and deletes at the end. Demo rows are never
 *  touched by a write other than the exclude/restore pair. See contracts/invariants.md §1, §7, §13. */
import type { Locator, Page } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { test, expect, pageAs, statePath } from "./fixtures";
import { sql } from "./db";

test.use({ storageState: statePath("a") });

const RUN = Date.now().toString(36);
let seq = 0;
const created: string[] = [];

/** Seed factors, copied from lib/factors.ts (the emission_factors table is empty in the test database,
 *  so the app falls back to these). Used only to write calc logs the way applyFactor() writes them. */
const FACTORS: Record<string, { name: string; value: number; unit: string; year: number; source: string }> = {
  "egrid.USAVG.2024": { name: "US national average grid", value: 0.000369, unit: "tCO2e/kWh", year: 2024, source: "EPA eGRID" },
  "fuel.diesel.2025": { name: "Diesel fuel", value: 0.01021, unit: "tCO2e/gallon", year: 2025, source: "EPA GHG Emission Factors Hub" },
  "fuel.gasoline.2025": { name: "Motor gasoline", value: 0.008887, unit: "tCO2e/gallon", year: 2025, source: "EPA GHG Emission Factors Hub" },
  "fuel.propane.2025": { name: "Propane (LPG)", value: 0.005752, unit: "tCO2e/gallon", year: 2025, source: "EPA GHG Emission Factors Hub" },
};

type RowSeed = {
  ref: string;
  scope: number;
  category: string;
  raw: number;
  unit: string;
  factorId?: string;
  status?: "mapped" | "unmapped";
  confidence?: "actual" | "estimated";
  activity?: string;
};

const elec = (ref: string, kwh: number, confidence: "actual" | "estimated" = "actual"): RowSeed => ({
  ref, scope: 2, category: "electricity", raw: kwh, unit: "kWh", factorId: "egrid.USAVG.2024", confidence,
});
const diesel = (ref: string, gal: number): RowSeed => ({
  ref, scope: 1, category: "mobile_combustion", raw: gal, unit: "gallon", factorId: "fuel.diesel.2025",
});

type Upload = { filename: string; status: "pending_review" | "needs_info" | "approved"; rows: RowSeed[] };
type Client = { id: string; name: string; token: string; requestId: string; sessionIds: string[] };

const SECTIONS = { scope1: "not_started", scope2: "not_started", scope3: "not_started", social: "not_started", governance: "not_started", reports: "not_started" };

async function consultantId(): Promise<string> {
  const rows = await sql<{ consultant_id: string }>(
    `select consultant_id from consultant_clients where company_id = 'demo_bayb' and archived_at is null limit 1`
  );
  if (!rows[0]) throw new Error("demo_bayb has no consultant link; the demo workspace is not seeded");
  return rows[0].consultant_id;
}

async function insertRows(companyId: string, rows: RowSeed[], profileId: string | null, at: string) {
  for (const r of rows) {
    const factor = r.factorId ? FACTORS[r.factorId] : undefined;
    const mapped = (r.status ?? "mapped") === "mapped" && !!factor;
    const id = `li_${companyId}_${++seq}`;
    const kg = mapped ? r.raw * factor!.value * 1000 : 0;
    const calcLog = mapped
      ? {
          factor_id: r.factorId,
          factor_name: factor!.name,
          factor_value: factor!.value,
          factor_unit: factor!.unit,
          factor_vintage: factor!.year,
          formula: `${r.raw} ${r.unit} × ${factor!.value} ${factor!.unit} × 1000 kg/t`,
          co2e_kg: kg,
          computed_at: at,
        }
      : { reason: "Needs a category", raw_value: r.raw, raw_unit: r.unit, activity_type: r.activity ?? r.ref, computed_at: at };
    await sql(
      `insert into emission_line_items (id, company_id, source_ref, scope, category, raw_value, raw_unit, co2e_kg, confidence, status, period, activity_date, factor_id, calc_log, mapping_profile_id, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'2025',null,$11,$12::jsonb,$13,$14)`,
      [
        id, companyId, r.ref, r.scope, r.category, String(r.raw), r.unit, kg.toFixed(4), r.confidence ?? "actual",
        mapped ? "mapped" : "unmapped", mapped ? r.factorId : null, JSON.stringify(calcLog), profileId, at,
      ]
    );
  }
}

/** A client with an open request, optional upload sessions, rows and a stuck checklist item. */
async function seedClient(label: string, opts: { uploads?: Upload[]; rows?: RowSeed[]; stuckNote?: string } = {}): Promise<Client> {
  const id = `e2e_review_${label}_${RUN}_${++seq}`;
  const name = `E2E Review ${label} ${RUN}`;
  const token = randomBytes(24).toString("base64url");
  const requestId = `dr_${id}`;
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const consultant = await consultantId();
  created.push(id);

  await sql(
    `insert into companies (id, name, industry, client_contact_name, client_contact_email, created_at, setup_complete, section_status)
     values ($1,$2,'Food and Beverage','E2E Contact','e2e-review@example.com',$3,false,$4::jsonb)`,
    [id, name, now, JSON.stringify(SECTIONS)]
  );
  await sql(`insert into consultant_clients (id, consultant_id, company_id, added_at) values ($1,$2,$3,$4)`, [`cc_${id}`, consultant, id, now]);

  const checklist = [
    { id: "item_1", label: "Utility bills", dataType: "utility_bills", instructions: "Upload your monthly usage export.", status: "received" },
    {
      id: "item_2", label: "Vendor invoices", dataType: "vendor_invoices", instructions: "Upload the expense export.",
      status: "pending", ...(opts.stuckNote ? { stuckNote: opts.stuckNote } : {}),
    },
  ];
  await sql(
    `insert into data_requests (id, company_id, requested_by, description, status, period_label, created_at, token, expires_at, checklist, reminders_sent_at, reminders_enabled)
     values ($1,$2,$3,'E2E review request','open','Calendar year 2025',$4,$5,$6,$7::jsonb,'{}'::jsonb,true)`,
    [requestId, id, consultant, now, token, expires, JSON.stringify(checklist)]
  );

  const sessionIds: string[] = [];
  for (const [i, u] of (opts.uploads ?? []).entries()) {
    const profileId = `mp_${id}_${i}`;
    await sql(
      `insert into mapping_profiles (id, company_id, name, column_map, effective_from, created_at) values ($1,$2,$3,'{}'::jsonb,$4,$5)`,
      [profileId, id, `Portal - ${u.filename}`, now.slice(0, 10), now]
    );
    const sid = `is_${id}_${i}`;
    await sql(
      `insert into intake_sessions (id, company_id, uploaded_by, filename, data_type, session_score, status, row_count, mapping_profile_id, created_at)
       values ($1,$2,$3,$4,'utility_bills','0.9',$5,$6,$7,$8)`,
      [sid, id, `portal:${requestId}`, u.filename, u.status, u.rows.length, profileId, now]
    );
    sessionIds.push(sid);
    await insertRows(id, u.rows, profileId, now);
  }
  await insertRows(id, opts.rows ?? [], null, now);
  return { id, name, token, requestId, sessionIds };
}

/** Removes every row this file made for a client. The immutable event log goes too, since it is test data. */
async function dropClient(id: string) {
  for (const table of [
    "audit_log", "comments", "events", "emission_line_items", "intake_sessions", "mapping_profiles", "data_requests",
    "consultant_clients", "company_inputs", "calcs", "pipeline_status", "vendor_mappings", "snapshots", "share_links",
  ]) {
    await sql(`delete from ${table} where company_id = $1`, [id]);
  }
  await sql(`delete from companies where id = $1`, [id]);
}

/** Clients left behind by an interrupted run (same prefix this file uses). */
test.beforeAll(async () => {
  const leftovers = await sql<{ id: string }>(`select id from companies where id like 'e2e_review_%'`);
  for (const l of leftovers) await dropClient(l.id);
});

test.afterAll(async () => {
  for (const id of created) await dropClient(id);
});

// ── Helpers that read the page ──────────────────────────────────────────────

const base = (id: string) => `/consultant/clients/${id}`;

async function sessionStatus(sessionId: string): Promise<string> {
  const rows = await sql<{ status: string }>(`select status from intake_sessions where id = $1`, [sessionId]);
  return rows[0]?.status ?? "missing";
}

async function rowStatuses(companyId: string, ref: string): Promise<string[]> {
  const rows = await sql<{ status: string }>(`select status from emission_line_items where company_id = $1 and source_ref = $2`, [companyId, ref]);
  return rows.map((r) => r.status);
}

/** "Showing 1.23 t CO2e across 12 rows" */
async function ledgerTotal(page: Page): Promise<{ total: number; count: number }> {
  const text = (await page.locator("p").filter({ hasText: "across" }).first().innerText()).replace(/\s+/g, " ");
  const m = /Showing ([\d,.]+) t CO2e across (\d+) rows?/.exec(text);
  if (!m) throw new Error(`No totals line on the ledger: "${text}"`);
  return { total: Number(m[1].replace(/,/g, "")), count: Number(m[2]) };
}

const num = (s: string) => Number(s.replace(/,/g, ""));

/** The data row (8 cells) whose text contains `text`. */
function rowFor(page: Page, text: string): Locator {
  return page.getByRole("row").filter({ hasText: text }).first();
}

/** The editor row that opens directly under a data row. */
function editorFor(page: Page, text: string): Locator {
  return rowFor(page, text).locator("xpath=following-sibling::tr[1]");
}

async function cellsFor(page: Page, text: string): Promise<string[]> {
  await rowFor(page, text).waitFor({ state: "visible" });
  return rowFor(page, text).getByRole("cell").allInnerTexts();
}

/** t CO2e cell (index 3) of the row, as a number, or NaN when not calculated. */
async function tonsFor(page: Page, text: string): Promise<number> {
  const cells = await cellsFor(page, text);
  return num(cells[3] ?? "x");
}

const TRACE_LABELS = ["Activity", "Factor", "Factor value", "Factor year", "Source", "Method", "Formula", "Calculated at"];

/** Reads the open "How calculated" panel into label -> value. */
async function traceFields(editor: Locator): Promise<Record<string, string>> {
  const lines = (await editor.innerText()).split("\n").map((l) => l.trim()).filter(Boolean);
  const out: Record<string, string> = {};
  let current: string | null = null;
  for (const line of lines) {
    if (line === "Assumptions") break;
    if (TRACE_LABELS.includes(line)) {
      current = line;
      out[current] = "";
    } else if (current) {
      out[current] = out[current] ? `${out[current]} ${line}` : line;
    }
  }
  return out;
}

/** Parses "2000 kWh × 0.000369 tCO2e/kWh × 1000 kg/t" and returns raw × factor in tCO2e. */
function tonsFromFormula(formula: string): number {
  const m = /^([\d.]+) \S+ × ([\d.]+) \S+ × 1000 kg\/t$/.exec(formula.trim());
  if (!m) throw new Error(`Formula does not match the activity × factor × 1000 kg/t pattern: "${formula}"`);
  return Number(m[1]) * Number(m[2]);
}

/** Flags open on the client overview: "Flags open" stat card. */
async function flagsOpen(page: Page): Promise<number> {
  // The overview can hold two copies of this card in the browser DOM; both carry the same count.
  const card = page.getByText("Flags open", { exact: true }).locator("xpath=..").first();
  const text = (await card.innerText()).replace(/\s+/g, " ");
  const m = /Flags open\s*(\d+)/.exec(text);
  if (!m) throw new Error(`No flag count in: "${text}"`);
  return Number(m[1]);
}

/** Value of the stat/summary line that follows a label, e.g. "Scope 1" -> "10.2". */
async function summaryNumber(page: Page, label: string): Promise<number> {
  // The reports page can hold two copies of its stat cards in the browser DOM; both show the same figure.
  const value = page.getByText(label, { exact: true }).locator("xpath=following-sibling::p[1]").first();
  return num((await value.innerText()).trim());
}

// ── Consultant A: uploads, flags and requests for changes ──────────────────

test.describe("review queue", () => {
  test("approving an upload moves it out of the queue and marks it approved", async ({ page }) => {
    const c = await seedClient("approve", {
      uploads: [{ filename: "e2e-electric-march.csv", status: "pending_review", rows: [elec("E2E meter A", 2000)] }],
    });
    await page.goto(`${base(c.id)}/review`);
    await expect(page.getByRole("heading", { name: `Review: ${c.name}` })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Submitted uploads (1)" })).toBeVisible();
    await expect(page.getByText("e2e-electric-march.csv")).toBeVisible();

    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await expect.poll(() => sessionStatus(c.sessionIds[0])).toBe("approved");

    await page.reload();
    await expect(page.getByText("Submitted uploads")).toHaveCount(0);
  });

  test("flagging an upload keeps it in the queue with the note", async ({ page }) => {
    const c = await seedClient("flag", {
      uploads: [{ filename: "e2e-flag-me.csv", status: "pending_review", rows: [elec("E2E meter F", 900)] }],
    });
    const note = `E2E: which month is missing ${RUN}?`;
    await page.goto(`${base(c.id)}/review`);

    await page.getByRole("button", { name: "Flag as needing info", exact: true }).click();
    await page.getByPlaceholder("What does the client need to fix or provide?").fill(note);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect.poll(() => sessionStatus(c.sessionIds[0])).toBe("needs_info");
    const rows = await sql<{ reviewer_notes: string }>(`select reviewer_notes from intake_sessions where id = $1`, [c.sessionIds[0]]);
    expect(rows[0].reviewer_notes).toBe(note);

    await page.reload();
    await expect(page.getByText(`Note: ${note}`)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Submitted uploads (1)" })).toBeVisible();
  });

  // Fixed 2026-11-13: flagSession() logs session.flagged under the file name. Before, a flag left no
  // activity entry, though approve, reject and request changes all did.
  test("flagging an upload is written to the activity log", async ({ page }) => {
    const c = await seedClient("flaglog", {
      uploads: [{ filename: "e2e-flag-log.csv", status: "pending_review", rows: [elec("E2E meter FL", 700)] }],
    });
    await page.goto(`${base(c.id)}/review`);
    await page.getByRole("button", { name: "Flag as needing info", exact: true }).click();
    await page.getByPlaceholder("What does the client need to fix or provide?").fill("Please re-upload.");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect.poll(() => sessionStatus(c.sessionIds[0])).toBe("needs_info");

    await page.goto(`${base(c.id)}/activity`);
    await expect(page.getByText("Upload flagged: e2e-flag-log.csv")).toBeVisible();
  });

  test("rejecting an upload removes it and excludes its rows from every total", async ({ page }) => {
    const c = await seedClient("reject", {
      uploads: [{ filename: "e2e-reject-me.csv", status: "pending_review", rows: [elec("E2E meter R1", 1000), elec("E2E meter R2", 500)] }],
    });
    await page.goto(`${base(c.id)}/review`);
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    await expect.poll(() => sessionStatus(c.sessionIds[0])).toBe("rejected");

    await page.reload();
    await expect(page.getByText("Submitted uploads")).toHaveCount(0);
    await expect.poll(async () => (await rowStatuses(c.id, "E2E meter R1")).concat(await rowStatuses(c.id, "E2E meter R2"))).toEqual(["excluded", "excluded"]);

    await page.goto(`${base(c.id)}/ledger`);
    await expect(page.getByRole("link", { name: "excluded (2)" })).toBeVisible();
    expect((await ledgerTotal(page)).total).toBe(0);
  });

  test("request changes marks the upload as needing info and clears the form", async ({ page }) => {
    const c = await seedClient("changes", {
      uploads: [{ filename: "e2e-partial.csv", status: "pending_review", rows: [elec("E2E meter C", 800)] }],
    });
    const note = `E2E: March looks like a partial month ${RUN}`;
    await page.goto(`${base(c.id)}/review`);

    await page.getByRole("button", { name: "Request changes", exact: true }).click();
    await page.getByPlaceholder(/March electricity looks like a partial/).fill(note);
    await page.getByRole("button", { name: "Send back", exact: true }).click();

    await expect(page.getByRole("button", { name: "Request changes", exact: true })).toBeVisible();
    await expect.poll(() => sessionStatus(c.sessionIds[0])).toBe("needs_info");
    const rows = await sql<{ reviewer_notes: string }>(`select reviewer_notes from intake_sessions where id = $1`, [c.sessionIds[0]]);
    expect(rows[0].reviewer_notes).toBe(note);
  });

  // Fixed 2026-11-13: the portal lists uploads sent back for changes with the consultant's note, and
  // requestChanges() emails the client once. Before, the note never left the consultant's side. The
  // test server has no RESEND_API_KEY, so the email is recorded as email.failed.
  test("the client portal shows the consultant's request for changes", async ({ page, browser, problems }) => {
    const c = await seedClient("portalchg", {
      uploads: [{ filename: "e2e-portal-chg.csv", status: "pending_review", rows: [elec("E2E meter PC", 800)] }],
    });
    const note = `E2E: please re-upload the full bill ${RUN}`;
    await page.goto(`${base(c.id)}/review`);
    await page.getByRole("button", { name: "Request changes", exact: true }).click();
    await page.getByPlaceholder(/March electricity looks like a partial/).fill(note);
    await page.getByRole("button", { name: "Send back", exact: true }).click();
    await expect.poll(() => sessionStatus(c.sessionIds[0])).toBe("needs_info");

    const client = await pageAs(browser, "a", problems);
    await client.goto(`/portal/${c.token}`);
    await expect(client.getByRole("heading", { name: "Your consultant asked for changes" })).toBeVisible();
    await expect(client.getByText("e2e-portal-chg.csv")).toBeVisible();
    await expect(client.getByText(note)).toBeVisible();
    await expect
      .poll(async () => (await sql<{ verb: string }>(`select verb from events where company_id = $1 and subject ilike 'Changes-requested email%'`, [c.id])).map((r) => r.verb))
      .toEqual(["email.failed"]);
  });
});

// ── The stuck-flag thread: reply, portal, resolve ──────────────────────────

test.describe("stuck flags", () => {
  test("a client's stuck note is answered from the overview, seen on the portal, and resolved", async ({ page, browser, problems }) => {
    const question = "Which vendors are on these invoices?";
    const c = await seedClient("stuck", { stuckNote: question });
    await page.goto(base(c.id));
    // The overview can hold two copies of this card in the browser DOM; either one shows the same text.
    await expect(page.getByText(`Flag on Vendor invoices: “${question}”`).first()).toBeVisible();
    await expect.poll(() => flagsOpen(page)).toBe(1);

    const reply = `E2E: ask the hauler for the summary ${RUN}`;
    await page.getByPlaceholder(/Answer the client/).fill(reply);
    await page.getByRole("button", { name: "Reply", exact: true }).click();
    await expect.poll(async () => (await sql<{ n: number }>(
      `select count(*)::int as n from comments where company_id = $1 and checklist_item_id = 'item_2' and author_type = 'consultant'`,
      [c.id]
    ))[0].n).toBe(1);

    await page.goto(base(c.id));
    await expect(page.getByText("You replied:")).toBeVisible();
    await expect(page.getByText(reply)).toBeVisible();

    const client = await pageAs(browser, "a", problems);
    await client.goto(`/portal/${c.token}`);
    await expect(client.getByText(reply)).toBeVisible({ timeout: 10_000 });

    await page.goto(base(c.id));
    await page.getByRole("button", { name: "Mark resolved", exact: true }).click();
    await expect.poll(async () => {
      const rows = await sql<{ checklist: { id: string; stuckNote?: string | null }[] }>(`select checklist from data_requests where id = $1`, [c.requestId]);
      return rows[0].checklist.find((i) => i.id === "item_2")?.stuckNote ?? null;
    }).toBeNull();
    await page.reload();
    await expect.poll(() => flagsOpen(page)).toBe(0);
    await expect(page.getByText("Mark resolved")).toHaveCount(0);
  });
});

// ── Bayshore Bottling: read the ledger and exclude/restore a row, then put everything back ──

test.describe("Bayshore Bottling ledger (demo_bayb)", () => {
  test.use({ storageState: statePath("a") });

  type Original = { id: string; status: string; co2e_kg: string; raw_value: string; raw_unit: string; category: string; scope: number; confidence: string; factor_id: string | null; calc_log: unknown };
  let original: Original[] = [];

  test.beforeAll(async () => {
    original = await sql<Original>(
      `select id, status, co2e_kg, raw_value, raw_unit, category, scope, confidence, factor_id, calc_log from emission_line_items where company_id = 'demo_bayb' order by id`
    );
    expect(original.length, "demo_bayb should hold 12 line items").toBe(12);
  });

  test.afterEach(async () => {
    for (const o of original) {
      await sql(
        `update emission_line_items set status=$2, co2e_kg=$3, raw_value=$4, raw_unit=$5, category=$6, scope=$7, confidence=$8, factor_id=$9, calc_log=$10::jsonb where id=$1`,
        [o.id, o.status, o.co2e_kg, o.raw_value, o.raw_unit, o.category, o.scope, o.confidence, o.factor_id, JSON.stringify(o.calc_log)]
      );
    }
  });

  test("the totals line equals the sum of the rows it shows", async ({ page }) => {
    await page.goto(`${base("demo_bayb")}/ledger`);
    const { total, count } = await ledgerTotal(page);
    const rows: string[][] = [];
    // Data rows are the ones with eight <td> cells (the header uses <th>).
    const readRows = () => page.getByRole("row").evaluateAll((trs) =>
      trs.map((tr) => Array.from(tr.querySelectorAll(":scope > td")).map((td) => (td as HTMLElement).innerText.trim())).filter((cells) => cells.length === 8)
    );
    await expect.poll(async () => (await readRows()).length).toBe(count);
    rows.push(...(await readRows()));
    const shown = rows.map((r) => Number(r[3].replace(/,/g, ""))).filter((n) => !Number.isNaN(n));
    const sum = shown.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - total), `rows sum ${sum} vs totals line ${total}`).toBeLessThanOrEqual(0.01);

    const db = await sql<{ s: number }>(`select coalesce(sum(co2e_kg), 0)::float8 as s from emission_line_items where company_id = 'demo_bayb' and status = 'mapped'`);
    expect(Math.abs(total - db[0].s / 1000)).toBeLessThanOrEqual(0.01);
  });

  // Fixed 2026-11-13 by removing app/consultant/loading.tsx (docs/known-issues.md, the server action
  // stall). Before, the totals line kept the old figure until a reload while the row showed "excluded".
  test("the ledger totals line follows Exclude and Restore without a reload", async ({ page }) => {
    await page.goto(`${base("demo_bayb")}/ledger`);
    const before = (await ledgerTotal(page)).total;
    const value = await tonsFor(page, "4,620 kWh");
    await rowFor(page, "4,620 kWh").getByRole("button", { name: "Exclude", exact: true }).click();
    await expect.poll(async () => (await ledgerTotal(page)).total, { timeout: 10_000 }).toBeLessThan(before - value / 2);
    await rowFor(page, "4,620 kWh").getByRole("button", { name: "Restore", exact: true }).click();
    await expect.poll(async () => (await ledgerTotal(page)).total, { timeout: 10_000 }).toBeCloseTo(before, 1);
  });

  test("excluding a row drops the total by its value; restoring brings it back, across reloads", async ({ page }) => {
    await page.goto(`${base("demo_bayb")}/ledger`);
    await expect(rowFor(page, "4,620 kWh")).toBeVisible();
    const before = (await ledgerTotal(page)).total;
    const value = await tonsFor(page, "4,620 kWh");
    expect(value).toBeGreaterThan(0);

    await rowFor(page, "4,620 kWh").getByRole("button", { name: "Exclude", exact: true }).click();
    await expect.poll(async () => (await sql<{ status: string }>(`select status from emission_line_items where company_id = 'demo_bayb' and raw_value = 4620`))[0].status).toBe("excluded");

    await page.reload();
    await expect(rowFor(page, "4,620 kWh").getByText("excluded")).toBeVisible();
    const after = (await ledgerTotal(page)).total;
    expect(Math.abs(after - (before - value))).toBeLessThanOrEqual(0.015);

    await rowFor(page, "4,620 kWh").getByRole("button", { name: "Restore", exact: true }).click();
    await expect.poll(async () => (await sql<{ status: string }>(`select status from emission_line_items where company_id = 'demo_bayb' and raw_value = 4620`))[0].status).toBe("mapped");

    await page.reload();
    await expect(rowFor(page, "4,620 kWh").getByText("mapped")).toBeVisible();
    expect(Math.abs((await ledgerTotal(page)).total - before)).toBeLessThanOrEqual(0.015);
  });
});

// ── The ledger on a client we own: quantity, category, comments, actual, dollar fuel, vendors ──

test.describe("ledger corrections", () => {
  test("correcting a quantity recalculates the row and the total, and setting it back restores both", async ({ page }) => {
    const c = await seedClient("qty", { rows: [elec("E2E meter Q", 2000)] });
    await page.goto(`${base(c.id)}/ledger`);
    await expect.poll(() => tonsFor(page, "E2E meter Q")).toBeCloseTo(0.738, 3);

    await rowFor(page, "E2E meter Q").getByRole("button", { name: "Qty", exact: true }).click();
    const editor = editorFor(page, "E2E meter Q");
    await editor.getByRole("spinbutton").fill("1000");
    await editor.getByRole("button", { name: "Save", exact: true }).click();
    await expect.poll(() => tonsFor(page, "E2E meter Q")).toBeCloseTo(0.369, 3);

    await rowFor(page, "E2E meter Q").getByRole("button", { name: "How calculated", exact: true }).click();
    const fields = await traceFields(editorFor(page, "E2E meter Q"));
    expect(fields["Formula"]).toBe("1000 kWh × 0.000369 tCO2e/kWh × 1000 kg/t");
    expect(fields["Factor value"]).toBe("0.000369 tCO2e/kWh");
    await rowFor(page, "E2E meter Q").getByRole("button", { name: "How calculated", exact: true }).click();

    await rowFor(page, "E2E meter Q").getByRole("button", { name: "Qty", exact: true }).click();
    await editorFor(page, "E2E meter Q").getByRole("spinbutton").fill("2000");
    await editorFor(page, "E2E meter Q").getByRole("button", { name: "Save", exact: true }).click();
    await expect.poll(() => tonsFor(page, "E2E meter Q")).toBeCloseTo(0.738, 3);

    await page.reload();
    await expect.poll(() => tonsFor(page, "E2E meter Q")).toBeCloseTo(0.738, 3);
    const raw = await sql<{ raw_value: string }>(`select raw_value from emission_line_items where company_id = $1 and source_ref = 'E2E meter Q'`, [c.id]);
    expect(Number(raw[0].raw_value)).toBe(2000);
  });

  test("How calculated shows the factor name, value, unit and formula, and the formula multiplies out to the row", async ({ page }) => {
    const c = await seedClient("trace", { rows: [elec("E2E meter T", 2000), diesel("E2E truck T", 500)] });
    await page.goto(`${base(c.id)}/ledger`);

    for (const [ref, factorName, factorValue, unit] of [
      ["E2E meter T", "US national average grid", "0.000369", "tCO2e/kWh"],
      ["E2E truck T", "Diesel fuel", "0.01021", "tCO2e/gallon"],
    ] as const) {
      const tons = await tonsFor(page, ref);
      await rowFor(page, ref).getByRole("button", { name: "How calculated", exact: true }).click();
      const fields = await traceFields(editorFor(page, ref));
      expect(fields["Factor"]).toContain(factorName);
      expect(fields["Factor value"]).toBe(`${factorValue} ${unit}`);
      expect(fields["Factor year"]).toMatch(/^20(24|25)$/);
      expect(fields["Formula"]).toContain(`× ${factorValue} ${unit} × 1000 kg/t`);
      expect(Math.abs(tonsFromFormula(fields["Formula"]) - tons)).toBeLessThanOrEqual(0.0006);
      await rowFor(page, ref).getByRole("button", { name: "How calculated", exact: true }).click();
    }
  });

  // Fixed 2026-11-13: when a row's factor is not in the emission_factors table (empty in the test
  // database), the ledger falls back to the seed factor the calc used (ledger/factor-source.ts).
  test("How calculated names the factor source even when the factor table is empty", async ({ page }) => {
    const c = await seedClient("source", { rows: [elec("E2E meter S", 2000)] });
    await page.goto(`${base(c.id)}/ledger`);
    await rowFor(page, "E2E meter S").getByRole("button", { name: "How calculated", exact: true }).click();
    const fields = await traceFields(editorFor(page, "E2E meter S"));
    expect(fields["Source"]).toContain("EPA eGRID");
  });

  test("recategorizing a row recomputes it with the new factor, and setting it back restores it", async ({ page }) => {
    const c = await seedClient("recat", { rows: [diesel("E2E truck R", 500)] });
    await page.goto(`${base(c.id)}/ledger`);
    await expect.poll(() => tonsFor(page, "E2E truck R")).toBeCloseTo(5.105, 3);

    await rowFor(page, "E2E truck R").getByRole("button", { name: "Category", exact: true }).click();
    await editorFor(page, "E2E truck R").getByRole("combobox").selectOption({ label: "Propane supplier (gallons)" });
    await expect.poll(() => tonsFor(page, "E2E truck R")).toBeCloseTo(2.876, 3);
    await expect(rowFor(page, "E2E truck R").getByText("S1 · stationary combustion")).toBeVisible();

    await page.reload();
    await expect.poll(() => tonsFor(page, "E2E truck R")).toBeCloseTo(2.876, 3);

    await rowFor(page, "E2E truck R").getByRole("button", { name: "Category", exact: true }).click();
    await editorFor(page, "E2E truck R").getByRole("combobox").selectOption({ label: "Diesel fuel supplier (gallons)" });
    await expect.poll(() => tonsFor(page, "E2E truck R")).toBeCloseTo(5.105, 3);
    await expect(rowFor(page, "E2E truck R").getByText("S1 · mobile combustion")).toBeVisible();
  });

  test("a comment on a row shows on reload", async ({ page }) => {
    const c = await seedClient("comment", { rows: [elec("E2E meter M", 2000)] });
    const body = `E2E: does this include the delivery trucks ${RUN}?`;
    await page.goto(`${base(c.id)}/ledger`);

    await rowFor(page, "E2E meter M").getByRole("button", { name: "notes", exact: true }).click();
    await editorFor(page, "E2E meter M").getByRole("textbox").fill(body);
    await editorFor(page, "E2E meter M").getByRole("button", { name: "Comment (emails client)" }).click();
    await expect(rowFor(page, "E2E meter M").getByRole("button", { name: "notes (1)" })).toBeVisible();

    await page.reload();
    await rowFor(page, "E2E meter M").getByRole("button", { name: "notes (1)" }).click();
    await expect(editorFor(page, "E2E meter M").getByText(body)).toBeVisible();
    const rows = await sql<{ n: number }>(`select count(*)::int as n from comments where line_item_id in (select id from emission_line_items where company_id = $1 and source_ref = 'E2E meter M') and author_type = 'consultant'`, [c.id]);
    expect(rows[0].n).toBe(1);
  });

  test("marking an estimate as actual changes its label, and the label survives a reload", async ({ page }) => {
    const c = await seedClient("actual", { rows: [elec("E2E meter A2", 2000, "estimated")] });
    await page.goto(`${base(c.id)}/ledger`);
    await expect(rowFor(page, "E2E meter A2").getByText("E", { exact: true })).toBeVisible();

    await rowFor(page, "E2E meter A2").getByRole("button", { name: "Mark actual", exact: true }).click();
    await editorFor(page, "E2E meter A2").getByRole("button", { name: "Mark actual", exact: true }).click();

    await expect(rowFor(page, "E2E meter A2").getByText("A", { exact: true })).toBeVisible();
    await expect(rowFor(page, "E2E meter A2").getByRole("button", { name: "Mark actual", exact: true })).toHaveCount(0);
    await page.reload();
    await expect(rowFor(page, "E2E meter A2").getByText("A", { exact: true })).toBeVisible();
    const conf = await sql<{ confidence: string }>(`select confidence from emission_line_items where company_id = $1 and source_ref = 'E2E meter A2'`, [c.id]);
    expect(conf[0].confidence).toBe("actual");
  });

  test("dollar-based fuel converts to gallons at the price entered on review", async ({ page }) => {
    const unmapped = (ref: string, dollars: number): RowSeed => ({
      ref, scope: 1, category: "mobile_combustion", raw: dollars, unit: "USD", status: "unmapped", activity: "Diesel fuel - fleet card",
    });
    const c = await seedClient("dollar", { rows: [unmapped("E2E Shell card A", 420), unmapped("E2E Shell card B", 310)] });
    await page.goto(`${base(c.id)}/review`);
    await expect(page.getByRole("heading", { name: "Dollar-based fuel (2 rows)" })).toBeVisible();

    // The browser DOM holds two copies of this input (the server HTML has one); the first is the one shown.
    await page.getByPlaceholder("4.10").first().fill("4");
    await page.getByRole("button", { name: "Convert rows", exact: true }).click();
    await expect.poll(async () => (await rowStatuses(c.id, "E2E Shell card A")).concat(await rowStatuses(c.id, "E2E Shell card B"))).toEqual(["mapped", "mapped"]);

    await page.goto(`${base(c.id)}/ledger`);
    await expect.poll(() => tonsFor(page, "E2E Shell card A")).toBeCloseTo(1.072, 3);
    expect(await tonsFor(page, "E2E Shell card B")).toBeCloseTo(0.791, 3);
    const formula = (await traceFieldsAfterOpen(page, "E2E Shell card A"))["Formula"];
    expect(formula).toContain("$420 ÷ $4/gal = 105.00 gal");
    expect((await ledgerTotal(page)).count).toBe(2);
  });

  test("a vendor reference confirmed on review recalculates its flagged rows", async ({ page }) => {
    const vendor = `E2E Haulco ${RUN}`;
    const flagged: RowSeed = { ref: vendor, scope: 1, category: "mobile_combustion", raw: 300, unit: "gallon", status: "unmapped", activity: "Hauling fuel" };
    const c = await seedClient("vendor", { rows: [flagged] });
    await page.goto(`${base(c.id)}/review`);
    await expect(page.getByRole("heading", { name: "Flagged rows, grouped by reference (1)" })).toBeVisible();
    await expect(page.getByText(vendor, { exact: true })).toBeVisible();

    await page.getByRole("combobox").selectOption({ label: "Diesel fuel supplier (gallons)" });
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect.poll(() => rowStatuses(c.id, vendor)).toEqual(["mapped"]);

    await page.goto(`${base(c.id)}/ledger`);
    await expect.poll(() => tonsFor(page, vendor)).toBeCloseTo(3.063, 3);
    await expect(rowFor(page, vendor).getByText("mapped")).toBeVisible();
  });
});

// ── Manual entry on the manage pages ───────────────────────────────────────

test.describe("manual entry and totals", () => {
  test("Scope 1 fuel entered on manage/scope1 shows in the report totals", async ({ page }) => {
    const c = await seedClient("scope1");
    await page.goto(`${base(c.id)}/manage/scope1`);
    await page.locator('input[name="fleet_diesel_gal"]').fill("1000");
    await page.getByRole("button", { name: "Save Scope 1", exact: true }).click();
    await expect.poll(async () => JSON.stringify(await sql(`select data from company_inputs where company_id = $1`, [c.id]))).toContain("fleet_diesel_gal");
    await expect.poll(async () => {
      await page.goto(`${base(c.id)}/manage/reports`);
      return summaryNumber(page, "Scope 1");
    }).toBeCloseTo(10.2, 1);
    expect(await page.getByText("Total", { exact: true }).locator("xpath=following-sibling::p[1]").first().innerText()).toBe("10.2");
  });

  test("a Scope 2 market-based override is saved and kept on reload", async ({ page }) => {
    const c = await seedClient("scope2");
    await page.goto(`${base(c.id)}/manage/scope2`);
    await page.locator('input[name="scope2_market_override_tons"]').fill("12.5");
    await page.locator('input[name="scope2_market_override_reason"]').fill("E2E supplier-specific factor");
    await page.getByRole("button", { name: "Save Scope 2", exact: true }).click();
    await expect.poll(async () => JSON.stringify(await sql(`select data from company_inputs where company_id = $1`, [c.id]))).toContain("E2E supplier-specific factor");

    await page.goto(`${base(c.id)}/manage/scope2`);
    await expect(page.locator('input[name="scope2_market_override_tons"]')).toHaveValue("12.5");
    await expect(page.locator('input[name="scope2_market_override_reason"]')).toHaveValue("E2E supplier-specific factor");
  });

  test("a Scope 3 industry-average estimate is saved, adds to Scope 3, and undoing it removes it", async ({ page }) => {
    const c = await seedClient("scope3");
    await page.goto(`${base(c.id)}/manage/scope3`);
    await page.getByRole("button", { name: "Estimate w/ industry avg", exact: true }).first().click();
    await expect.poll(async () => JSON.stringify((await sql<{ data: { scope3_other_categories?: Record<string, string> } }>(
      `select data from company_inputs where company_id = $1`, [c.id]))[0]?.data.scope3_other_categories ?? {})).toContain("industry_average");

    await page.reload();
    await expect(page.getByText("Industry average estimate (low confidence)").first()).toBeVisible();
    await page.goto(`${base(c.id)}/manage/reports`);
    await expect.poll(() => summaryNumber(page, "Scope 3")).toBeCloseTo(5, 1);

    await page.goto(`${base(c.id)}/manage/scope3`);
    await page.getByRole("button", { name: "undo", exact: true }).first().click();
    await expect.poll(async () => JSON.stringify((await sql<{ data: { scope3_other_categories?: Record<string, string> } }>(
      `select data from company_inputs where company_id = $1`, [c.id]))[0]?.data.scope3_other_categories ?? {})).not.toContain("industry_average");
    await page.reload();
    await expect(page.getByText("Industry average estimate (low confidence)")).toHaveCount(0);
    await page.goto(`${base(c.id)}/manage/reports`);
    await expect.poll(() => summaryNumber(page, "Scope 3")).toBeCloseTo(0, 1);
  });

  test("a Scope 3 category marked not applicable is saved and adds nothing", async ({ page }) => {
    const c = await seedClient("scope3na");
    await page.goto(`${base(c.id)}/manage/scope3`);
    await page.getByRole("button", { name: "Not applicable", exact: true }).first().click();
    await expect.poll(async () => JSON.stringify((await sql<{ data: { scope3_other_categories?: Record<string, string> } }>(
      `select data from company_inputs where company_id = $1`, [c.id]))[0]?.data.scope3_other_categories ?? {})).toContain('"na"');
    await page.reload();
    await expect(page.getByText("Marked not applicable").first()).toBeVisible();
    await page.goto(`${base(c.id)}/manage/reports`);
    expect(await summaryNumber(page, "Scope 3")).toBeCloseTo(0, 1);
  });

  test("the GHG report PDF downloads as application/pdf once Scope 1 and 2 are complete", async ({ page }) => {
    const c = await seedClient("pdf");
    await page.goto(`${base(c.id)}/manage/scope1`);
    const naBoxes = page.getByRole("checkbox", { name: "Not applicable", exact: true });
    await expect(naBoxes).toHaveCount(4);
    for (const box of await naBoxes.all()) await box.check();
    await page.getByRole("button", { name: "Save Scope 1", exact: true }).click();
    await expect.poll(async () => JSON.stringify(await sql(`select section_status from companies where id = $1`, [c.id]))).toContain('"scope1":"complete"');

    await page.goto(`${base(c.id)}/manage/scope2`);
    await page.getByRole("radio", { name: /No \/ not sure/ }).check();
    await page.getByRole("checkbox", { name: "Data reviewed and correct" }).check();
    await page.getByRole("button", { name: "Save Scope 2", exact: true }).click();
    await expect.poll(async () => JSON.stringify(await sql(`select section_status from companies where id = $1`, [c.id]))).toContain('"scope2":"complete"');

    await page.goto(`${base(c.id)}/manage/reports`);
    await page.getByRole("button", { name: "Generate PDF", exact: true }).click();
    const link = page.getByRole("link", { name: "Download PDF", exact: true });
    await expect(link).toBeVisible({ timeout: 60_000 });
    const href = await link.getAttribute("href");
    expect(href).toBe(`/api/report/pdf?companyId=${c.id}`);

    const res = await page.request.get(href!, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");
    expect((await res.body()).subarray(0, 4).toString()).toBe("%PDF");
  });
});

// ── Activity ───────────────────────────────────────────────────────────────

test.describe("activity", () => {
  // Fixed 2026-11-13: approveSession() logs the file name. Before, the activity log read
  // "Upload approved: is_<id>".
  test("an approved upload is logged under its file name, not its internal id", async ({ page }) => {
    const c = await seedClient("approvelog", {
      uploads: [{ filename: "e2e-approve-log.csv", status: "pending_review", rows: [elec("E2E meter AL", 600)] }],
    });
    await page.goto(`${base(c.id)}/review`);
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await expect.poll(() => sessionStatus(c.sessionIds[0])).toBe("approved");
    await page.goto(`${base(c.id)}/activity`);
    await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
    await expect(page.getByText("Upload approved: e2e-approve-log.csv")).toBeVisible();
  });

  test("the activity log lists what was just done, newest first", async ({ page }) => {
    const ref = `E2E meter ACT ${RUN}`;
    const c = await seedClient("activity", {
      uploads: [{ filename: "e2e-activity.csv", status: "pending_review", rows: [elec(ref, 2000)] }],
    });

    await page.goto(`${base(c.id)}/review`);
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await expect.poll(() => sessionStatus(c.sessionIds[0])).toBe("approved");

    await page.goto(`${base(c.id)}/ledger`);
    await rowFor(page, ref).getByRole("button", { name: "notes", exact: true }).click();
    await editorFor(page, ref).getByRole("textbox").fill("E2E: first comment");
    await editorFor(page, ref).getByRole("button", { name: "Comment (emails client)" }).click();
    await expect(rowFor(page, ref).getByRole("button", { name: "notes (1)" })).toBeVisible();

    await rowFor(page, ref).getByRole("button", { name: "Exclude", exact: true }).click();
    await expect.poll(() => rowStatuses(c.id, ref)).toEqual(["excluded"]);
    // logEvent() is fire-and-forget, so wait for the row to land before reading the log.
    await expect.poll(async () => (await sql(`select verb from events where company_id = $1 and verb = 'item.excluded'`, [c.id])).length).toBe(1);

    await page.goto(`${base(c.id)}/activity`);
    await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
    await expect(page.getByText(`Row excluded: ${ref}`)).toBeVisible();
    const text = (await page.innerText("body")).replace(/\s+/g, " ");
    const excluded = text.indexOf(`Row excluded: ${ref}`);
    const commented = text.indexOf(`Comment: ${ref}`);
    const approved = text.indexOf("Upload approved:");
    expect(excluded, "exclusion is logged").toBeGreaterThanOrEqual(0);
    expect(commented, "comment is logged").toBeGreaterThanOrEqual(0);
    expect(approved, "approval is logged").toBeGreaterThanOrEqual(0);
    expect(excluded).toBeLessThan(commented);
    expect(commented).toBeLessThan(approved);
  });
});

/** Opens the How-calculated panel for a row, reads its fields, and closes it again. */
async function traceFieldsAfterOpen(page: Page, ref: string): Promise<Record<string, string>> {
  await rowFor(page, ref).getByRole("button", { name: "How calculated", exact: true }).click();
  const fields = await traceFields(editorFor(page, ref));
  await rowFor(page, ref).getByRole("button", { name: "How calculated", exact: true }).click();
  return fields;
}
