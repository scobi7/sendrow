import { describe, it, expect } from "vitest";
import { readJsonBody, suggestMapping } from "@/lib/portal-api";

describe("readJsonBody", () => {
  it("returns the parsed object for a valid JSON body", async () => {
    const req = new Request("http://localhost/api/portal/stuck", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "abc", itemId: "item_1" }),
    });
    expect(await readJsonBody(req)).toEqual({ token: "abc", itemId: "item_1" });
  });

  it("returns null for a malformed body instead of throwing", async () => {
    const req = new Request("http://localhost/api/portal/stuck", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    expect(await readJsonBody(req)).toBeNull();
  });
});

describe("suggestMapping", () => {
  it("maps a realistic utility-bill export: template first, fuzzy match for the rest", () => {
    const headers = ["Month", "Account Number", "kWh Used", "Meter Read Type", "Units", "Vendor"];
    expect(suggestMapping(headers, "utility_bills")).toEqual({
      Month: "date",
      "Account Number": "source_ref",
      "kWh Used": "quantity",
      "Meter Read Type": "confidence",
      Units: "unit",
      Vendor: null,
    });
  });
});
