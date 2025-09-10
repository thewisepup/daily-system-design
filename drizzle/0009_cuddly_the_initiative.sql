ALTER TABLE "topics" ADD COLUMN "topic_data" json NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" DROP COLUMN "description";