import { describe, it, expect } from "vitest";
import { EGRID_SUBREGION_OPTIONS, siteRollups } from "@/lib/locations";

const checklist = (received: number, total: number) => [
  ...Array(received).fill({ status: "received" }),
  ...Array(total - received).fill({ status: "pending" }),
];

describe("EGRID_SUBREGION_OPTIONS", () => {
  it("exposes every seeded electricity_location factor for the dropdown", () => {
    expect(EGRID_SUBREGION_OPTIONS.length).toBeGreaterThanOrEqual(26);
    expect(EGRID_SUBREGION_OPTIONS.some((o) => o.factorId === "egrid.CAMX.2024")).toBe(true);
    expect(EGRID_SUBREGION_OPTIONS.some((o) => o.factorId === "egrid.ERCT.2024")).toBe(true);
  });
});

describe("siteRollups", () => {
  const requests = [
    { id: "r1", locationId: "ca", status: "fulfilled", token: "t1", checklist: checklist(1, 1) },
    { id: "r2", locationId: "tx", status: "open", token: "t2", checklist: checklist(1, 2) },
    { id: "r3", locationId: "wa", status: "open", token: "t3", checklist: checklist(0, 1) },
  ];
  const items = [
    { locationId: "ca", co2eKg: "2090", status: "mapped" },
    { locationId: "tx", co2eKg: "3700", status: "mapped" },
    { locationId: "tx", co2eKg: "999", status: "unmapped" }, // flagged rows never count
    { locationId: null, co2eKg: "500", status: "mapped" },   // company-wide, no site
  ];

  it("derives per-site status: complete / responding / link_sent / no_link", () => {
    const [ca, tx, wa, oh] = siteRollups(["ca", "tx", "wa", "oh"], requests, items);
    expect(ca.status).toBe("complete");
    expect(tx.status).toBe("responding");
    expect(wa.status).toBe("link_sent");
    expect(oh.status).toBe("no_link");
  });

  it("sums only mapped items per site - the aggregate is the sum of sites", () => {
    const rollups = siteRollups(["ca", "tx"], requests, items);
    expect(rollups[0].co2eKg).toBe(2090);
    expect(rollups[1].co2eKg).toBe(3700);
    expect(rollups.reduce((s, r) => s + r.co2eKg, 0)).toBe(5790);
  });

  it("reports checklist completeness and the live token", () => {
    const [tx] = siteRollups(["tx"], requests, items);
    expect(tx.itemsReceived).toBe(1);
    expect(tx.itemsTotal).toBe(2);
    expect(tx.token).toBe("t2");
  });

  it("prefers the open request when a site has several", () => {
    const [ca] = siteRollups(
      ["ca"],
      [
        { id: "old", locationId: "ca", status: "fulfilled", token: "told", checklist: checklist(1, 1) },
        { id: "new", locationId: "ca", status: "open", token: "tnew", checklist: checklist(0, 1) },
      ],
      []
    );
    expect(ca.requestId).toBe("new");
  });
});
