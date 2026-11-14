import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendChangesRequestedEmail } from "@/lib/email";
import { resolveFactorSource } from "@/app/consultant/clients/[id]/ledger/factor-source";
import { SEED_FACTORS } from "@/lib/factors";

describe("changes-requested email (Request changes and single flag)", () => {
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

  it("sends one email with the note, the brand as sender and the /portal/ link", async () => {
    const ok = await sendChangesRequestedEmail(
      "client@acme.com",
      "Jane Doe",
      "Acme Corp",
      [
        { filename: "march-bills.csv", note: "March looks like a partial month. Re-upload the full bill." },
        { filename: "fleet.xlsx", note: "Missing the diesel column." },
      ],
      "tok_changes",
      { brandName: "Green Advisory", replyTo: "team@green.example" }
    );
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.from).toBe(`Green Advisory <${process.env.FROM_EMAIL ?? "hello@sendrow.app"}>`);
    expect(body.reply_to).toBe("team@green.example");
    expect(body.to).toEqual(["client@acme.com"]);
    expect(body.subject).toBe("Changes requested for Acme Corp data");
    expect(body.html).toContain("Hi Jane,");
    expect(body.html).toContain("March looks like a partial month. Re-upload the full bill.");
    expect(body.html).toContain("Missing the diesel column.");
    expect(body.html).toContain("march-bills.csv");
    expect(body.html).toContain("fleet.xlsx");
    expect(body.html).toContain("/portal/tok_changes");
    expect(body.html).toContain("Green Advisory");
    expect(body.html).not.toContain("Sendrow team");
  });

  it("escapes the upload filename and note before they go into HTML", async () => {
    await sendChangesRequestedEmail(
      "client@acme.com",
      "Jane",
      "Acme",
      [{ filename: "<img src=x>.csv", note: "<script>x</script>" }],
      "tok_esc",
      null
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.html).not.toContain("<img src=x>");
    expect(body.html).toContain("&lt;img src=x&gt;.csv");
    expect(body.html).toContain("&lt;script&gt;x&lt;/script&gt;");
  });

  it("returns false and sends nothing when RESEND_API_KEY is not set", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const ok = await sendChangesRequestedEmail("client@acme.com", "Jane", "Acme", [{ filename: "a.csv", note: "n" }], "tok", null);
    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("ledger factor source fallback", () => {
  const seed = SEED_FACTORS.find((f) => f.factor_id === "fuel.diesel.2025")!;

  it("prefers the stored factor row when one exists", () => {
    const stored = { source: "Stored source", sourceUrl: "https://stored.example" };
    expect(resolveFactorSource("fuel.diesel.2025", stored)).toEqual(stored);
  });

  it("falls back to the seed factor when the factor table has no row for the id", () => {
    expect(resolveFactorSource("fuel.diesel.2025", undefined)).toEqual({
      source: seed.source,
      sourceUrl: seed.source_url,
    });
  });

  it("returns null when the id is not in either place", () => {
    expect(resolveFactorSource("no.such.factor", undefined)).toBeNull();
  });
});
