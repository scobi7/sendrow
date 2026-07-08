CREATE TABLE "gt_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"data_request_id" text,
	"checklist_item_id" text,
	"filename" text NOT NULL,
	"sha256" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"blob_url" text,
	"uploaded_via" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gt_intake_sessions" ADD COLUMN "evidence_id" text;--> statement-breakpoint
ALTER TABLE "gt_evidence" ADD CONSTRAINT "gt_evidence_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;