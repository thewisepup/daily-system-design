import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { LLMRequest } from "../types";
import {
  type NewsletterResponse,
  NewsletterResponseSchema,
} from "../schemas/newsletter";
import { env } from "~/env";

/**
 * Generates a newsletter using OpenAI with structured output
 */
const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  timeout: 600000 // 10 minutes
});

export async function generateNewsletter(
  request: LLMRequest,
  topicId?: number,
): Promise<NewsletterResponse> {
  const logPrefix = topicId ? `[Topic ${topicId}]` : "[Newsletter Generation]";

  try {
    console.log(
      `${logPrefix} Starting newsletter generation with model: ${request.options?.model ?? "gpt-5"}`,
    );

    console.log(`${logPrefix} LLM Prompt: ${request.prompt}`);

    const startTime = Date.now();

    const completion = await client.responses.parse({
      model: request.options?.model ?? "gpt-5",
      input: request.prompt,
      reasoning: { effort: "high" },
      text: {
        format: zodTextFormat(NewsletterResponseSchema, "event"),
      },
    });

    const duration = Date.now() - startTime;
    console.log(`${logPrefix} LLM request completed in ${duration}ms`);

    if (!completion.output_parsed) {
      console.error(
        `${logPrefix} OpenAI newsletter generation failed: No output received`,
      );
      throw new Error(
        "OpenAI newsletter generation failed: No output received",
      );
    }

    console.log(`${logPrefix} Newsletter content generated successfully`);
    return completion.output_parsed;
  } catch (error) {
    console.error(`${logPrefix} Newsletter generation failed:`, error);
    if (error instanceof Error) {
      throw new Error(`Newsletter generation failed: ${error.message}`);
    }
    throw new Error("Newsletter generation failed with unknown error");
  }
}
