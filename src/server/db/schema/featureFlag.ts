import { boolean, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const featureFlag = pgTable(
  "feature_flag",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    flag: text().notNull(),
    enabled: boolean().notNull().default(false),
  },
  (table) => [primaryKey({ columns: [table.userId, table.flag] })],
);
