import { pgTable, index, timestamp, text, integer } from "drizzle-orm/pg-core";

export const subjects = pgTable(
  "subjects",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull().unique(),
    description: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("subject_name_idx").on(table.name)],
);

export type Subject = typeof subjects.$inferSelect;
