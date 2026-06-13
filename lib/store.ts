import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import {
  companies, userCompanies, locations as locTable,
  companyConnections, companyInputs, calcs as calcsTable,
  qbTransactions as qbTable, utilityData as utilTable, auditLog,
} from "./db/schema";
import {
  Company, User, AuditRow, Inputs, SectionName, SectionStatus,
  Industry, HeadcountRange,
} from "./types";
import { SEED_FACTORS } from "./factors";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function getFactor(factorId: string) {
  const f = SEED_FACTORS.find((f) => f.factor_id === factorId);
  if (!f) throw new Error(`Unknown emission factor: ${factorId}`);
  return f;
}

const DEFAULT_SECTION_STATUS: Record<SectionName, SectionStatus> = {
  connections: "not_started", scope1: "not_started", scope2: "not_started",
  scope3: "not_started", social: "not_started", governance: "not_started", reports: "not_started",
};

const DEFAULT_CONNECTIONS = {
  quickbooks: { connected: false, lastSynced: null as string | null },
  utility: { connected: false, lastSynced: null as string | null },
};

// ─── User ↔ Company mapping ───────────────────────────────────────────────────

export async function getUserCompany(clerkId: string): Promise<User | null> {
  const rows = await db.select().from(userCompanies).where(eq(userCompanies.clerkId, clerkId));
  if (!rows[0]) return null;
  return { id: rows[0].clerkId, name: rows[0].name, email: rows[0].email, companyId: rows[0].companyId, createdAt: rows[0].createdAt };
}

export async function createUserCompany(clerkId: string, companyId: string, name: string, email: string): Promise<void> {
  await db.insert(userCompanies).values({ clerkId, companyId, name, email, createdAt: new Date().toISOString() });
}

export async function updateUserCompanyName(clerkId: string, name: string): Promise<void> {
  await db.update(userCompanies).set({ name }).where(eq(userCompanies.clerkId, clerkId));
}

// ─── Company ─────────────────────────────────────────────────────────────────

export async function getCompany(companyId: string): Promise<Company> {
  const [co, locs, conn, inp, txns, util, compCalcs] = await Promise.all([
    db.select().from(companies).where(eq(companies.id, companyId)),
    db.select().from(locTable).where(eq(locTable.companyId, companyId)),
    db.select().from(companyConnections).where(eq(companyConnections.companyId, companyId)),
    db.select().from(companyInputs).where(eq(companyInputs.companyId, companyId)),
    db.select().from(qbTable).where(eq(qbTable.companyId, companyId)),
    db.select().from(utilTable).where(eq(utilTable.companyId, companyId)),
    db.select().from(calcsTable).where(eq(calcsTable.companyId, companyId)),
  ]);

  if (!co[0]) throw new Error(`Company not found: ${companyId}`);
  const c = co[0];

  return {
    id: c.id,
    name: c.name,
    industry: c.industry as Industry | null,
    headcountRange: c.headcountRange as HeadcountRange | null,
    fiscalYearEndMonth: c.fiscalYearEndMonth,
    setupComplete: c.setupComplete,
    createdAt: c.createdAt,
    reportGeneratedAt: c.reportGeneratedAt,
    actionPlan: (c.actionPlan as string[] | null) ?? null,
    sectionStatus: (c.sectionStatus as Record<SectionName, SectionStatus>) ?? DEFAULT_SECTION_STATUS,
    locations: locs.map(l => ({ id: l.id, address: l.address, city: l.city, state: l.state, zip: l.zip, egridSubregion: l.egridSubregion })),
    connections: conn[0]
      ? { quickbooks: { connected: conn[0].qbConnected, lastSynced: conn[0].qbLastSynced }, utility: { connected: conn[0].utilityConnected, lastSynced: conn[0].utilityLastSynced } }
      : DEFAULT_CONNECTIONS,
    inputs: (inp[0]?.data as Inputs) ?? {},
    qbTransactions: txns.map(t => ({ id: t.id, vendor: t.vendor, category: t.category, amount: Number(t.amount), date: t.date })),
    utilityData: util.map(u => ({ locationId: u.locationId, month: u.month, kwh: Number(u.kwh), therms: Number(u.therms) })),
    calcs: compCalcs.map(c => ({
      id: c.id, scope: c.scope as 1 | 2 | 3, category: c.category,
      co2eTons: Number(c.co2eTons), factorId: c.factorId, formula: c.formula,
      basis: c.basis as "measured" | "spend_based" | "estimated",
      marketBasedTons: c.marketBasedTons != null ? Number(c.marketBasedTons) : undefined,
    })),
  };
}

