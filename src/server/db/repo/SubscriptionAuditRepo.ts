import { db } from "~/server/db";
import { subscriptionsAudit } from "~/server/db/schema/subscriptionsAudit";
import type { AuditChangeType } from "~/server/db/schema/auditTypes";
import type { SubscriptionAuditReason } from "~/server/db/schema/subscriptionsAudit";
import type { SubscriptionStatus } from "../schema/subscriptions";

// JSONB data interface for subscription audit values
export interface SubscriptionAuditValues {
  id: string;
  userId: string;
  subjectId: number;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export class SubscriptionAuditRepo {
  /**
   * Create comprehensive audit log entry with JSONB data
   */
  async create(
    subscriptionId: string,
    userId: string,
    changeType: AuditChangeType,
    reason: SubscriptionAuditReason,
    newValues: SubscriptionAuditValues,
    oldValues?: SubscriptionAuditValues,
  ) {
    const [auditEntry] = await db
      .insert(subscriptionsAudit)
      .values({
        subscriptionId,
        userId,
        changeType,
        reason,
        oldValues: oldValues ?? null,
        newValues,
      })
      .returning();
    return auditEntry;
  }

  /**
   * Helper method for INSERT operations (new subscriptions)
   */
  async logInsert(
    subscription: SubscriptionAuditValues,
    reason: SubscriptionAuditReason,
  ) {
    return this.create(
      subscription.id,
      subscription.userId,
      "INSERT",
      reason,
      subscription,
      undefined,
    );
  }

  /**
   * Helper method for UPDATE operations
   */
  async logUpdate(
    subscriptionId: string,
    userId: string,
    oldValues: SubscriptionAuditValues,
    newValues: SubscriptionAuditValues,
    reason: SubscriptionAuditReason,
  ) {
    return this.create(
      subscriptionId,
      userId,
      "UPDATE",
      reason,
      newValues,
      oldValues,
    );
  }

  /**
   * Bulk create audit log entries for INSERT operations
   */
  async bulkLogInsert(
    subscriptions: SubscriptionAuditValues[],
    reason: SubscriptionAuditReason,
  ) {
    if (subscriptions.length === 0) {
      return [];
    }

    const auditValues = subscriptions.map((subscription) => ({
      subscriptionId: subscription.id,
      userId: subscription.userId,
      changeType: "INSERT" as const,
      reason,
      oldValues: null,
      newValues: subscription,
    }));

    const auditEntries = await db
      .insert(subscriptionsAudit)
      .values(auditValues)
      .returning();

    return auditEntries;
  }
}

// Create singleton instance
export const subscriptionAuditRepo = new SubscriptionAuditRepo();
