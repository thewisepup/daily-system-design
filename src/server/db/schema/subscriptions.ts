import { pgTable, pgEnum, index, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";
import { subjects } from "./subjects";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "paused",
  "cancelled"
]);

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
    currentTopicSequence: integer().notNull().default(0),
    isWaitlist: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    activatedAt: timestamp({ withTimezone: true }),
    pausedAt: timestamp({ withTimezone: true }),
    cancelledAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("subscription_user_idx").on(table.userId),
    index("subscription_subject_idx").on(table.subjectId),
    index("subscription_status_idx").on(table.status),
    index("subscription_waitlist_idx").on(table.isWaitlist),
    index("subscription_user_subject_idx").on(table.userId, table.subjectId),
    index("subscription_active_progress_idx").on(table.status, table.currentTopicSequence),
  ],
);