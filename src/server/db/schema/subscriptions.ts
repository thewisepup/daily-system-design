import {
  pgTable,
  pgEnum,
  index,
  timestamp,
  uuid,
  integer,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { subjects } from "./subjects";
import { z } from "zod";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "paused",
  "cancelled",
]);

export const subscriptionStatusSchema = z.enum(
  subscriptionStatusEnum.enumValues,
);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    subjectId: integer()
      .notNull()
      .references(() => subjects.id),
    status: subscriptionStatusEnum().notNull().default("active"),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("subscription_user_idx").on(table.userId),
    index("subscription_subject_idx").on(table.subjectId),
    index("subscription_status_idx").on(table.status),
    index("subscription_status_updated_at_idx").on(
      table.status,
      table.updatedAt,
    ),
    index("subscription_user_subject_idx").on(table.userId, table.subjectId),
  ],
);
export type Subscription = typeof subscriptions.$inferSelect;
