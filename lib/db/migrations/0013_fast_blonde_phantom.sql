CREATE TABLE "gt_events" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"actor" text NOT NULL,
	"actor_type" text NOT NULL,
	"verb" text NOT NULL,
	"subject" text NOT NULL,
	"subject_id" text,
	"meta" jsonb,
	"ts" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gt_data_requests" ADD COLUMN "period_label" text;--> statement-breakpoint
ALTER TABLE "gt_events" ADD CONSTRAINT "gt_events_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;