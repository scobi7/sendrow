import { describe, it, expect } from "vitest";
import { headerFingerprint } from "@/lib/ingestion/fingerprint";
import { parsePastedRows } from "@/lib/portal-paste";

describe("header fingerprint (format memory, Plan T2)", () => {
  it("ignores order, casing, and separator style", () => {
    const a = headerFingerprint(["Bill Date", "Usage (kWh)", "Account_Number"]);
    const b = headerFingerprint(["account number", "USAGE (KWH)", "bill-date"]);
    expect(a).toBe(b);
  });

  it("different column sets fingerprint differently", () => {
    expect(headerFingerprint(["date", "kwh"])).not.toBe(headerFingerprint(["date", "kwh", "cost"]));
  });
});

describe("paste-from-spreadsheet (Plan T2)", () => {
  it("parses TSV rows: date, description, quantity", () => {
    const rows = parsePastedRows("2026-01\tPG&E electric\t1,240\n2026-02\tPG&E electric\t1180");
    expect(rows).toEqual([
      { date: "2026-01", kindText: "PG&E electric", quantity: "1240" },
      { date: "2026-02", kindText: "PG&E electric", quantity: "1180" },
    ]);
  });

  it("parses CSV and handles US dates and $ amounts", () => {
    const rows = parsePastedRows("1/15/2026,diesel,$523.40");
    expect(rows[0].date).toBe("2026-01");
    expect(rows[0].quantity).toBe("523.40");
  });

  it("skips rows without any number and blank lines", () => {
    const rows = parsePastedRows("header line here\n\n2026-03\tgas\t42");
    expect(rows).toHaveLength(1);
    expect(rows[0].quantity).toBe("42");
  });

  it("handles named months", () => {
    expect(parsePastedRows("Jan 2026\telectric\t900")[0].date).toBe("2026-01");
  });
});
