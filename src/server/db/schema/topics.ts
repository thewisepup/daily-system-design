import { pgTable, index, timestamp, text, integer, json } from "drizzle-orm/pg-core";
import { subjects } from "./subjects";

export const topics = pgTable(
  "topics",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: text().notNull(),
    topicData: json().notNull(),
    subjectId: integer()
      .notNull()
      .references(() => subjects.id),
    sequenceOrder: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("topic_subject_idx").on(table.subjectId),
    index("topic_sequence_idx").on(table.sequenceOrder),
    index("topic_subject_sequence_idx").on(
      table.subjectId,
      table.sequenceOrder,
    ),
  ],
);

export type Topic = typeof topics.$inferSelect;
