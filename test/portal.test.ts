import { describe, it, expect } from "vitest";
import { buildChecklist, checklistComplete, portalTokenValid, generatePortalToken, portalExpiry } from "@/lib/portal";

describe("portal checklist", () => {
  it("builds one item per requested data type with client-facing instructions", () => {
    const items = buildChecklist(["utility_bills", "vendor_invoices"], "ignored");
    expect(items).toHaveLength(2);
    expect(items[0].dataType).toBe("utility_bills");
    expect(items[0].status).toBe("pending");
    expect(items[0].instructions.length).toBeGreaterThan(10);
  });

  it("falls back to a single custom item from the description", () => {
    const items = buildChecklist([], "Send us your Q3 fuel card export");
    expect(items).toHaveLength(1);
    expect(items[0].label).toBe("Send us your Q3 fuel card export");
    expect(items[0].dataType).toBe("custom");
  });

  it("checklistComplete only when every item is received", () => {
    const items = buildChecklist(["utility_bills", "vendor_invoices"], "");
    expect(checklistComplete(items)).toBe(false);
    items[0].status = "received";
    expect(checklistComplete(items)).toBe(false);
    items[1].status = "received";
    expect(checklistComplete(items)).toBe(true);
    expect(checklistComplete([])).toBe(false);
  });
});

describe("portal token", () => {
  it("generates unique url-safe tokens", () => {
    const a = generatePortalToken();
    const b = generatePortalToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });

  it("valid within 30 days, invalid after expiry or cancellation or without a token", () => {
    const future = portalExpiry();
    expect(portalTokenValid({ token: "t", expiresAt: future, status: "open" })).toBe(true);
    expect(portalTokenValid({ token: "t", expiresAt: "2020-01-01T00:00:00Z", status: "open" })).toBe(false);
    expect(portalTokenValid({ token: "t", expiresAt: future, status: "cancelled" })).toBe(false);
    expect(portalTokenValid({ token: null, expiresAt: future, status: "open" })).toBe(false);
  });
});
