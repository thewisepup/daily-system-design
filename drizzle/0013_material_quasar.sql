CREATE TABLE "newsletter_send_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"issue_id" integer NOT NULL,
	"total_sent" integer DEFAULT 0 NOT NULL,
	"total_failed" integer DEFAULT 0 NOT NULL,
	"failed_user_ids" json DEFAULT '[]'::json NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"completion_time" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "newsletter_send_results" ADD CONSTRAINT "newsletter_send_results_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE no action ON UPDATE no action;