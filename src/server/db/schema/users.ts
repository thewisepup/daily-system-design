import { index } from "drizzle-orm/pg-core";
import { createTable } from "../schema.js";

export const users = createTable(
  "users",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    email: d.text().notNull().unique(),
    createdAt: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (table) => [index("email_idx").on(table.email)],
);
