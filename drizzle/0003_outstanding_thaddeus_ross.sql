CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('generating', 'draft', 'approved', 'sent');--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"external_id" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "issues_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"topic_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"status" "issue_status" DEFAULT 'generating' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "delivery_issue_idx" ON "deliveries" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "delivery_user_idx" ON "deliveries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "delivery_status_idx" ON "deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "delivery_created_idx" ON "deliveries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "delivery_external_id_idx" ON "deliveries" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "delivery_user_issue_idx" ON "deliveries" USING btree ("user_id","issue_id");--> statement-breakpoint
CREATE INDEX "issue_topic_idx" ON "issues" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "issue_status_idx" ON "issues" USING btree ("status");--> statement-breakpoint
CREATE INDEX "issue_created_idx" ON "issues" USING btree ("created_at");