import { pgTable, index, timestamp, integer } from "drizzle-orm/pg-core";
import { subjects } from "./subjects";

export const newsletterSequence = pgTable(
  "newsletter_sequence",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    subjectId: integer()
      .references(() => subjects.id)
      .notNull(),
    currentSequence: integer().notNull().default(1),
    lastSentAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }),
  },
  (table) => [index("newsletter_sequence_subject_idx").on(table.subjectId)],
);
