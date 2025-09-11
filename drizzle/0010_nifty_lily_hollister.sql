ALTER TABLE "issues" ADD COLUMN "content_json" json;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "raw_html" text;--> statement-breakpoint
ALTER TABLE "issues" DROP COLUMN "content";