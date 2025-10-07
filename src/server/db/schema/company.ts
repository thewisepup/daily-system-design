import { pgTable, timestamp, integer, text } from "drizzle-orm/pg-core";

export const company = pgTable("company", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export type Company = typeof company.$inferSelect;
