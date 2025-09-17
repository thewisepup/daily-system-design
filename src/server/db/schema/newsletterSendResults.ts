import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  json,
} from "drizzle-orm/pg-core";
import { issues } from "./issues";

export const newsletterSendResults = pgTable("newsletter_send_results", {
  id: serial().primaryKey(),
  name: text().notNull(), // e.g. "System Design Issue #42"
  issueId: integer()
    .references(() => issues.id)
    .notNull(),
  totalSent: integer().default(0).notNull(),
  totalFailed: integer().default(0).notNull(),
  failedUserIds: json().$type<string[]>().default([]).notNull(),
  startTime: timestamp({ withTimezone: true }).notNull(),
  completionTime: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export type NewsletterSendResult = typeof newsletterSendResults.$inferSelect;
export type NewNewsletterSendResult = typeof newsletterSendResults.$inferInsert;
