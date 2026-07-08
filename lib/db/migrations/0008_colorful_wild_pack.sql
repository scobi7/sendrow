CREATE TABLE "gt_consultant_profiles" (
	"consultant_id" text PRIMARY KEY NOT NULL,
	"brand_name" text,
	"logo_url" text,
	"accent_color" text,
	"reply_to" text,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gt_share_links" (
	"token" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" text NOT NULL,
	"revoked_at" text
);
--> statement-breakpoint
ALTER TABLE "gt_share_links" ADD CONSTRAINT "gt_share_links_company_id_gt_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."gt_companies"("id") ON DELETE no action ON UPDATE no action;