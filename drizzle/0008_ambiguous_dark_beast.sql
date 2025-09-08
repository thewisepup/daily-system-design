CREATE TYPE "public"."transactional_email_type" AS ENUM('welcome');--> statement-breakpoint
CREATE TABLE "transactional_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_type" "transactional_email_type" NOT NULL,
	"status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"external_id" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
DROP INDEX "delivery_email_type_idx";--> statement-breakpoint
ALTER TABLE "transactional_emails" ADD CONSTRAINT "transactional_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactional_email_user_idx" ON "transactional_emails" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactional_email_type_idx" ON "transactional_emails" USING btree ("email_type");--> statement-breakpoint
CREATE INDEX "transactional_email_external_id_idx" ON "transactional_emails" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "transactional_email_user_type_idx" ON "transactional_emails" USING btree ("user_id","email_type");--> statement-breakpoint
ALTER TABLE "deliveries" DROP COLUMN "email_type";--> statement-breakpoint
DROP TYPE "public"."email_type";