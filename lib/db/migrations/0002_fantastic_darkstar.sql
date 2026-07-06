CREATE TABLE "gt_scope3_screening" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"category_number" integer NOT NULL,
	"category_name" text NOT NULL,
	"status" text DEFAULT 'excluded' NOT NULL,
	"reason" text,
	"notes" text,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gt_companies" ADD COLUMN "reporting_framework" text;--> statement-breakpoint
ALTER TABLE "gt_scope3_screening" ADD CONSTRAINT "gt_scope3_screening_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;