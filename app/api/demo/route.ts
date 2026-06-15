import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, userCompanies } from "@/lib/db/schema";
import { egridForState } from "@/lib/factors";
import { generateQBTransactions, generateUtilityData } from "@/lib/mockdata";
import { recalcCompany } from "@/lib/calc";
import { refreshSectionStatus } from "@/lib/progress";
import { persistCompany, saveLocations, saveQBTransactions, saveUtilityData, uid, loadFactors } from "@/lib/store";
import { Company } from "@/lib/types";

const DEMO_EMAIL = "demo@greentrack.app";
const DEMO_PASSWORD = "GreenTrack2025!";

export async function GET(request: Request) {
  const secret = process.env.DEMO_SECRET;
  const { searchParams } = new URL(request.url);

  if (secret) {
    if (searchParams.get("key") !== secret) return new Response("Not Found", { status: 404 });
  } else if (process.env.NODE_ENV === "production") {
    return new Response("Not Found", { status: 404 });
  }

  const clerk = await clerkClient();

  // Find or create demo Clerk user
  const existing = await clerk.users.getUserList({ emailAddress: [DEMO_EMAIL] });
  let clerkUserId: string;

  if (existing.data.length > 0) {
    clerkUserId = existing.data[0].id;
  } else {
    const newUser = await clerk.users.createUser({
      emailAddress: [DEMO_EMAIL],
      password: DEMO_PASSWORD,
      firstName: "Demo",
      lastName: "User",
      skipPasswordChecks: true,
    });
    clerkUserId = newUser.id;
  }

  // Find or create demo company in DB
  const existingRecord = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.clerkId, clerkUserId),
  });

  let companyId: string;

  if (existingRecord?.companyId) {
    companyId = existingRecord.companyId;
  } else {
    companyId = uid("co_");
    const company: Company = {
      id: companyId,
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
        scope3_other_categories: {
          "Capital goods": "industry_average", "Fuel- and energy-related activities": "industry_average",
          "Downstream transportation": "na", "Use of sold products": "na",
          "End-of-life treatment of sold products": "na", "Leased assets": "na",
        },
        social_total_employees: 240, social_new_hires: 38, social_departures: 29,
        social_lost_time_injuries: 2, social_osha_recordables: 5, social_near_misses: 14,
        social_days_lost: 22, social_training_hours: 2900, social_demographics_uploaded: true,
        gov_leadership: {
          "C-Suite": { womenPct: 25, minorityPct: 25 }, "VP/Director": { womenPct: 33, minorityPct: 30 },
          "Manager": { womenPct: 41, minorityPct: 38 }, "Individual Contributor": { womenPct: 36, minorityPct: 52 },
        },
        gov_policies: {
          "Code of conduct": true, "Whistleblower policy": false, "Anti-bribery policy": false,
          "Data privacy policy": true, "Environmental policy": false, "Equal opportunity policy": true,
        },
        gov_ccpa_compliant: true, gov_public_privacy_policy: true, gov_data_breaches: false,
      },
      calcs: [],
      sectionStatus: { connections: "not_started", scope1: "not_started", scope2: "not_started", scope3: "not_started", social: "not_started", governance: "not_started", reports: "not_started" },
      reportGeneratedAt: null,
      actionPlan: null,
    };

    company.qbTransactions = generateQBTransactions(company);
    company.utilityData = generateUtilityData(company);
    const overrides = await loadFactors();
    recalcCompany(company, overrides);
    refreshSectionStatus(company);
    company.reportGeneratedAt = new Date().toISOString();
    refreshSectionStatus(company);

    await db.insert(companies).values({
      id: company.id, name: company.name, industry: company.industry,
      headcountRange: company.headcountRange, fiscalYearEndMonth: company.fiscalYearEndMonth,
      setupComplete: company.setupComplete, createdAt: company.createdAt,
      sectionStatus: company.sectionStatus, reportGeneratedAt: company.reportGeneratedAt,
    });

    await saveLocations(company.id, company.locations);
    await saveQBTransactions(company.id, company.qbTransactions);
    await saveUtilityData(company.id, company.utilityData);
    await persistCompany(company);

    if (existingRecord) {
      await db.update(userCompanies).set({ companyId }).where(eq(userCompanies.clerkId, clerkUserId));
    } else {
      await db.insert(userCompanies).values({
        clerkId: clerkUserId, companyId, name: "Demo User",
        email: DEMO_EMAIL, role: "company", createdAt: new Date().toISOString(),
      });
    }
  }

  // Generate a sign-in token for the demo user
  const signInToken = await clerk.signInTokens.createSignInToken({
    userId: clerkUserId,
    expiresInSeconds: 120,
  });

  const signInUrl = `${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/login"}#/?ticket=${signInToken.token}`;
  return NextResponse.redirect(new URL(signInUrl, request.url));
}
