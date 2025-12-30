import type { Subscription } from "~/server/db/schema/subscriptions";

/**
 * Factory for creating Subscription-related test data.
 */
export class SubscriptionFactory {
  private static defaultSubscription(): Subscription {
    const now = new Date();
    return {
      id: "00000000-0000-0000-0000-000000000001",
      userId: "00000000-0000-0000-0000-000000000001",
      subjectId: 1,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Creates a mock Subscription with Date objects.
   * Used for database responses.
   */
  static createSubscription(
    overrides?: Partial<Subscription>,
  ): Subscription {
    return {
      ...this.defaultSubscription(),
      ...overrides,
    };
  }

  /**
   * Creates a mock Subscription with string dates (ISO format).
   * Used to simulate Redis cached responses where dates are serialized as strings.
   */
  static createSubscriptionWithStringDates(
    overrides?: Partial<Subscription>,
  ): Record<string, unknown> {
    const subscription = this.createSubscription(overrides);
    return {
      ...subscription,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }

  /**
   * Creates an array of mock Subscription objects.
   */
  static createSubscriptions(
    count: number,
    overrides?: Partial<Subscription>,
  ): Subscription[] {
    return Array.from({ length: count }, (_, index) =>
      this.createSubscription({
        id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
        ...overrides,
      }),
    );
  }
}
