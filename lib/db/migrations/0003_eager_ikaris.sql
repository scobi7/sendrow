CREATE TABLE "gt_data_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"requested_by" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"due_date" text,
	"created_at" text NOT NULL,
	"fulfilled_at" text
);
--> statement-breakpoint
CREATE TABLE "gt_intake_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"filename" text NOT NULL,
	"data_type" text NOT NULL,
	"session_score" numeric(4, 3) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'pending_review' NOT NULL,
	"reviewer_notes" text,
	"row_count" integer DEFAULT 0 NOT NULL,
	"mapping_profile_id" text,
	"created_at" text NOT NULL,
	"reviewed_at" text
);
--> statement-breakpoint
CREATE TABLE "gt_pipeline_status" (
	"company_id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"locked_at" text,
	"locked_by" text,
	"notes" text,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gt_companies" ADD COLUMN "boundary_approach" text;--> statement-breakpoint
ALTER TABLE "gt_companies" ADD COLUMN "onboarding_complete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "gt_emission_line_items" ADD COLUMN "status" text DEFAULT 'mapped' NOT NULL;--> statement-breakpoint
ALTER TABLE "gt_data_requests" ADD CONSTRAINT "gt_data_requests_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gt_intake_sessions" ADD CONSTRAINT "gt_intake_sessions_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gt_pipeline_status" ADD CONSTRAINT "gt_pipeline_status_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;