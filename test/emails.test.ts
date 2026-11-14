import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendDataRequestEmail, sendUploadNeedsReviewEmail, sendSnapshotShareEmail } from "@/lib/email";

describe("review-queue notification emails (Plan I / H17)", () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });

  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sendDataRequestEmail sends to the client with the request description and portal link", async () => {
    await sendDataRequestEmail("client@acme.com", "Jane Doe", "Acme Corp", "Please upload Q3 fuel card export", "2026-08-01", "tok_abc123");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(init.body);
    expect(body.to).toEqual(["client@acme.com"]);
    expect(body.subject).toContain("Acme Corp");
    expect(body.html).toContain("Please upload Q3 fuel card export");
    expect(body.html).toContain("2026-08-01");
    expect(body.html).toContain("/portal/tok_abc123");
    // contracts §11: no Sendrow signature in client-facing copy
    // (the portal URL's domain is a known N5 white-label gap)
    expect(body.html).not.toContain("Sendrow team");
  });

  it("sendPortalReminderEmail carries no Sendrow signature (contracts §11)", async () => {
    const { sendPortalReminderEmail } = await import("@/lib/email");
    await sendPortalReminderEmail("client@acme.com", "Jane", "Acme", "utility bills", "tok_r", { tier: "due-2", daysUntilDue: 2 }, null);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.html).toContain("/portal/tok_r");
    expect(body.html).not.toContain("Sendrow team");
  });

  it("sendUploadNeedsReviewEmail sends to the consultant with the unmapped count", async () => {
    await sendUploadNeedsReviewEmail("consultant@esg.com", "Sam Reviewer", "Acme Corp", "fuel-2026.xlsx", 3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(["consultant@esg.com"]);
    expect(body.subject).toContain("needs review");
    expect(body.html).toContain("fuel-2026.xlsx");
    expect(body.html).toContain("<strong>3</strong>");
  });

  it("does nothing when RESEND_API_KEY is not set", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await sendDataRequestEmail("client@acme.com", "Jane", "Acme", "desc", null, "tok_x");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("snapshot share email (consultant shares a frozen snapshot)", () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });
  const brand = { brandName: "Green Advisors", replyTo: "hello@green.test" };

  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("names the consultant brand, the snapshot and period, and links to the read-only /shared/ page", async () => {
    const sent = await sendSnapshotShareEmail("client@acme.com", "Acme Corp", "FY26 base", "FY2026", "2026-11-01", "tok_share_1", brand);
    expect(sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.from).toContain("Green Advisors");
    expect(body.to).toEqual(["client@acme.com"]);
    expect(body.subject).toContain("Green Advisors");
    expect(body.subject).toContain("Acme Corp");
    expect(body.html).toContain("FY26 base");
    expect(body.html).toContain("FY2026");
    expect(body.html).toContain("2026-11-01");
    expect(body.html).toContain("/shared/tok_share_1");
    expect(body.html).toContain("view only");
    expect(body.html).not.toContain("Sendrow team");
    // house style: no dashes of any kind in the copy
    expect(body.html).not.toMatch(/[—–]/);
    expect(body.subject).not.toMatch(/[—–]/);
  });

  it("escapes the consultant's snapshot label before it goes into HTML", async () => {
    await sendSnapshotShareEmail("client@acme.com", "Acme", "<b>x</b>", null, "2026-11-01", "tok_e", null);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.html).not.toContain("<b>x</b>");
    expect(body.html).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  it("returns false when the send fails, so the caller can record it", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 422, text: async () => "bad" });
    const sent = await sendSnapshotShareEmail("client@acme.com", "Acme", "FY26", null, "2026-11-01", "tok_f", brand);
    expect(sent).toBe(false);
  });
});
