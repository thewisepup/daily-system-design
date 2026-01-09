import {
  pgTable,
  index,
  timestamp,
  integer,
  text,
  uuid,
  numeric,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { issues } from "./issues";

export const feedback = pgTable(
  "feedback",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    issueId: integer().references(() => issues.id),
    campaignId: text(),
    feedback: text().notNull(),
    rating: numeric({ precision: 2, scale: 1, mode: "number" }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("feedback_issueId_idx").on(table.issueId),
    index("feedback_campaignId_idx").on(table.campaignId),
    uniqueIndex("feedback_userId_issueId_unique").on(
      table.userId,
      table.issueId,
    ),
    uniqueIndex("feedback_userId_campaignId_unique").on(
      table.userId,
      table.campaignId,
    ),
  ],
);
export type Feedback = typeof feedback.$inferSelect;
