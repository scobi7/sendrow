import { pgTable, text, boolean, integer, numeric, jsonb, serial } from "drizzle-orm/pg-core";

export const companies = pgTable("gt_companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry"),
  headcountRange: text("headcount_range"),
  fiscalYearEndMonth: integer("fiscal_year_end_month"),
  reportingFramework: text("reporting_framework"),
  boundaryApproach: text("boundary_approach"),
  // Who receives portal links + reminders (v2: clients have no login)
  clientContactName: text("client_contact_name"),
  clientContactEmail: text("client_contact_email"),
  // 2-digit NAICS sector - benchmarking prerequisite (#46)
  naicsCode: text("naics_code"),
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

/** Unified immutable event log (pipeline Ground Rule 3): every create /
 *  approve / share / convert / edit / comment, from day one. Append-only -  *  no update or delete path exists in code. */
export const events = pgTable("gt_events", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  actor: text("actor").notNull(),          // clerk id, "portal:<requestId>", or "system"
  actorType: text("actor_type").notNull(), // consultant | supplier | system
  verb: text("verb").notNull(),            // request.created, upload.received, session.approved, snapshot.shared…
  subject: text("subject").notNull(),      // human-readable: filename, request description, snapshot label
  subjectId: text("subject_id"),
  meta: jsonb("meta"),
  ts: text("ts").notNull(),
});

/** Comment threads pinned to specific data lines (U1.5/#6): the conversation
 *  lives ON the number, not in an email chain. */
export const comments = pgTable("gt_comments", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  lineItemId: text("line_item_id"), // null for checklist-item threads (X2)
  dataRequestId: text("data_request_id"), // thread anchored to a request…
  checklistItemId: text("checklist_item_id"), // …and one of its checklist items
  author: text("author").notNull(),
  authorType: text("author_type").notNull(), // consultant | supplier
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
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

/** White-label brand (Plan N5): what the consultant's clients see instead of
 *  Sendrow, on the portal, shared results, and client-facing emails (§11). */
export const consultantProfiles = pgTable("gt_consultant_profiles", {
  consultantId: text("consultant_id").primaryKey(), // clerk id
  brandName: text("brand_name"),
  logoUrl: text("logo_url"),
  accentColor: text("accent_color"), // hex, overrides --primary on client-facing surfaces
  replyTo: text("reply_to"),
  updatedAt: text("updated_at").notNull(),
});

/** Read-only client results links (Plan N5): the consultant-branded "dashboard"
 *  a company sees - shared as a link, never a login. */
export const shareLinks = pgTable("gt_share_links", {
  token: text("token").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  // When set, the link shows this frozen snapshot (§13); null = legacy live view
  snapshotId: text("snapshot_id"),
  // Who received it - lets restatement alerts reach them when data is corrected
  recipientEmail: text("recipient_email"),
  recipientLabel: text("recipient_label"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  revokedAt: text("revoked_at"),
});

/** Frozen, dated, approved versions (Plan T3 / invariant §13): the ONLY thing
 *  ever shared. Immutable by construction - corrections create a new snapshot
 *  and restatement-alert every recipient of the old one. */
export const snapshots = pgTable("gt_snapshots", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  label: text("label").notNull(),
  period: text("period"),
  totals: jsonb("totals").notNull(),      // { scope1, scope2Location, scope2Market, scope3, total } in tons
  lineItems: jsonb("line_items").notNull(), // frozen mapped items incl. calc logs
  itemCount: integer("item_count").notNull().default(0),
  sha256: text("sha256").notNull(),        // content hash - proves immutability
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});

/** Engagement templates (#23): a consultant's standard request package,
 *  reusable in one click. Stored as config (Ground Rule #1). */
export const requestTemplates = pgTable("gt_request_templates", {
  id: text("id").primaryKey(),
  consultantId: text("consultant_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  dataTypes: jsonb("data_types").notNull().default([]),
  periodLabel: text("period_label"),
  dueInDays: integer("due_in_days"),
  createdAt: text("created_at").notNull(),
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
  // sha256 of the normalized sorted header set - format memory (Plan T2):
  // the same file shape maps with zero clicks next time
  headerFingerprint: text("header_fingerprint"),
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
  // "mapped" = factor applied; "unmapped" = flagged for review, zero emissions - never dropped
  status: text("status").notNull().default("mapped"),
  // Fiscal-year label ("2026" / "FY2026") from the row date; null = untagged (pre-N4 or dateless)
  period: text("period"),
  // The row's own date/month as supplied ("2026-01", "Jan") - provenance + monthly granularity
  activityDate: text("activity_date"),
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
  evidenceId: text("evidence_id"),
  createdAt: text("created_at").notNull(),
  reviewedAt: text("reviewed_at"),
});

/** Evidence locker (Plan N3): the original source document behind an import.
 *  The hash is always recorded, even when blob storage isn't configured -  *  provenance survives without the bytes. */
export const evidence = pgTable("gt_evidence", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  dataRequestId: text("data_request_id"),
  checklistItemId: text("checklist_item_id"),
  filename: text("filename").notNull(),
  sha256: text("sha256").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  blobUrl: text("blob_url"), // null when BLOB_READ_WRITE_TOKEN unset at upload time
  uploadedVia: text("uploaded_via").notNull(), // "portal_upload" | "consultant_upload"
  createdAt: text("created_at").notNull(),
});

export const dataRequests = pgTable("gt_data_requests", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  requestedBy: text("requested_by").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  dueDate: text("due_date"),
  // What timeframe the data should cover - "Calendar year 2025", "Q1 2026"…
  periodLabel: text("period_label"),
  createdAt: text("created_at").notNull(),
  fulfilledAt: text("fulfilled_at"),
  // Magic-link portal (Plan J): client accesses /portal/[token] without login
  token: text("token").unique(),
  expiresAt: text("expires_at"),
  // Array of { id, dataType, label, instructions, status: "pending" | "received" }
  checklist: jsonb("checklist"),
  // ISO timestamps of reminders already sent, keyed by tier
  remindersSentAt: jsonb("reminders_sent_at"),
  // Per-request kill switch for automatic chasing (#21)
  remindersEnabled: boolean("reminders_enabled").notNull().default(true),
});

/** Cross-client vendor → category memory (Plan J). Global: one confirmation
 *  maps that vendor for every client, forever. Human-confirmed only. */
export const vendorMappings = pgTable("gt_vendor_mappings", {
  id: text("id").primaryKey(),
  vendorPattern: text("vendor_pattern").notNull(), // normalized vendor name
  // null = global (applies to every client); set = only this client.
  // Truck IDs and account numbers must never enter global memory.
  companyId: text("company_id"),
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
