CREATE TABLE "gt_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"line_item_id" text NOT NULL,
	"author" text NOT NULL,
	"author_type" text NOT NULL,
	"body" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gt_comments" ADD CONSTRAINT "gt_comments_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;