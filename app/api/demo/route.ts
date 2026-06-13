import { NextResponse } from "next/server";
import { uid, getCompany, saveCompany, createUserCompany, getUserCompany } from "@/lib/store";
import { egridForState } from "@/lib/factors";
import { generateQBTransactions, generateUtilityData } from "@/lib/mockdata";
import { recalcCompany } from "@/lib/calc";
import { refreshSectionStatus } from "@/lib/progress";
import { appendAudit } from "@/lib/store";
import { Company } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  const secret = process.env.DEMO_SECRET;
  if (secret) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("key") !== secret) return new Response("Not Found", { status: 404 });
  } else if (process.env.NODE_ENV === "production") {
    return new Response("Not Found", { status: 404 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/login", request.url));

  // Check if user already has a company linked
  let userRecord = await getUserCompany(userId);
  if (userRecord) {
    // Already set up — just redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const DEMO_COMPANY_ID = `co_demo_${userId.slice(0, 8)}`;

  const company: Company = {
    id: DEMO_COMPANY_ID,
    name: "Pacific Coast Logistics",
    industry: "Logistics",
    headcountRange: "150_350",
    locations: [
      { id: uid("loc_"), address: "2200 Harbor Blvd", city: "Long Beach", state: "CA", zip: "90810", egridSubregion: egridForState("CA") },
      { id: uid("loc_"), address: "880 Riverside Pkwy", city: "West Sacramento", state: "CA", zip: "95605", egridSubregion: egridForState("CA") },
    ],
    fiscalYearEndMonth: 12,
    setupComplete: true,
    createdAt: new Date().toISOString(),
    connections: {
      quickbooks: { connected: true, lastSynced: new Date().toISOString() },
      utility: { connected: true, lastSynced: new Date().toISOString() },
    },
    qbTransactions: [],
    utilityData: [],
    inputs: {
      fleet_gasoline_gal: 6200, fleet_diesel_gal: 48500, fleet_propane_gal: null,
      refrigerant_type: "R-410A", refrigerant_kg: 14,
      equipment_fuel_type: "Diesel", equipment_gal: 3100,
      scope2_reviewed: true, has_recs: true, rec_coverage_pct: 35,
      rec_certificate_name: "2025 Green-e REC certificate",
      qb_data_reviewed: true, commute_avg_miles: 24, commute_mode: "Drive alone", commute_days_in_office: 4,
      waste_landfill_tons: 86, waste_recycled_tons: 41, waste_composted_tons: 12,
      scope3_other_categories: { "Capital goods": "industry_average", "Fuel- and energy-related activities": "industry_average", "Downstream transportation": "na", "Use of sold products": "na", "End-of-life treatment of sold products": "na", "Leased assets": "na" },
      social_total_employees: 240, social_new_hires: 38, social_departures: 29,
      social_lost_time_injuries: 2, social_osha_recordables: 5, social_near_misses: 14,
      social_days_lost: 22, social_training_hours: 2900, social_demographics_uploaded: true,
      gov_leadership: { "C-Suite": { womenPct: 25, minorityPct: 25 }, "VP/Director": { womenPct: 33, minorityPct: 30 }, "Manager": { womenPct: 41, minorityPct: 38 }, "Individual Contributor": { womenPct: 36, minorityPct: 52 } },
      gov_policies: { "Code of conduct": true, "Whistleblower policy": false, "Anti-bribery policy": false, "Data privacy policy": true, "Environmental policy": false, "Equal opportunity policy": true },
      gov_ccpa_compliant: true, gov_public_privacy_policy: true, gov_data_breaches: false,
    },
    calcs: [],
    sectionStatus: { connections: "not_started", scope1: "not_started", scope2: "not_started", scope3: "not_started", social: "not_started", governance: "not_started", reports: "not_started" },
    reportGeneratedAt: null,
    actionPlan: null,
  };

  company.qbTransactions = generateQBTransactions(company);
  company.utilityData = generateUtilityData(company);
  recalcCompany(company);
  refreshSectionStatus(company);
  company.reportGeneratedAt = new Date().toISOString();
  refreshSectionStatus(company);

  await saveCompany(company);
  await createUserCompany(userId, company.id, "Demo User", "demo@example.com");
  await appendAudit({
    id: uid("aud_"), ts: new Date().toISOString(), companyId: company.id,
    userId, userName: "Demo User", section: "setup", field: "demo_seed",
    prev: "—", next: "Demo company seeded with Pacific Coast Logistics data",
  });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
