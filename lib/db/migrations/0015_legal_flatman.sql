CREATE TABLE "gt_request_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"consultant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"data_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"period_label" text,
	"due_in_days" integer,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gt_companies" ADD COLUMN "naics_code" text;--> statement-breakpoint
ALTER TABLE "gt_data_requests" ADD COLUMN "reminders_enabled" boolean DEFAULT true NOT NULL;