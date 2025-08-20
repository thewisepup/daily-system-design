import { pgTable, pgEnum, index, timestamp, text, integer } from "drizzle-orm/pg-core";
import { topics } from "./topics";

export const issueStatusEnum = pgEnum("issue_status", [
  "generating",
  "draft", 
  "approved",
  "sent"
]);

export const issues = pgTable(
  "issues",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    topicId: integer()
      .notNull()
      .references(() => topics.id),
    title: text().notNull(),
    content: text(),
    status: issueStatusEnum().notNull().default("generating"),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }),
    approvedAt: timestamp({ withTimezone: true }),
    sentAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("issue_topic_idx").on(table.topicId),
    index("issue_status_idx").on(table.status),
    index("issue_created_idx").on(table.createdAt),
  ],
);