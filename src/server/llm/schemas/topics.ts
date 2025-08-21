import { z } from "zod";

// Zod schema for individual topic validation
export const TopicResponseSchema = z.object({
  sequenceOrder: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
});

// Zod schema for array of topics response
export const TopicsResponseSchema = z.object({
  topics: z.array(TopicResponseSchema),
});

// TypeScript types inferred from schemas
export type TopicResponse = z.infer<typeof TopicResponseSchema>;
export type TopicsResponse = z.infer<typeof TopicsResponseSchema>;
