import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  companies,
  companyInputs,
  companyConnections,
  locations,
  qbTransactions,
  utilityData,
  calcs,
  emissionFactors,
} from "./db/schema";
import { Company, EmissionFactor, Industry, HeadcountRange, Inputs } from "./types";
import { SEED_FACTORS } from "./factors";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function getFactor(factorId: string): EmissionFactor {
  const f = SEED_FACTORS.find((f) => f.factor_id === factorId);
  if (!f) throw new Error(`Unknown emission factor: ${factorId}`);
  return f;
}

export async function loadFactors(): Promise<EmissionFactor[]> {
  try {
    const rows = await db.select().from(emissionFactors);
    return rows.map((r) => ({
      factor_id: r.factorId,
      factor_name: r.factorName,
      category: r.category,
      value: Number(r.value),
      unit: r.unit,
      source: r.source,
      source_url: r.sourceUrl,
      year_effective: r.yearEffective,
      year_retired: r.yearRetired ?? null,
    }));
  } catch {
    return [];
  }
}

export const loadCompany = cache(async (companyId: string): Promise<Company> => {
  const [companyRows, inputRows, connRows, locRows, txnRows, utilRows, calcRows] =
    await Promise.all([
      db.select().from(companies).where(eq(companies.id, companyId)),
      db.select().from(companyInputs).where(eq(companyInputs.companyId, companyId)),
      db.select().from(companyConnections).where(eq(companyConnections.companyId, companyId)),
      db.select().from(locations).where(eq(locations.companyId, companyId)),
      db.select().from(qbTransactions).where(eq(qbTransactions.companyId, companyId)),
      db.select().from(utilityData).where(eq(utilityData.companyId, companyId)),
      db.select().from(calcs).where(eq(calcs.companyId, companyId)),
    ]);

  const c = companyRows[0];
  if (!c) throw new Error(`Company not found: ${companyId}`);
  const conn = connRows[0];

  return {
    id: c.id,
    name: c.name,
    industry: c.industry as Industry,
    headcountRange: c.headcountRange as HeadcountRange,
    fiscalYearEndMonth: c.fiscalYearEndMonth ?? 12,
    setupComplete: c.setupComplete,
    createdAt: c.createdAt,
    sectionStatus: (c.sectionStatus ?? {
      connections: "not_started",
      scope1: "not_started",
      scope2: "not_started",
      scope3: "not_started",
      social: "not_started",
      governance: "not_started",
      reports: "not_started",
    }) as Company["sectionStatus"],
    reportGeneratedAt: c.reportGeneratedAt ?? null,
    actionPlan: (c.actionPlan as string[] | null) ?? null,
    inputs: ((inputRows[0]?.data ?? {}) as Inputs),
    connections: {
      quickbooks: {
        connected: conn?.qbConnected ?? false,
        lastSynced: conn?.qbLastSynced ?? null,
        accessToken: conn?.qbAccessToken ?? null,
        refreshToken: conn?.qbRefreshToken ?? null,
        tokenExpiresAt: conn?.qbTokenExpiresAt ?? null,
        realmId: conn?.qbRealmId ?? null,
      },
      utility: {
        connected: conn?.utilityConnected ?? false,
        lastSynced: conn?.utilityLastSynced ?? null,
        authUid: conn?.utilityAuthUid ?? null,
        authEmail: conn?.utilityAuthEmail ?? null,
      },
    },
    locations: locRows.map((l) => ({
      id: l.id,
      address: l.address,
      city: l.city,
      state: l.state,
      zip: l.zip,
      egridSubregion: l.egridSubregion,
    })),
    qbTransactions: txnRows.map((t) => ({
      id: t.id,
      vendor: t.vendor,
      category: t.category,
      amount: Number(t.amount),
      date: t.date,
    })),
    utilityData: utilRows.map((u) => ({
      id: String(u.id),
      locationId: u.locationId,
      month: u.month,
      kwh: Number(u.kwh),
      therms: Number(u.therms),
    })),
    calcs: calcRows.map((c) => ({
      id: c.id,
      scope: c.scope as 1 | 2 | 3,
      category: c.category,
      co2eTons: Number(c.co2eTons),
      factorId: c.factorId ?? null,
      formula: c.formula,
      basis: c.basis as "measured" | "spend_based" | "estimated",
      marketBasedTons: c.marketBasedTons != null ? Number(c.marketBasedTons) : undefined,
    })),
  };
});

