CREATE TABLE "gt_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"label" text NOT NULL,
	"period" text,
	"totals" jsonb NOT NULL,
	"line_items" jsonb NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"sha256" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gt_share_links" ADD COLUMN "snapshot_id" text;--> statement-breakpoint
ALTER TABLE "gt_share_links" ADD COLUMN "recipient_email" text;--> statement-breakpoint
ALTER TABLE "gt_share_links" ADD COLUMN "recipient_label" text;--> statement-breakpoint
ALTER TABLE "gt_snapshots" ADD CONSTRAINT "gt_snapshots_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;