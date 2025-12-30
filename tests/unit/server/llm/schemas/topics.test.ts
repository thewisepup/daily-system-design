import { z } from "zod";
import {
  TopicResponseSchema,
  TopicsResponseSchema,
} from "~/server/llm/schemas/topics";

describe("TopicResponseSchema", () => {
  const validTopic = {
    sequenceOrder: 1,
    title: "Load Balancing",
    description: "Understanding load balancing in distributed systems",
    learningObjective: "Learn how to distribute traffic across servers",
    exampleFocus: "Round-robin and weighted load balancing",
    commonPitfalls: "Not considering sticky sessions",
  };

  it("validates correct topic object", () => {
    const result = TopicResponseSchema.safeParse(validTopic);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validTopic);
    }
  });

  it("rejects missing required fields", () => {
    const incompleteTopic = {
      sequenceOrder: 1,
      title: "Load Balancing",
    };

    const result = TopicResponseSchema.safeParse(incompleteTopic);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
      const missingFields = result.error.issues.map((issue) => issue.path[0]);
      expect(missingFields).toContain("description");
      expect(missingFields).toContain("learningObjective");
      expect(missingFields).toContain("exampleFocus");
      expect(missingFields).toContain("commonPitfalls");
    }
  });

  it("rejects invalid sequenceOrder (non-positive)", () => {
    const topicWithZeroSequence = { ...validTopic, sequenceOrder: 0 };
    const topicWithNegativeSequence = { ...validTopic, sequenceOrder: -5 };

    const zeroResult = TopicResponseSchema.safeParse(topicWithZeroSequence);
    const negativeResult = TopicResponseSchema.safeParse(
      topicWithNegativeSequence,
    );

    expect(zeroResult.success).toBe(false);
    expect(negativeResult.success).toBe(false);
  });

  it("rejects non-integer sequenceOrder", () => {
    const topicWithFloatSequence = { ...validTopic, sequenceOrder: 1.5 };

    const result = TopicResponseSchema.safeParse(topicWithFloatSequence);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("sequenceOrder");
    }
  });

  it("rejects wrong type for title", () => {
    const topicWithNumberTitle = { ...validTopic, title: 123 };

    const result = TopicResponseSchema.safeParse(topicWithNumberTitle);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("title");
    }
  });

  it("accepts empty strings for text fields", () => {
    const topicWithEmptyStrings = {
      ...validTopic,
      description: "",
      learningObjective: "",
      exampleFocus: "",
      commonPitfalls: "",
    };

    const result = TopicResponseSchema.safeParse(topicWithEmptyStrings);

    expect(result.success).toBe(true);
  });
});

describe("TopicsResponseSchema", () => {
  const validTopic = {
    sequenceOrder: 1,
    title: "Load Balancing",
    description: "Understanding load balancing",
    learningObjective: "Learn load balancing",
    exampleFocus: "Round-robin",
    commonPitfalls: "Sticky sessions",
  };

  it("validates array of topics", () => {
    const validResponse = {
      topics: [
        { ...validTopic, sequenceOrder: 1 },
        { ...validTopic, sequenceOrder: 2, title: "Caching" },
        { ...validTopic, sequenceOrder: 3, title: "Database Sharding" },
      ],
    };

    const result = TopicsResponseSchema.safeParse(validResponse);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.topics).toHaveLength(3);
    }
  });

  it("validates empty topics array", () => {
    const emptyResponse = { topics: [] };

    const result = TopicsResponseSchema.safeParse(emptyResponse);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.topics).toHaveLength(0);
    }
  });

  it("rejects malformed topic in array", () => {
    const responseWithBadTopic = {
      topics: [
        validTopic,
        { sequenceOrder: -1, title: "Bad Topic" }, // Missing fields and invalid sequence
      ],
    };

    const result = TopicsResponseSchema.safeParse(responseWithBadTopic);

    expect(result.success).toBe(false);
  });

  it("rejects missing topics field", () => {
    const responseWithoutTopics = {};

    const result = TopicsResponseSchema.safeParse(responseWithoutTopics);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("topics");
    }
  });

  it("rejects non-array topics field", () => {
    const responseWithObjectTopics = { topics: validTopic };

    const result = TopicsResponseSchema.safeParse(responseWithObjectTopics);

    expect(result.success).toBe(false);
  });

  it("validates single topic in array", () => {
    const singleTopicResponse = { topics: [validTopic] };

    const result = TopicsResponseSchema.safeParse(singleTopicResponse);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.topics).toHaveLength(1);
    }
  });
});
