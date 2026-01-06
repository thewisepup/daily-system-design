import { z } from "zod";
import {
  TopicResponseSchema,
  TopicsResponseSchema,
} from "~/server/llm/schemas/topics";
import { TopicsResponseFactory } from "tests/factories/TopicsResponseFactory";

describe("TopicResponseSchema", () => {
  const validTopic = TopicsResponseFactory.createTopicResponse();

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

  it("accepts non-empty strings for text fields", () => {
    const topicWithNonEmptyStrings = {
      ...validTopic,
      description: "A brief description",
      learningObjective: "Learn something important",
      exampleFocus: "Real-world example",
      commonPitfalls: "Common mistake to avoid",
    };

    const result = TopicResponseSchema.safeParse(topicWithNonEmptyStrings);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("A brief description");
      expect(result.data.learningObjective).toBe("Learn something important");
      expect(result.data.exampleFocus).toBe("Real-world example");
      expect(result.data.commonPitfalls).toBe("Common mistake to avoid");
    }
  });

  it("rejects empty strings for text fields", () => {
    const topicWithEmptyStrings = {
      ...validTopic,
      description: "",
      learningObjective: "",
      exampleFocus: "",
      commonPitfalls: "",
    };

    const result = TopicResponseSchema.safeParse(topicWithEmptyStrings);

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorPaths = result.error.issues.map((issue) => issue.path[0]);
      expect(errorPaths).toContain("description");
      expect(errorPaths).toContain("learningObjective");
      expect(errorPaths).toContain("exampleFocus");
      expect(errorPaths).toContain("commonPitfalls");
    }
  });
});

describe("TopicsResponseSchema", () => {
  const validTopic = TopicsResponseFactory.createTopicResponse();

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
