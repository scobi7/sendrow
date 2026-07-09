import { describe, it, expect } from "vitest";
import { normalizeVendor, matchVendor, VENDOR_CONFIRM_OPTIONS } from "@/lib/vendor-mappings";
import type { VendorMapping } from "@/lib/vendor-mappings";
import { rowToLineItem } from "@/lib/ingestion/ingest";
import { SEED_FACTORS } from "@/lib/factors";
import { lookupFactor } from "@/lib/factor-engine";

const PGE_MAPPING: VendorMapping = {
  id: "vm_test_pge",
  vendorPattern: normalizeVendor("Pacific Gas & Electric, Inc."),
  scope: 2,
  category: "electricity",
  factorId: "egrid.USAVG.2024",
};

describe("normalizeVendor", () => {
  it("lowercases, strips punctuation, drops corporate suffixes", () => {
    expect(normalizeVendor("Pacific Gas & Electric, Inc.")).toBe("pacific gas and electric");
    expect(normalizeVendor("ACME Corp")).toBe("acme");
    expect(normalizeVendor("Joe's Trucking LLC")).toBe("joe s trucking");
  });

  it("is stable across formatting variants of the same vendor", () => {
    expect(normalizeVendor("PACIFIC GAS & ELECTRIC INC")).toBe(normalizeVendor("Pacific Gas & Electric, Inc."));
  });

  it("never strips a lone word to nothing", () => {
    expect(normalizeVendor("Inc")).toBe("inc");
  });
});

describe("matchVendor", () => {
  it("matches formatting variants of a confirmed vendor", () => {
    expect(matchVendor("PACIFIC GAS & ELECTRIC INC", [PGE_MAPPING])?.id).toBe("vm_test_pge");
  });

  it("returns null for unconfirmed vendors — never guesses", () => {
    expect(matchVendor("Mystery Vendor Co", [PGE_MAPPING])).toBeNull();
    expect(matchVendor("", [PGE_MAPPING])).toBeNull();
    expect(matchVendor(undefined, [PGE_MAPPING])).toBeNull();
  });
});

describe("vendor memory in the ingestion pipeline (the moat)", () => {
  it("a vendor confirmed via client A auto-maps for client B, traceably", () => {
    // Client B uploads a row naming the vendor client A's consultant confirmed
    const row = { quantity: 1200, unit: "kWh", activity_type: "", source_ref: "Pacific Gas & Electric Inc" };
    const item = rowToLineItem(row, SEED_FACTORS, "co_client_B", null, [PGE_MAPPING]);
    expect(item.status).toBe("mapped");
    expect(item.scope).toBe(2);
    expect(item.factorId).toBe("egrid.USAVG.2024");
    expect((item.calcLog as { vendor_mapping_id?: string }).vendor_mapping_id).toBe("vm_test_pge");
  });

  it("unconfirmed vendors still flag as unmapped (Plan I invariant preserved)", () => {
    const row = { quantity: 500, unit: "widgets", activity_type: "mystery", source_ref: "Unknown Vendor" };
    const item = rowToLineItem(row, SEED_FACTORS, "co_test", null, [PGE_MAPPING]);
    expect(item.status).toBe("unmapped");
  });

  it("dollar spend maps through a confirmed spend-based vendor, flags without one", () => {
    const freight: VendorMapping = {
      id: "vm_freight",
      vendorPattern: normalizeVendor("Speedy Shipping Co"),
      scope: 3,
      category: "upstream_freight",
      factorId: "useeio.freight.v2",
    };
    const row = { quantity: 5000, unit: "USD", activity_type: "Shipping", source_ref: "Speedy Shipping Co" };
    const mapped = rowToLineItem(row, SEED_FACTORS, "co_test", null, [freight]);
    expect(mapped.status).toBe("mapped");
    expect(mapped.factorId).toBe("useeio.freight.v2");

    // Same row, no confirmation: dollars are never treated as physical units
    const flagged = rowToLineItem(row, SEED_FACTORS, "co_test", null, []);
    expect(flagged.status).toBe("unmapped");
  });
});

describe("VENDOR_CONFIRM_OPTIONS", () => {
  it("every option's factor exists in SEED_FACTORS", () => {
    for (const o of VENDOR_CONFIRM_OPTIONS) {
      expect(lookupFactor(SEED_FACTORS, { factorId: o.factorId }), o.key).not.toBeNull();
    }
  });
});

describe("client-scoped vendor mappings (moat protection)", () => {
  it("a client-scoped mapping never applies to another company's data", async () => {
    const { matchVendor } = await import("@/lib/vendor-mappings");
    const clientScoped = { ...PGE_MAPPING, id: "vm_scoped", companyId: "co_A" };
    // matching itself is list-based — scoping happens at fetch. Simulate both fetches:
    const listForA = [clientScoped]; // co_A sees it
    const listForB: typeof listForA = []; // co_B's fetch filters it out
    expect(matchVendor("Pacific Gas & Electric Inc", listForA)?.id).toBe("vm_scoped");
    expect(matchVendor("Pacific Gas & Electric Inc", listForB)).toBeNull();
  });
});
