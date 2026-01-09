ALTER TABLE "feedback" ALTER COLUMN "issue_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "campaign_id" text;--> statement-breakpoint
CREATE INDEX "feedback_campaignId_idx" ON "feedback" USING btree ("campaign_id");--> statement-breakpoint
CREATE UNIQUE INDEX "feedback_userId_issueId_unique" ON "feedback" USING btree ("user_id","issue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "feedback_userId_campaignId_unique" ON "feedback" USING btree ("user_id","campaign_id");--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_source_check" CHECK ("feedback"."issue_id" IS NOT NULL OR "feedback"."campaign_id" IS NOT NULL);