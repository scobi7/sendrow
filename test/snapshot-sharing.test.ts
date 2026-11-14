import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks are hoisted, so shared state and send spies live in vi.hoisted.
const mocks = vi.hoisted(() => ({
  logEvent: vi.fn(),
  sendRestatementEmail: vi.fn(),
  sendSnapshotShareEmail: vi.fn(),
  state: {
    tables: new Map<unknown, unknown[]>(),
    snapshot: null as unknown,
    company: null as unknown,
    inserts: [] as { table: unknown; values: Record<string, unknown> }[],
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/lib/db", () => {
  const rowsFor = (t: unknown) => (mocks.state.tables.get(t) ?? []) as unknown[];
  // Every query method returns the same thenable chain, resolving to the table's rows.
  const chain = (rows: unknown[]) => {
    const c: Record<string, unknown> = {
      where: () => c,
      orderBy: () => c,
      limit: () => c,
      then: (res: (v: unknown[]) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(rows).then(res, rej),
    };
    return c;
  };
  return {
    db: {
      select: () => ({ from: (t: unknown) => chain(rowsFor(t)) }),
      insert: (t: unknown) => ({
        values: async (v: Record<string, unknown>) => {
          mocks.state.inserts.push({ table: t, values: v });
        },
      }),
      update: () => ({ set: () => ({ where: async () => undefined }) }),
      query: {
        companies: { findFirst: async () => mocks.state.company },
        snapshots: { findFirst: async () => mocks.state.snapshot },
      },
    },
  };
});

vi.mock("@/lib/auth", () => ({
  currentUser: async () => ({ id: "user_1", role: "consultant", name: "Sam", email: "sam@green.test" }),
}));
vi.mock("@/lib/guards", () => ({ findOwnedLink: async () => ({ id: "link_1" }) }));
vi.mock("@/lib/store", () => ({
  loadCompany: async () => ({ id: "co_1", name: "Acme Corp", calcs: [] }),
  loadFactors: async () => [],
  persistCompany: async () => undefined,
  uid: (p = "") => p + "x",
}));
vi.mock("@/lib/calc", () => ({
  combinedTotals: () => ({ scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0, total: 100 }),
  recalcCompany: () => ({}),
}));
vi.mock("@/lib/email", () => ({
  sendRestatementEmail: mocks.sendRestatementEmail,
  sendSnapshotShareEmail: mocks.sendSnapshotShareEmail,
  sendCommentEmail: vi.fn(),
  sendFlagReplyEmail: vi.fn(),
  sendDataRequestEmail: vi.fn(),
}));
vi.mock("@/lib/branding", () => ({
  getBrandForCompany: async () => ({ brandName: "Green Advisors", logoUrl: null, accentColor: null, replyTo: "hello@green.test" }),
}));
vi.mock("@/lib/events", () => ({ logEvent: mocks.logEvent }));
vi.mock("@/lib/audit", () => ({ logChange: vi.fn() }));
vi.mock("@/lib/progress", () => ({ refreshSectionStatus: vi.fn(), canGenerateReport: vi.fn() }));
vi.mock("@/lib/ledger", () => ({}));
vi.mock("@/lib/factor-engine", () => ({ lookupFactor: vi.fn(), getFactorsFromDb: async () => [] }));
vi.mock("@/lib/vendor-mappings", () => ({ normalizeVendor: vi.fn(), matchVendor: vi.fn(), VENDOR_CONFIRM_OPTIONS: [], getVendorMappingsFromDb: async () => [] }));
vi.mock("@/lib/ingestion/ingest", () => ({ rowToLineItem: vi.fn() }));
vi.mock("@/lib/ingestion/supplier-calculated", () => ({ isSupplierCalculated: () => false }));
vi.mock("@/lib/site-requests", () => ({ siteLabel: () => "Main site" }));
vi.mock("@/lib/portal", () => ({
  generatePortalToken: () => "tok_share_1",
  portalExpiry: () => "2027-01-01T00:00:00.000Z",
  buildChecklist: () => [],
}));

import { shareSnapshot, createSnapshot } from "@/lib/consultant-actions";
import * as schema from "@/lib/db/schema";

const snapRow = { id: "snap_old", companyId: "co_1", label: "FY26 base", period: null, createdAt: "2026-11-01T10:00:00.000Z", totals: { scope1: 40, scope2Location: 0, scope2Market: 0, scope3: 10, total: 50 } };

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

function emailEvents() {
  return mocks.logEvent.mock.calls.map((c) => c[0]).filter((e) => e.verb === "email.sent" || e.verb === "email.failed");
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.tables.clear();
  mocks.state.inserts.length = 0;
  mocks.state.snapshot = snapRow;
  mocks.state.company = { id: "co_1", name: "Acme Corp" };
  mocks.sendSnapshotShareEmail.mockResolvedValue(true);
  mocks.sendRestatementEmail.mockResolvedValue(true);
});

describe("shareSnapshot sends the share email", () => {
  it("emails the recipient with the share token and logs email.sent", async () => {
    await shareSnapshot("co_1", "snap_old", form({ recipient_email: "client@acme.com", recipient_label: "Jane" }));

    const shareInsert = mocks.state.inserts.find((i) => i.table === schema.shareLinks);
    expect(shareInsert?.values.token).toBe("tok_share_1");
    expect(mocks.sendSnapshotShareEmail).toHaveBeenCalledTimes(1);
    const [to, company, label, period, frozenOn, token, brand] = mocks.sendSnapshotShareEmail.mock.calls[0];
    expect(to).toBe("client@acme.com");
    expect(company).toBe("Acme Corp");
    expect(label).toBe("FY26 base");
    expect(period).toBeNull();
    expect(frozenOn).toBe("2026-11-01");
    expect(token).toBe("tok_share_1");
    expect(brand.brandName).toBe("Green Advisors");
    expect(emailEvents()).toEqual([expect.objectContaining({ verb: "email.sent", subjectId: "snap_old" })]);
  });

  it("logs email.failed when the send does not go out", async () => {
    mocks.sendSnapshotShareEmail.mockResolvedValue(false);
    await shareSnapshot("co_1", "snap_old", form({ recipient_email: "client@acme.com" }));
    expect(emailEvents()).toEqual([expect.objectContaining({ verb: "email.failed" })]);
  });

  it("sends nothing for a link-only share", async () => {
    await shareSnapshot("co_1", "snap_old", form({ recipient_label: "Jane" }));
    expect(mocks.state.inserts.some((i) => i.table === schema.shareLinks)).toBe(true);
    expect(mocks.sendSnapshotShareEmail).not.toHaveBeenCalled();
    expect(emailEvents()).toEqual([]);
  });
});

describe("restatement alerts record one event per recipient", () => {
  it("sends to each emailed share link, records sent or failed for each, and skips link-only shares", async () => {
    mocks.state.tables.set(schema.snapshots, [snapRow]);
    mocks.state.tables.set(schema.shareLinks, [
      { token: "t1", companyId: "co_1", snapshotId: "snap_old", recipientEmail: "a@acme.com", revokedAt: null },
      { token: "t2", companyId: "co_1", snapshotId: "snap_old", recipientEmail: "b@acme.com", revokedAt: null },
      { token: "t3", companyId: "co_1", snapshotId: "snap_old", recipientEmail: null, revokedAt: null },
    ]);
    mocks.sendRestatementEmail.mockImplementation(async (to: string) => to === "b@acme.com" ? false : true);

    await createSnapshot("co_1", form({ label: "FY26 restated" }));

    expect(mocks.sendRestatementEmail).toHaveBeenCalledTimes(2);
    const events = emailEvents();
    expect(events).toHaveLength(2);
    expect(events.find((e) => e.verb === "email.sent")?.subject).toContain("a@acme.com");
    expect(events.find((e) => e.verb === "email.failed")?.subject).toContain("b@acme.com");
  });

  it("does not record a restatement event when nothing changed", async () => {
    mocks.state.tables.set(schema.snapshots, [{ ...snapRow, totals: { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0, total: 100 } }]);
    mocks.state.tables.set(schema.shareLinks, [{ token: "t1", companyId: "co_1", snapshotId: "snap_old", recipientEmail: "a@acme.com", revokedAt: null }]);
    await createSnapshot("co_1", form({ label: "FY26 same" }));
    expect(mocks.sendRestatementEmail).not.toHaveBeenCalled();
    expect(emailEvents()).toEqual([]);
  });
});
