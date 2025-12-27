import type { NewsletterSequence } from "~/server/db/schema/newsletterSequence";

/**
 * Factory for creating NewsletterSequence-related test data.
 */
export class NewsletterSequenceFactory {
  private static defaultNewsletterSequence(): NewsletterSequence {
    const now = new Date();
    return {
      id: 1,
      subjectId: 1,
      currentSequence: 1,
      lastSentAt: null,
      createdAt: now,
      updatedAt: null,
    };
  }

  /**
   * Creates a mock NewsletterSequence with Date objects.
   * Used for database responses.
   */
  static createNewsletterSequence(
    overrides?: Partial<NewsletterSequence>,
  ): NewsletterSequence {
    return {
      ...this.defaultNewsletterSequence(),
      ...overrides,
    };
  }

  /**
   * Creates a mock NewsletterSequence with string dates (ISO format).
   * Used to simulate Redis cached responses where dates are serialized as strings.
   */
  static createNewsletterSequenceWithStringDates(
    overrides?: Partial<NewsletterSequence>,
  ): Record<string, unknown> {
    const sequence = this.createNewsletterSequence(overrides);
    return {
      ...sequence,
      lastSentAt: sequence.lastSentAt?.toISOString() ?? null,
      createdAt: sequence.createdAt.toISOString(),
      updatedAt: sequence.updatedAt?.toISOString() ?? null,
    };
  }

  /**
   * Creates an array of mock NewsletterSequence objects.
   */
  static createNewsletterSequences(
    count: number,
    overrides?: Partial<NewsletterSequence>,
  ): NewsletterSequence[] {
    return Array.from({ length: count }, (_, index) =>
      this.createNewsletterSequence({
        id: index + 1,
        subjectId: index + 1,
        currentSequence: index + 1,
        ...overrides,
      }),
    );
  }
}
