import type {
  TopicResponse,
  TopicsResponse,
} from "~/server/llm/schemas/topics";

/**
 * Factory for creating LLM TopicsResponse test data.
 * Used for mocking OpenRouter/LLM responses in tests.
 */
export class TopicsResponseFactory {
  private static defaultTopicResponse(): TopicResponse {
    return {
      sequenceOrder: 1,
      title: "Load Balancing",
      description: "Understanding load balancing in distributed systems",
      learningObjective: "Learn how to distribute traffic across servers",
      exampleFocus: "Round-robin and weighted load balancing",
      commonPitfalls: "Not considering sticky sessions",
    };
  }

  /**
   * Creates a single TopicResponse for LLM response testing.
   */
  static createTopicResponse(
    overrides?: Partial<TopicResponse>,
  ): TopicResponse {
    return {
      ...this.defaultTopicResponse(),
      ...overrides,
    };
  }

  /**
   * Creates an array of TopicResponse objects.
   */
  static createTopicResponses(
    count: number,
    overrides?: Partial<TopicResponse>,
  ): TopicResponse[] {
    const titles = [
      "Load Balancing",
      "Caching",
      "Database Sharding",
      "Message Queues",
      "API Gateway",
      "Service Discovery",
      "Rate Limiting",
      "Circuit Breaker",
      "Event Sourcing",
      "CQRS",
    ];

    return Array.from({ length: count }, (_, index) =>
      this.createTopicResponse({
        sequenceOrder: index + 1,
        title: titles[index % titles.length] ?? `Topic ${index + 1}`,
        ...overrides,
      }),
    );
  }

  /**
   * Creates a complete TopicsResponse (LLM response format).
   */
  static createTopicsResponse(
    count = 2,
    overrides?: Partial<TopicResponse>,
  ): TopicsResponse {
    return {
      topics: this.createTopicResponses(count, overrides),
    };
  }

  /**
   * Creates an empty TopicsResponse.
   */
  static createEmptyTopicsResponse(): TopicsResponse {
    return {
      topics: [],
    };
  }
}

