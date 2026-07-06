CREATE TABLE "gt_emission_factors" (
	"factor_id" text PRIMARY KEY NOT NULL,
	"factor_name" text NOT NULL,
	"category" text NOT NULL,
	"value" numeric(16, 8) NOT NULL,
	"unit" text NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"year_effective" integer NOT NULL,
	"year_retired" integer,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gt_emission_line_items" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"source_ref" text DEFAULT '' NOT NULL,
	"scope" integer NOT NULL,
	"category" text NOT NULL,
	"raw_value" numeric(14, 4) NOT NULL,
	"raw_unit" text NOT NULL,
	"co2e_kg" numeric(14, 4) NOT NULL,
	"confidence" text DEFAULT 'estimated' NOT NULL,
	"factor_id" text,
	"calc_log" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"mapping_profile_id" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gt_mapping_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"column_map" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"effective_from" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gt_connections" ADD COLUMN "utility_auth_uid" text;--> statement-breakpoint
ALTER TABLE "gt_connections" ADD COLUMN "utility_auth_email" text;--> statement-breakpoint
ALTER TABLE "gt_connections" ADD COLUMN "qb_access_token" text;--> statement-breakpoint
ALTER TABLE "gt_connections" ADD COLUMN "qb_refresh_token" text;--> statement-breakpoint
ALTER TABLE "gt_connections" ADD COLUMN "qb_realm_id" text;--> statement-breakpoint
ALTER TABLE "gt_connections" ADD COLUMN "qb_token_expires_at" text;--> statement-breakpoint
ALTER TABLE "gt_emission_line_items" ADD CONSTRAINT "gt_emission_line_items_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gt_mapping_profiles" ADD CONSTRAINT "gt_mapping_profiles_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;