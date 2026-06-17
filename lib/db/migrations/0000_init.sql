CREATE TABLE "gt_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"ts" text NOT NULL,
	"company_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"section" text NOT NULL,
	"field" text NOT NULL,
	"prev" text,
	"next" text,
	"factor_id" text,
	"formula" text
);
--> statement-breakpoint
CREATE TABLE "gt_calcs" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"scope" integer NOT NULL,
	"category" text NOT NULL,
	"co2e_tons" numeric(14, 4) DEFAULT '0' NOT NULL,
	"factor_id" text,
	"formula" text DEFAULT '' NOT NULL,
	"basis" text DEFAULT 'measured' NOT NULL,
	"market_based_tons" numeric(14, 4)
);
--> statement-breakpoint
CREATE TABLE "gt_companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"headcount_range" text,
	"fiscal_year_end_month" integer,
	"setup_complete" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"report_generated_at" text,
	"action_plan" jsonb,
	"section_status" jsonb
);
--> statement-breakpoint
CREATE TABLE "gt_connections" (
	"company_id" text PRIMARY KEY NOT NULL,
	"qb_connected" boolean DEFAULT false NOT NULL,
	"qb_last_synced" text,
	"utility_connected" boolean DEFAULT false NOT NULL,
	"utility_last_synced" text
);
--> statement-breakpoint
CREATE TABLE "gt_company_inputs" (
	"company_id" text PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gt_consultant_clients" (
	"id" text PRIMARY KEY NOT NULL,
	"consultant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"added_at" text NOT NULL,
	"archived_at" text
);
--> statement-breakpoint
CREATE TABLE "gt_invite_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"consultant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"created_at" text NOT NULL,
	"expires_at" text NOT NULL,
	"used_at" text
);
--> statement-breakpoint
CREATE TABLE "gt_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"state" text DEFAULT 'CA' NOT NULL,
	"zip" text DEFAULT '' NOT NULL,
	"egrid_subregion" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gt_qb_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"vendor" text NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gt_user_companies" (
	"clerk_id" text PRIMARY KEY NOT NULL,
	"company_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'company' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gt_utility_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"location_id" text NOT NULL,
	"month" text NOT NULL,
	"kwh" numeric(14, 2) DEFAULT '0' NOT NULL,
	"therms" numeric(14, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gt_audit_log" ADD CONSTRAINT "gt_audit_log_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gt_calcs" ADD CONSTRAINT "gt_calcs_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gt_connections" ADD CONSTRAINT "gt_connections_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gt_company_inputs" ADD CONSTRAINT "gt_company_inputs_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gt_consultant_clients" ADD CONSTRAINT "gt_consultant_clients_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gt_invite_tokens" ADD CONSTRAINT "gt_invite_tokens_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gt_locations" ADD CONSTRAINT "gt_locations_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gt_qb_transactions" ADD CONSTRAINT "gt_qb_transactions_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gt_user_companies" ADD CONSTRAINT "gt_user_companies_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gt_utility_data" ADD CONSTRAINT "gt_utility_data_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;