import { pgTable, text, boolean, integer, numeric, jsonb, serial } from "drizzle-orm/pg-core";

export const companies = pgTable("gt_companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry"),
  headcountRange: text("headcount_range"),
  fiscalYearEndMonth: integer("fiscal_year_end_month"),
  setupComplete: boolean("setup_complete").notNull().default(false),
  createdAt: text("created_at").notNull(),
  reportGeneratedAt: text("report_generated_at"),
  actionPlan: jsonb("action_plan"),
  sectionStatus: jsonb("section_status"),
});

export const userCompanies = pgTable("gt_user_companies", {
  clerkId: text("clerk_id").primaryKey(),
  companyId: text("company_id").references(() => companies.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("company"),
  createdAt: text("created_at").notNull(),
});

export const locations = pgTable("gt_locations", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default("CA"),
  zip: text("zip").notNull().default(""),
  egridSubregion: text("egrid_subregion").notNull(),
});

export const companyConnections = pgTable("gt_connections", {
  companyId: text("company_id").primaryKey().references(() => companies.id),
  qbConnected: boolean("qb_connected").notNull().default(false),
  qbLastSynced: text("qb_last_synced"),
  utilityConnected: boolean("utility_connected").notNull().default(false),
  utilityLastSynced: text("utility_last_synced"),
  utilityAuthUid: text("utility_auth_uid"),
  utilityAuthEmail: text("utility_auth_email"),
  qbAccessToken: text("qb_access_token"),
  qbRefreshToken: text("qb_refresh_token"),
  qbRealmId: text("qb_realm_id"),
  qbTokenExpiresAt: text("qb_token_expires_at"),
});

export const companyInputs = pgTable("gt_company_inputs", {
  companyId: text("company_id").primaryKey().references(() => companies.id),
  data: jsonb("data").notNull().default({}),
});

export const calcs = pgTable("gt_calcs", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  scope: integer("scope").notNull(),
  category: text("category").notNull(),
  co2eTons: numeric("co2e_tons", { precision: 14, scale: 4 }).notNull().default("0"),
  factorId: text("factor_id"),
  formula: text("formula").notNull().default(""),
  basis: text("basis").notNull().default("measured"),
  marketBasedTons: numeric("market_based_tons", { precision: 14, scale: 4 }),
});

export const qbTransactions = pgTable("gt_qb_transactions", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  vendor: text("vendor").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  date: text("date").notNull(),
});

export const utilityData = pgTable("gt_utility_data", {
  id: serial("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  locationId: text("location_id").notNull(),
  month: text("month").notNull(),
  kwh: numeric("kwh", { precision: 14, scale: 2 }).notNull().default("0"),
  therms: numeric("therms", { precision: 14, scale: 2 }).notNull().default("0"),
});

export const auditLog = pgTable("gt_audit_log", {
  id: text("id").primaryKey(),
  ts: text("ts").notNull(),
  companyId: text("company_id").notNull().references(() => companies.id),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  section: text("section").notNull(),
  field: text("field").notNull(),
  prev: text("prev"),
  next: text("next"),
  factorId: text("factor_id"),
  formula: text("formula"),
});

export const consultantClients = pgTable("gt_consultant_clients", {
  id: text("id").primaryKey(),
  consultantId: text("consultant_id").notNull(),
  companyId: text("company_id").notNull().references(() => companies.id),
  addedAt: text("added_at").notNull(),
  archivedAt: text("archived_at"),
});

export const inviteTokens = pgTable("gt_invite_tokens", {
  token: text("token").primaryKey(),
  consultantId: text("consultant_id").notNull(),
  companyId: text("company_id").notNull().references(() => companies.id),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
});

export const emissionFactors = pgTable("gt_emission_factors", {
  factorId: text("factor_id").primaryKey(),
  factorName: text("factor_name").notNull(),
  category: text("category").notNull(),
  value: numeric("value", { precision: 16, scale: 8 }).notNull(),
  unit: text("unit").notNull(),
  source: text("source").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  yearEffective: integer("year_effective").notNull(),
  yearRetired: integer("year_retired"),
  updatedAt: text("updated_at").notNull(),
});
