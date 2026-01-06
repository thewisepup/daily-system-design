import type { deliveries } from "~/server/db/schema/deliveries";

type Delivery = typeof deliveries.$inferSelect;

/**
 * Factory for creating Delivery-related test data.
 */
export class DeliveryFactory {
  private static defaultDelivery(): Delivery {
    const now = new Date();
    return {
      id: "00000000-0000-0000-0000-000000000001",
      issueId: 1,
      userId: "00000000-0000-0000-0000-000000000001",
      status: "pending",
      externalId: null,
      errorMessage: null,
      createdAt: now,
      sentAt: null,
      deliveredAt: null,
    };
  }

  /**
   * Creates a mock Delivery with Date objects.
   * Used for database responses.
   */
  static createDelivery(overrides?: Partial<Delivery>): Delivery {
    return {
      ...this.defaultDelivery(),
      ...overrides,
    };
  }

  /**
   * Creates a mock Delivery with string dates (ISO format).
   * Used to simulate Redis cached responses where dates are serialized as strings.
   */
  static createDeliveryWithStringDates(
    overrides?: Partial<Delivery>,
  ): Record<string, unknown> {
    const delivery = this.createDelivery(overrides);
    return {
      ...delivery,
      createdAt: delivery.createdAt.toISOString(),
      sentAt: delivery.sentAt?.toISOString() ?? null,
      deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
    };
  }

  /**
   * Creates an array of mock Delivery objects.
   */
  static createDeliveries(
    count: number,
    overrides?: Partial<Delivery>,
  ): Delivery[] {
    return Array.from({ length: count }, (_, index) =>
      this.createDelivery({
        id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
        issueId: index + 1,
        ...overrides,
      }),
    );
  }
}
