ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
DROP INDEX "email_idx";--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");