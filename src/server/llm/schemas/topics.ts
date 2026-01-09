import { z } from "zod";

export const TopicResponseSchema = z.object({
  // Anthropic does not support .min() for number types.
  //https://platform.claude.com/docs/en/build-with-claude/structured-outputs#json-schema-limitations
  sequenceOrder: z.number().int(),
  title: z.string(),
  description: z.string().min(1),
  learningObjective: z.string().min(1),
  exampleFocus: z.string().min(1),
  commonPitfalls: z.string().min(1),
});

export const TopicsResponseSchema = z.object({
  topics: z.array(TopicResponseSchema),
});

export type TopicResponse = z.infer<typeof TopicResponseSchema>;
export type TopicsResponse = z.infer<typeof TopicsResponseSchema>;
