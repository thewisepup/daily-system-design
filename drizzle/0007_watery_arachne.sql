CREATE TYPE "public"."email_type" AS ENUM('newsletter', 'welcome');--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "email_type" "email_type" DEFAULT 'newsletter' NOT NULL;--> statement-breakpoint
CREATE INDEX "delivery_email_type_idx" ON "deliveries" USING btree ("email_type");