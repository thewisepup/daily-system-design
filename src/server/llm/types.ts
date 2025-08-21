import { type z } from "zod";

export interface LLMOptions<T = unknown> {
  model?: string;
  maxTokens?: number;
  outputSchema?: z.ZodSchema<T>;
  temperature?: number;
}

export interface LLMResponse<T = unknown> {
  text: string;
  parsed?: T;
  raw?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMRequest {
  prompt: string;
  options?: LLMOptions;
}
