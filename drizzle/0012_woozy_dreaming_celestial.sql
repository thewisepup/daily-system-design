ALTER TYPE "public"."transactional_email_type" ADD VALUE 'marketing';--> statement-breakpoint
DROP INDEX "transactional_email_type_idx";--> statement-breakpoint
DROP INDEX "transactional_email_user_type_idx";--> statement-breakpoint
ALTER TABLE "transactional_emails" ADD COLUMN "campaign_id" text;--> statement-breakpoint
CREATE INDEX "transactional_email_campaign_idx" ON "transactional_emails" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "transactional_email_user_type_campaign_idx" ON "transactional_emails" USING btree ("user_id","email_type","campaign_id");