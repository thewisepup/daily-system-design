import type { Topic } from "~/server/db/schema/topics";

/**
 * Factory for creating Topic-related test data.
 */
export class TopicFactory {
  private static defaultTopic(): Topic {
    const now = new Date();
    return {
      id: 1,
      title: "Test Topic Title",
      topicData: { content: "Test topic data" },
      subjectId: 1,
      sequenceOrder: 1,
      createdAt: now,
    };
  }

  /**
   * Creates a mock Topic with Date objects.
   * Used for database responses.
   */
  static createTopic(overrides?: Partial<Topic>): Topic {
    return {
      ...this.defaultTopic(),
      ...overrides,
    };
  }

  /**
   * Creates a mock Topic with string dates (ISO format).
   * Used to simulate Redis cached responses where dates are serialized as strings.
   */
  static createTopicWithStringDates(
    overrides?: Partial<Topic>,
  ): Record<string, unknown> {
    const topic = this.createTopic(overrides);
    return {
      ...topic,
      createdAt: topic.createdAt.toISOString(),
    };
  }

  /**
   * Creates an array of mock Topic objects.
   */
  static createTopics(count: number, overrides?: Partial<Topic>): Topic[] {
    return Array.from({ length: count }, (_, index) =>
      this.createTopic({
        id: index + 1,
        title: `Test Topic ${index + 1}`,
        sequenceOrder: index + 1,
        ...overrides,
      }),
    );
  }
}
