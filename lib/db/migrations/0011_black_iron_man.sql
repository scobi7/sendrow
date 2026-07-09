ALTER TABLE "gt_vendor_mappings" DROP CONSTRAINT "gt_vendor_mappings_vendor_pattern_unique";--> statement-breakpoint
ALTER TABLE "gt_vendor_mappings" ADD COLUMN "company_id" text;