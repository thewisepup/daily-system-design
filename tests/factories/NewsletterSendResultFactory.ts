import type { NewsletterSendResult } from "~/server/db/schema/newsletterSendResults";

/**
 * Factory for creating NewsletterSendResult-related test data.
 */
export class NewsletterSendResultFactory {
  private static defaultNewsletterSendResult(): NewsletterSendResult {
    const now = new Date();
    return {
      id: 1,
      name: "System Design Issue #1",
      issueId: 1,
      totalSent: 100,
      totalFailed: 0,
      failedUserIds: [],
      startTime: now,
      completionTime: now,
      createdAt: now,
    };
  }

  /**
   * Creates a mock NewsletterSendResult with Date objects.
   * Used for database responses.
   */
  static createNewsletterSendResult(
    overrides?: Partial<NewsletterSendResult>,
  ): NewsletterSendResult {
    return {
      ...this.defaultNewsletterSendResult(),
      ...overrides,
    };
  }

  /**
   * Creates a mock NewsletterSendResult with string dates (ISO format).
   * Used to simulate Redis cached responses where dates are serialized as strings.
   */
  static createNewsletterSendResultWithStringDates(
    overrides?: Partial<NewsletterSendResult>,
  ): Record<string, unknown> {
    const result = this.createNewsletterSendResult(overrides);
    return {
      ...result,
      startTime: result.startTime.toISOString(),
      completionTime: result.completionTime?.toISOString() ?? null,
      createdAt: result.createdAt.toISOString(),
    };
  }

  /**
   * Creates an array of mock NewsletterSendResult objects.
   */
  static createNewsletterSendResults(
    count: number,
    overrides?: Partial<NewsletterSendResult>,
  ): NewsletterSendResult[] {
    return Array.from({ length: count }, (_, index) =>
      this.createNewsletterSendResult({
        id: index + 1,
        name: `System Design Issue #${index + 1}`,
        issueId: index + 1,
        ...overrides,
      }),
    );
  }
}
