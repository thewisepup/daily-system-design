CREATE TYPE "public"."audit_change_type" AS ENUM('INSERT', 'UPDATE', 'DELETE');--> statement-breakpoint
CREATE TYPE "public"."subscription_audit_reason" AS ENUM('user_signup', 'user_unsubscribe', 'admin_action', 'system_migration', 'bounce_handling', 'reactivation');--> statement-breakpoint
CREATE TABLE "subscriptions_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"change_type" "audit_change_type" NOT NULL,
	"reason" "subscription_audit_reason" NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "subscription_waitlist_idx";--> statement-breakpoint
DROP INDEX "subscription_active_progress_idx";--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions_audit" ADD CONSTRAINT "subscriptions_audit_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions_audit" ADD CONSTRAINT "subscriptions_audit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscription_audit_user_idx" ON "subscriptions_audit" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_audit_subscription_idx" ON "subscriptions_audit" USING btree ("subscription_id");--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "current_topic_sequence";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "is_waitlist";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "activated_at";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "paused_at";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "cancelled_at";