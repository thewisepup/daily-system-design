import type { transactionalEmails } from "~/server/db/schema/transactionalEmails";

type TransactionalEmail = typeof transactionalEmails.$inferSelect;

/**
 * Factory for creating TransactionalEmail-related test data.
 */
export class TransactionalEmailFactory {
  private static defaultTransactionalEmail(): TransactionalEmail {
    const now = new Date();
    return {
      id: "00000000-0000-0000-0000-000000000001",
      userId: "00000000-0000-0000-0000-000000000001",
      emailType: "welcome",
      campaignId: null,
      status: "pending",
      externalId: null,
      errorMessage: null,
      createdAt: now,
      sentAt: null,
      deliveredAt: null,
    };
  }

  /**
   * Creates a mock TransactionalEmail with Date objects.
   * Used for database responses.
   */
  static createTransactionalEmail(
    overrides?: Partial<TransactionalEmail>,
  ): TransactionalEmail {
    return {
      ...this.defaultTransactionalEmail(),
      ...overrides,
    };
  }

  /**
   * Creates a mock TransactionalEmail with string dates (ISO format).
   * Used to simulate Redis cached responses where dates are serialized as strings.
   */
  static createTransactionalEmailWithStringDates(
    overrides?: Partial<TransactionalEmail>,
  ): Record<string, unknown> {
    const email = this.createTransactionalEmail(overrides);
    return {
      ...email,
      createdAt: email.createdAt.toISOString(),
      sentAt: email.sentAt?.toISOString() ?? null,
      deliveredAt: email.deliveredAt?.toISOString() ?? null,
    };
  }

  /**
   * Creates an array of mock TransactionalEmail objects.
   */
  static createTransactionalEmails(
    count: number,
    overrides?: Partial<TransactionalEmail>,
  ): TransactionalEmail[] {
    return Array.from({ length: count }, (_, index) =>
      this.createTransactionalEmail({
        id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
        ...overrides,
      }),
    );
  }
}
