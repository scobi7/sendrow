/** Demo workspace (#49): three clients at three stages, restorable to clean
 *  state before every demo. Run: `npx tsx scripts/reset-demo.ts [consultantClerkId]`
 *  Seeds into the given consultant's workspace (defaults to DEMO_CONSULTANT_ID
 *  env, else the first consultant found). Demo rows all carry the demo_ prefix
 *  so reset never touches real data. */
// Load env for DATABASE_URL when run outside Next
import { readFileSync } from "fs";
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
} catch { /* env already set */ }

import { eq, inArray, like } from "drizzle-orm";

async function main() {
  const { db } = await import("../lib/db");
  const schema = await import("../lib/db/schema");
  const { generatePortalToken, portalExpiry, buildChecklist } = await import("../lib/portal");
  const { snapshotHash } = await import("../lib/snapshots");

  const consultantId =
    process.argv[2] ??
    process.env.DEMO_CONSULTANT_ID ??
    (await db.query.userCompanies.findFirst({ where: eq(schema.userCompanies.role, "consultant") }))?.clerkId;
  if (!consultantId) throw new Error("No consultant found — pass a Clerk ID or set DEMO_CONSULTANT_ID");

  const now = new Date().toISOString();
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

  // ── Wipe previous demo data (demo_ prefix only — real data untouched)
  const demoIds = ["demo_ggcr", "demo_bayb", "demo_pcl"];
  for (const table of [
    schema.events, schema.comments, schema.shareLinks, schema.snapshots, schema.emissionLineItems,
    schema.intakeSessions, schema.mappingProfiles, schema.dataRequests, schema.evidence,
    schema.pipelineStatus, schema.consultantClients, schema.calcs, schema.locations,
    schema.companyInputs, schema.scope3Screening,
  ] as const) {
    // every demo table row references companyId
    const t = table as unknown as { companyId: Parameters<typeof inArray>[0] };
    await db.delete(table as never).where(inArray(t.companyId, demoIds));
  }
  await db.delete(schema.companies).where(inArray(schema.companies.id, demoIds));
  await db.delete(schema.vendorMappings).where(like(schema.vendorMappings.id, "demo_%"));

  const sectionStatus = {
    connections: "not_started", scope1: "not_started", scope2: "not_started", scope3: "not_started",
    social: "not_started", governance: "not_started", reports: "not_started",
  };

  // ── Client 1: Golden Gate Coffee Roasters — just requested
  await db.insert(schema.companies).values({
    id: "demo_ggcr", name: "Golden Gate Coffee Roasters", industry: "Food and Beverage",
    naicsCode: "31-33", headcountRange: "50_150", clientContactName: "Dana Ito",
    clientContactEmail: "dana@example.com", createdAt: daysAgo(2), setupComplete: false, sectionStatus,
  });
  await db.insert(schema.dataRequests).values({
    id: "dr_demo_ggcr_1", companyId: "demo_ggcr", requestedBy: consultantId,
    description: "FY2025 footprint sprint — utilities and fleet fuel",
    status: "open", dueDate: new Date(Date.now() + 12 * 86_400_000).toISOString().slice(0, 10),
    periodLabel: "Calendar year 2025", createdAt: daysAgo(1), token: generatePortalToken(),
    expiresAt: portalExpiry(), checklist: buildChecklist(["utility_bills", "fleet_fuel_dollar"], ""),
    remindersSentAt: {}, remindersEnabled: true,
  });

  // ── Client 2: Bayshore Bottling — mid-response, one item stuck
  await db.insert(schema.companies).values({
    id: "demo_bayb", name: "Bayshore Bottling Co.", industry: "Food and Beverage",
    naicsCode: "31-33", headcountRange: "150_350", clientContactName: "Marcus Webb",
    clientContactEmail: "marcus@example.com", createdAt: daysAgo(14), setupComplete: false, sectionStatus,
  });
  const baybChecklist = buildChecklist(["utility_bills", "vendor_invoices"], "").map((item, i) =>
    i === 0
      ? { ...item, status: "received" as const }
      : { ...item, stuckNote: "Our invoices only show totals per vendor, not categories — what do you need exactly?" }
  );
  await db.insert(schema.dataRequests).values({
    id: "dr_demo_bayb_1", companyId: "demo_bayb", requestedBy: consultantId,
    description: "FY2025 Scope 1–2 + spend-based Scope 3 screen",
    status: "open", dueDate: new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10),
    periodLabel: "Calendar year 2025", createdAt: daysAgo(10), token: generatePortalToken(),
    expiresAt: portalExpiry(), checklist: baybChecklist, remindersSentAt: { "due-7": daysAgo(2) }, remindersEnabled: true,
  });
  await db.insert(schema.mappingProfiles).values({
    id: "mp_demo_bayb_1", companyId: "demo_bayb", name: "Portal — Utility bills (pge-2025.csv)",
    columnMap: { Month: "date", "Usage (kWh)": "quantity", Vendor: "source_ref" }, effectiveFrom: daysAgo(6).slice(0, 10), createdAt: daysAgo(6),
  });
  await db.insert(schema.intakeSessions).values({
    id: "is_demo_bayb_1", companyId: "demo_bayb", uploadedBy: "portal:dr_demo_bayb_1",
    filename: "pge-2025.csv", dataType: "utility_bills", sessionScore: "1", status: "auto_approved",
    rowCount: 12, mappingProfileId: "mp_demo_bayb_1", createdAt: daysAgo(6),
  });
  const kwh = [4180, 3920, 4010, 3760, 3590, 3810, 4450, 4620, 4210, 3980, 4100, 4340];
  await db.insert(schema.emissionLineItems).values(
    kwh.map((v, i) => ({
      id: `li_demo_bayb_${i}`, companyId: "demo_bayb", sourceRef: "PG&E acct 88231",
      scope: 2, category: "electricity", rawValue: String(v), rawUnit: "kWh",
      co2eKg: (v * 0.386).toFixed(4), confidence: "actual", status: "mapped" as const,
      period: "2025", activityDate: `2025-${String(i + 1).padStart(2, "0")}`,
      factorId: "egrid.USAVG.2024",
      calcLog: { factor_id: "egrid.USAVG.2024", formula: `${v} kWh × 0.000386 tCO2e/kWh × 1000 kg/t`, submitted_via: "portal:dr_demo_bayb_1" },
      mappingProfileId: "mp_demo_bayb_1", createdAt: daysAgo(6),
    }))
  );
  await db.insert(schema.pipelineStatus).values({ companyId: "demo_bayb", status: "in_progress", updatedAt: daysAgo(6) });
  await db.insert(schema.comments).values({
    id: "cm_demo_bayb_1", companyId: "demo_bayb", lineItemId: "li_demo_bayb_6",
    author: consultantId, authorType: "consultant",
    body: "July spiked 17% vs June — new equipment or a data issue?", createdAt: daysAgo(4),
  });

  // ── Client 3: Pacific Coast Logistics — approved, snapshot frozen & shared
  await db.insert(schema.companies).values({
    id: "demo_pcl", name: "Pacific Coast Logistics", industry: "Logistics",
    naicsCode: "48-49", headcountRange: "150_350", clientContactName: "Rosa Delgado",
    clientContactEmail: "rosa@example.com", createdAt: daysAgo(45), setupComplete: false, sectionStatus,
  });
  await db.insert(schema.dataRequests).values({
    id: "dr_demo_pcl_1", companyId: "demo_pcl", requestedBy: consultantId,
    description: "FY2025 full footprint — utilities + fleet",
    status: "fulfilled", fulfilledAt: daysAgo(20), periodLabel: "Calendar year 2025",
    createdAt: daysAgo(40), token: generatePortalToken(), expiresAt: portalExpiry(),
    checklist: buildChecklist(["utility_bills", "fleet_fuel_dollar"], "").map((i) => ({ ...i, status: "received" as const })),
    remindersSentAt: {}, remindersEnabled: true,
  });
  const pclItems = [
    ...[3200, 3350, 3100, 2980].map((v, i) => ({
      id: `li_demo_pcl_e${i}`, companyId: "demo_pcl", sourceRef: "SCE acct 4471", scope: 2,
      category: "electricity", rawValue: String(v), rawUnit: "kWh", co2eKg: (v * 0.386).toFixed(4),
      confidence: "actual", status: "mapped" as const, period: "2025", activityDate: `2025-0${i + 1}`,
      factorId: "egrid.USAVG.2024",
      calcLog: { factor_id: "egrid.USAVG.2024", formula: `${v} kWh × 0.000386 tCO2e/kWh × 1000 kg/t` },
      mappingProfileId: null, createdAt: daysAgo(25),
    })),
    ...[820, 760, 905, 840].map((v, i) => ({
      id: `li_demo_pcl_d${i}`, companyId: "demo_pcl", sourceRef: `TRK-0${i + 1}`, scope: 1,
      category: "mobile_combustion", rawValue: String(v), rawUnit: "gallon", co2eKg: (v * 10.21).toFixed(4),
      confidence: "actual", status: "mapped" as const, period: "2025", activityDate: `2025-0${i + 1}`,
      factorId: "fuel.diesel.2025",
      calcLog: { factor_id: "fuel.diesel.2025", formula: `${v} gal × 0.01021 tCO2e/gal × 1000 kg/t` },
      mappingProfileId: null, createdAt: daysAgo(25),
    })),
  ];
  await db.insert(schema.emissionLineItems).values(pclItems);
  await db.insert(schema.pipelineStatus).values({ companyId: "demo_pcl", status: "locked", updatedAt: daysAgo(20) });

  const pclTotals = {
    scope1: pclItems.filter((i) => i.scope === 1).reduce((s, i) => s + Number(i.co2eKg), 0) / 1000,
    scope2Location: pclItems.filter((i) => i.scope === 2).reduce((s, i) => s + Number(i.co2eKg), 0) / 1000,
    scope2Market: pclItems.filter((i) => i.scope === 2).reduce((s, i) => s + Number(i.co2eKg), 0) / 1000,
    scope3: 0,
    total: pclItems.reduce((s, i) => s + Number(i.co2eKg), 0) / 1000,
  };
  const frozen = pclItems.map((i) => ({
    sourceRef: i.sourceRef, scope: i.scope, category: i.category, rawValue: i.rawValue,
    rawUnit: i.rawUnit, co2eKg: i.co2eKg, period: i.period, factorId: i.factorId, calcLog: i.calcLog,
  }));
  await db.insert(schema.snapshots).values({
    id: "snap_demo_pcl_1", companyId: "demo_pcl", label: "FY2025 footprint v1", period: "2025",
    totals: pclTotals, lineItems: frozen, itemCount: frozen.length,
    sha256: snapshotHash(pclTotals, frozen), createdBy: consultantId, createdAt: daysAgo(20),
  });
  await db.insert(schema.shareLinks).values({
    token: generatePortalToken(), companyId: "demo_pcl", snapshotId: "snap_demo_pcl_1",
    recipientLabel: "Whole Foods (buyer)", recipientEmail: null, createdBy: consultantId, createdAt: daysAgo(18),
  });

  // ── Link all three to the consultant
  await db.insert(schema.consultantClients).values(
    demoIds.map((companyId, i) => ({
      id: `cc_demo_${i}`, consultantId, companyId, addedAt: daysAgo(45 - i * 15), archivedAt: null,
    }))
  );

  console.log(`✓ Demo workspace reset for consultant ${consultantId}`);
  console.log("  1. Golden Gate Coffee Roasters — request just sent (open portal link from the workspace)");
  console.log("  2. Bayshore Bottling Co. — mid-response: 12 rows in, one checklist item stuck, one comment");
  console.log("  3. Pacific Coast Logistics — approved: locked pipeline, frozen snapshot, shared with a buyer");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