export async function saveCompany(company: Company): Promise<void> {
  await db.insert(companies).values({
    id: company.id, name: company.name, industry: company.industry,
    headcountRange: company.headcountRange, fiscalYearEndMonth: company.fiscalYearEndMonth,
    setupComplete: company.setupComplete, createdAt: company.createdAt,
    reportGeneratedAt: company.reportGeneratedAt, actionPlan: company.actionPlan,
    sectionStatus: company.sectionStatus,
  }).onConflictDoUpdate({ target: companies.id, set: {
    name: company.name, industry: company.industry, headcountRange: company.headcountRange,
    fiscalYearEndMonth: company.fiscalYearEndMonth, setupComplete: company.setupComplete,
    reportGeneratedAt: company.reportGeneratedAt, actionPlan: company.actionPlan,
    sectionStatus: company.sectionStatus,
  }});

  await db.insert(companyConnections).values({
    companyId: company.id,
    qbConnected: company.connections.quickbooks.connected, qbLastSynced: company.connections.quickbooks.lastSynced,
    utilityConnected: company.connections.utility.connected, utilityLastSynced: company.connections.utility.lastSynced,
  }).onConflictDoUpdate({ target: companyConnections.companyId, set: {
    qbConnected: company.connections.quickbooks.connected, qbLastSynced: company.connections.quickbooks.lastSynced,
    utilityConnected: company.connections.utility.connected, utilityLastSynced: company.connections.utility.lastSynced,
  }});

  await db.insert(companyInputs).values({ companyId: company.id, data: company.inputs })
    .onConflictDoUpdate({ target: companyInputs.companyId, set: { data: company.inputs } });

  await db.delete(locTable).where(eq(locTable.companyId, company.id));
  if (company.locations.length > 0) {
    await db.insert(locTable).values(company.locations.map(l => ({
      id: l.id, companyId: company.id, address: l.address, city: l.city, state: l.state, zip: l.zip, egridSubregion: l.egridSubregion,
    })));
  }

  await db.delete(calcsTable).where(eq(calcsTable.companyId, company.id));
  if (company.calcs.length > 0) {
    await db.insert(calcsTable).values(company.calcs.map(c => ({
      id: c.id, companyId: company.id, scope: c.scope, category: c.category,
      co2eTons: String(c.co2eTons), factorId: c.factorId, formula: c.formula, basis: c.basis,
      marketBasedTons: c.marketBasedTons != null ? String(c.marketBasedTons) : null,
    })));
  }

  await db.delete(qbTable).where(eq(qbTable.companyId, company.id));
  if (company.qbTransactions.length > 0) {
    await db.insert(qbTable).values(company.qbTransactions.map(t => ({
      id: t.id, companyId: company.id, vendor: t.vendor, category: t.category, amount: String(t.amount), date: t.date,
    })));
  }

  await db.delete(utilTable).where(eq(utilTable.companyId, company.id));
  if (company.utilityData.length > 0) {
    await db.insert(utilTable).values(company.utilityData.map(u => ({
      companyId: company.id, locationId: u.locationId, month: u.month, kwh: String(u.kwh), therms: String(u.therms),
    })));
  }
}

// ─── Audit log ───────────────────────────────────────────────────────────────

export async function appendAudit(row: AuditRow): Promise<void> {
  await db.insert(auditLog).values({
    id: row.id, ts: row.ts, companyId: row.companyId, userId: row.userId, userName: row.userName,
    section: row.section, field: row.field, prev: row.prev, next: row.next,
    factorId: row.factorId, formula: row.formula,
  });
}

export async function auditForCompany(companyId: string): Promise<AuditRow[]> {
  const rows = await db.select().from(auditLog)
    .where(eq(auditLog.companyId, companyId))
    .orderBy(desc(auditLog.ts))
    .limit(1000);
  return rows.map(r => ({
    id: r.id, ts: r.ts, companyId: r.companyId, userId: r.userId, userName: r.userName,
    section: r.section, field: r.field, prev: r.prev ?? "—", next: r.next ?? "—",
    factorId: r.factorId ?? undefined, formula: r.formula ?? undefined,
  }));
}
