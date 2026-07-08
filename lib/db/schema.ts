import { pgTable, text, boolean, integer, numeric, jsonb, serial } from "drizzle-orm/pg-core";

export const companies = pgTable("gt_companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry"),
  headcountRange: text("headcount_range"),
  fiscalYearEndMonth: integer("fiscal_year_end_month"),
  reportingFramework: text("reporting_framework"),
  boundaryApproach: text("boundary_approach"),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  setupComplete: boolean("setup_complete").notNull().default(false),
  createdAt: text("created_at").notNull(),
  reportGeneratedAt: text("report_generated_at"),
  actionPlan: jsonb("action_plan"),
  sectionStatus: jsonb("section_status"),
});

export const scope3Screening = pgTable("gt_scope3_screening", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  categoryNumber: integer("category_number").notNull(),
  categoryName: text("category_name").notNull(),
  status: text("status").notNull().default("excluded"),
  reason: text("reason"),
  notes: text("notes"),
  updatedAt: text("updated_at").notNull(),
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

export const mappingProfiles = pgTable("gt_mapping_profiles", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  columnMap: jsonb("column_map").notNull().default({}),
  effectiveFrom: text("effective_from").notNull(),
  createdAt: text("created_at").notNull(),
});

export const emissionLineItems = pgTable("gt_emission_line_items", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  sourceRef: text("source_ref").notNull().default(""),
  scope: integer("scope").notNull(),
  category: text("category").notNull(),
  rawValue: numeric("raw_value", { precision: 14, scale: 4 }).notNull(),
  rawUnit: text("raw_unit").notNull(),
  co2eKg: numeric("co2e_kg", { precision: 14, scale: 4 }).notNull(),
  confidence: text("confidence").notNull().default("estimated"),
  // "mapped" = factor applied; "unmapped" = flagged for review, zero emissions — never dropped
  status: text("status").notNull().default("mapped"),
  factorId: text("factor_id"),
  calcLog: jsonb("calc_log").notNull().default({}),
  mappingProfileId: text("mapping_profile_id"),
  createdAt: text("created_at").notNull(),
});

export const intakeSessions = pgTable("gt_intake_sessions", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  uploadedBy: text("uploaded_by").notNull(),
  filename: text("filename").notNull(),
  dataType: text("data_type").notNull(),
  sessionScore: numeric("session_score", { precision: 4, scale: 3 }).notNull().default("0"),
  status: text("status").notNull().default("pending_review"),
  reviewerNotes: text("reviewer_notes"),
  rowCount: integer("row_count").notNull().default(0),
  mappingProfileId: text("mapping_profile_id"),
  createdAt: text("created_at").notNull(),
  reviewedAt: text("reviewed_at"),
});

export const dataRequests = pgTable("gt_data_requests", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  requestedBy: text("requested_by").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  dueDate: text("due_date"),
  createdAt: text("created_at").notNull(),
  fulfilledAt: text("fulfilled_at"),
  // Magic-link portal (Plan J): client accesses /portal/[token] without login
  token: text("token").unique(),
  expiresAt: text("expires_at"),
  // Array of { id, dataType, label, instructions, status: "pending" | "received" }
  checklist: jsonb("checklist"),
  // ISO timestamps of reminders already sent, keyed by day offset ("3" | "7" | "14")
  remindersSentAt: jsonb("reminders_sent_at"),
});

/** Cross-client vendor → category memory (Plan J). Global: one confirmation
 *  maps that vendor for every client, forever. Human-confirmed only. */
export const vendorMappings = pgTable("gt_vendor_mappings", {
  id: text("id").primaryKey(),
  vendorPattern: text("vendor_pattern").notNull().unique(), // normalized vendor name
  scope: integer("scope").notNull(),
  category: text("category").notNull(),
  factorId: text("factor_id"),
  confidence: text("confidence").notNull().default("confirmed"),
  confirmedBy: text("confirmed_by").notNull(),
  confirmedAt: text("confirmed_at").notNull(),
  sourceCompanyId: text("source_company_id"),
  timesApplied: integer("times_applied").notNull().default(0),
});

export const referralLeads = pgTable("gt_referral_leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  trigger: text("trigger"), // what prompted the need (buyer request, regulation, …)
  status: text("status").notNull().default("new"), // new | routed | converted | dead
  createdAt: text("created_at").notNull(),
});

export const pipelineStatus = pgTable("gt_pipeline_status", {
  companyId: text("company_id").primaryKey().references(() => companies.id),
  status: text("status").notNull().default("not_started"),
  lockedAt: text("locked_at"),
  lockedBy: text("locked_by"),
  notes: text("notes"),
  updatedAt: text("updated_at").notNull(),
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
