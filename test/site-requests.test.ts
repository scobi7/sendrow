import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  sendDataRequestEmail: vi.fn(),
  logEvent: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: { dataRequests: { findFirst: async () => null } },
    insert: () => ({ values: async () => undefined }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  },
}));
vi.mock("@/lib/email", () => ({ sendDataRequestEmail: mocks.sendDataRequestEmail }));
vi.mock("@/lib/branding", () => ({
  getBrandForCompany: async () => ({ brandName: "Green Advisors", logoUrl: null, accentColor: null, replyTo: null }),
}));
vi.mock("@/lib/events", () => ({ logEvent: mocks.logEvent }));
vi.mock("@/lib/portal", () => ({
  generatePortalToken: () => "tok_site_1",
  portalExpiry: () => "2027-01-01T00:00:00.000Z",
  buildChecklist: () => [],
}));

import { sendSiteLink } from "@/lib/site-requests";

type Opts = Parameters<typeof sendSiteLink>[0];
const location = (contactEmail: string | null) =>
  ({ id: "loc_1", companyId: "co_1", name: "Plant A", city: "Reno", address: "1 Main St", contactName: "Ops", contactEmail }) as unknown as Opts["location"];
const base = { companyId: "co_1", requestedBy: "portal:req_1", actorType: "supplier" as const };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendSiteLink reports whether the site email actually went out", () => {
  it("returns emailed false and logs email.failed when the send fails", async () => {
    mocks.sendDataRequestEmail.mockResolvedValue(false);
    const result = await sendSiteLink({ ...base, location: location("ops@acme.com") });
    expect(result.token).toBe("tok_site_1");
    expect(result.emailed).toBe(false);
    expect(mocks.logEvent).toHaveBeenCalledWith(expect.objectContaining({ verb: "email.failed" }));
  });

  it("returns emailed true when the send goes out", async () => {
    mocks.sendDataRequestEmail.mockResolvedValue(true);
    const result = await sendSiteLink({ ...base, location: location("ops@acme.com") });
    expect(result.emailed).toBe(true);
    expect(mocks.logEvent).toHaveBeenCalledWith(expect.objectContaining({ verb: "email.sent" }));
  });

  it("returns emailed false and sends nothing when the site has no contact email", async () => {
    const result = await sendSiteLink({ ...base, location: location(null) });
    expect(result.emailed).toBe(false);
    expect(mocks.sendDataRequestEmail).not.toHaveBeenCalled();
  });
});
