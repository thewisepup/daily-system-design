CREATE TABLE "feature_flag" (
	"user_id" uuid NOT NULL,
	"flag" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "feature_flag_user_id_flag_pk" PRIMARY KEY("user_id","flag")
);
--> statement-breakpoint
ALTER TABLE "feature_flag" ADD CONSTRAINT "feature_flag_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;