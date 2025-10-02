import {
  pgTable,
  index,
  timestamp,
  integer,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { issues } from "./issues";

export const feedback = pgTable(
  "feedback",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    issueId: integer()
      .notNull()
      .references(() => issues.id),
    feedback: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("feedback_issueId_idx").on(table.issueId)],
);
export type Feedback = typeof feedback.$inferSelect;
