import { pgTable, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  email: t.text().notNull().unique(),
  createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
}), (table) => ({
  emailIdx: index("user_email_idx").on(table.email),
}));
