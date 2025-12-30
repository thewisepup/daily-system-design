import {
  pgTable,
  pgEnum,
  index,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { subscriptions } from "./subscriptions";
import { auditChangeTypeEnum, type AuditChangeType } from "./auditTypes";
import { z } from "zod";

export const subscriptionAuditReasonEnum = pgEnum("subscription_audit_reason", [
  "user_signup", // User initially subscribed
  "user_unsubscribe", // User clicked unsubscribe link
  "admin_action", // Admin manually changed subscription
  "system_migration", // Data migration process
  "bounce_handling", // Email bounce caused status change
  "reactivation", // User re-subscribed after being unsubscribed
]);

export const subscriptionsAudit = pgTable(
  "subscriptions_audit",
  {
    id: uuid().primaryKey().defaultRandom(),
    subscriptionId: uuid()
      .notNull()
      .references(() => subscriptions.id),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    changeType: auditChangeTypeEnum().notNull(),
    reason: subscriptionAuditReasonEnum().notNull(),
    oldValues: jsonb(),
    newValues: jsonb().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("subscription_audit_user_idx").on(table.userId),
    index("subscription_audit_subscription_idx").on(table.subscriptionId),
  ],
);

export const subscriptionAuditReasonSchema = z.enum(
  subscriptionAuditReasonEnum.enumValues,
);
export type SubscriptionAuditReason = z.infer<
  typeof subscriptionAuditReasonSchema
>;

export type SubscriptionAudit = typeof subscriptionsAudit.$inferSelect;

export { type AuditChangeType };
