CREATE TABLE "gt_referral_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text NOT NULL,
	"trigger" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gt_vendor_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_pattern" text NOT NULL,
	"scope" integer NOT NULL,
	"category" text NOT NULL,
	"factor_id" text,
	"confidence" text DEFAULT 'confirmed' NOT NULL,
	"confirmed_by" text NOT NULL,
	"confirmed_at" text NOT NULL,
	"source_company_id" text,
	"times_applied" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "gt_vendor_mappings_vendor_pattern_unique" UNIQUE("vendor_pattern")
);
--> statement-breakpoint
ALTER TABLE "gt_data_requests" ADD COLUMN "token" text;--> statement-breakpoint
ALTER TABLE "gt_data_requests" ADD COLUMN "expires_at" text;--> statement-breakpoint
ALTER TABLE "gt_data_requests" ADD COLUMN "checklist" jsonb;--> statement-breakpoint
ALTER TABLE "gt_data_requests" ADD COLUMN "reminders_sent_at" jsonb;--> statement-breakpoint
ALTER TABLE "gt_data_requests" ADD CONSTRAINT "gt_data_requests_token_unique" UNIQUE("token");