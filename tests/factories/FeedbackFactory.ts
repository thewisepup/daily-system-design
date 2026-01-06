import type { Feedback } from "~/server/db/schema/feedback";

/**
 * Factory for creating Feedback-related test data.
 */
export class FeedbackFactory {
  private static defaultFeedback(): Feedback {
    const now = new Date();
    return {
      id: 1,
      userId: "00000000-0000-0000-0000-000000000001",
      issueId: 1,
      feedback: "Test feedback content",
      rating: 4.5,
      createdAt: now,
    };
  }

  /**
   * Creates a mock Feedback with Date objects.
   * Used for database responses.
   */
  static createFeedback(overrides?: Partial<Feedback>): Feedback {
    return {
      ...this.defaultFeedback(),
      ...overrides,
    };
  }

  /**
   * Creates a mock Feedback with string dates (ISO format).
   * Used to simulate Redis cached responses where dates are serialized as strings.
   */
  static createFeedbackWithStringDates(
    overrides?: Partial<Feedback>,
  ): Record<string, unknown> {
    const feedback = this.createFeedback(overrides);
    return {
      ...feedback,
      createdAt: feedback.createdAt.toISOString(),
    };
  }

  /**
   * Creates an array of mock Feedback objects.
   */
  static createFeedbacks(
    count: number,
    overrides?: Partial<Feedback>,
  ): Feedback[] {
    return Array.from({ length: count }, (_, index) =>
      this.createFeedback({
        id: index + 1,
        issueId: index + 1,
        feedback: `Test feedback ${index + 1}`,
        ...overrides,
      }),
    );
  }
}