export async function persistCompany(company: Company): Promise<void> {
  const id = company.id;

  await Promise.all([
    db
      .update(companies)
      .set({
        name: company.name,
        industry: company.industry ?? null,
        headcountRange: company.headcountRange ?? null,
        fiscalYearEndMonth: company.fiscalYearEndMonth,
        setupComplete: company.setupComplete,
        sectionStatus: company.sectionStatus,
        reportGeneratedAt: company.reportGeneratedAt ?? null,
        actionPlan: company.actionPlan ?? null,
      })
      .where(eq(companies.id, id)),

    db
      .insert(companyInputs)
      .values({ companyId: id, data: company.inputs as Record<string, unknown> })
      .onConflictDoUpdate({
        target: companyInputs.companyId,
        set: { data: company.inputs as Record<string, unknown> },
      }),

    db
      .insert(companyConnections)
      .values({
        companyId: id,
        qbConnected: company.connections.quickbooks.connected,
        qbLastSynced: company.connections.quickbooks.lastSynced ?? null,
        utilityConnected: company.connections.utility.connected,
        utilityLastSynced: company.connections.utility.lastSynced ?? null,
      })
      .onConflictDoUpdate({
        target: companyConnections.companyId,
        set: {
          qbConnected: company.connections.quickbooks.connected,
          qbLastSynced: company.connections.quickbooks.lastSynced ?? null,
          utilityConnected: company.connections.utility.connected,
          utilityLastSynced: company.connections.utility.lastSynced ?? null,
          utilityAuthUid: company.connections.utility.authUid ?? null,
          utilityAuthEmail: company.connections.utility.authEmail ?? null,
          qbAccessToken: company.connections.quickbooks.accessToken ?? null,
          qbRefreshToken: company.connections.quickbooks.refreshToken ?? null,
          qbRealmId: company.connections.quickbooks.realmId ?? null,
          qbTokenExpiresAt: company.connections.quickbooks.tokenExpiresAt ?? null,
        },
      }),
  ]);

  // Replace calcs — recalculated every persist
  await db.delete(calcs).where(eq(calcs.companyId, id));
  if (company.calcs.length > 0) {
    await db.insert(calcs).values(
      company.calcs.map((c) => ({
        id: c.id,
        companyId: id,
        scope: c.scope,
        category: c.category,
        co2eTons: String(c.co2eTons),
        factorId: c.factorId ?? null,
        formula: c.formula,
        basis: c.basis,
        marketBasedTons: c.marketBasedTons != null ? String(c.marketBasedTons) : null,
      }))
    );
  }
}

export async function saveLocations(
  companyId: string,
  locs: Company["locations"]
): Promise<void> {
  await db.delete(locations).where(eq(locations.companyId, companyId));
  if (locs.length > 0) {
    await db.insert(locations).values(locs.map((l) => ({ ...l, companyId })));
  }
}

export async function saveQBTransactions(
  companyId: string,
  txns: Company["qbTransactions"]
): Promise<void> {
  await db.delete(qbTransactions).where(eq(qbTransactions.companyId, companyId));
  if (txns.length > 0) {
    await db.insert(qbTransactions).values(
      txns.map((t) => ({ ...t, companyId, amount: String(t.amount) }))
    );
  }
}

export async function saveUtilityData(
  companyId: string,
  data: Company["utilityData"]
): Promise<void> {
  await db.delete(utilityData).where(eq(utilityData.companyId, companyId));
  if (data.length > 0) {
    await db.insert(utilityData).values(
      data.map((u) => ({
        companyId,
        locationId: u.locationId,
        month: u.month,
        kwh: String(u.kwh),
        therms: String(u.therms),
      }))
    );
  }
}
