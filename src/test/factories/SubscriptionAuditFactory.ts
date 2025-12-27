import type { subscriptionsAudit } from "~/server/db/schema/subscriptionsAudit";
import type { AuditChangeType } from "~/server/db/schema/auditTypes";
import type { SubscriptionAuditReason } from "~/server/db/schema/subscriptionsAudit";

type SubscriptionAudit = typeof subscriptionsAudit.$inferSelect;

/**
 * Factory for creating SubscriptionAudit-related test data.
 */
export class SubscriptionAuditFactory {
  private static defaultSubscriptionAudit(): SubscriptionAudit {
    const now = new Date();
    return {
      id: "00000000-0000-0000-0000-000000000001",
      subscriptionId: "00000000-0000-0000-0000-000000000001",
      userId: "00000000-0000-0000-0000-000000000001",
      changeType: "INSERT" as AuditChangeType,
      reason: "user_signup" as SubscriptionAuditReason,
      oldValues: null,
      newValues: { status: "active" },
      createdAt: now,
    };
  }

  /**
   * Creates a mock SubscriptionAudit with Date objects.
   * Used for database responses.
   */
  static createSubscriptionAudit(
    overrides?: Partial<SubscriptionAudit>,
  ): SubscriptionAudit {
    return {
      ...this.defaultSubscriptionAudit(),
      ...overrides,
    };
  }

  /**
   * Creates a mock SubscriptionAudit with string dates (ISO format).
   * Used to simulate Redis cached responses where dates are serialized as strings.
   */
  static createSubscriptionAuditWithStringDates(
    overrides?: Partial<SubscriptionAudit>,
  ): Record<string, unknown> {
    const audit = this.createSubscriptionAudit(overrides);
    return {
      ...audit,
      createdAt: audit.createdAt.toISOString(),
    };
  }

  /**
   * Creates an array of mock SubscriptionAudit objects.
   */
  static createSubscriptionAudits(
    count: number,
    overrides?: Partial<SubscriptionAudit>,
  ): SubscriptionAudit[] {
    return Array.from({ length: count }, (_, index) =>
      this.createSubscriptionAudit({
        id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
        ...overrides,
      }),
    );
  }
}
