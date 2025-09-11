import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { LLMRequest } from "../types";
import { type NewsletterResponse, NewsletterResponseSchema } from "../schemas/newsletter";
import { env } from "~/env";

/**
 * Generates a newsletter using OpenAI with structured output
 */
const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function generateNewsletter(
  request: LLMRequest,
): Promise<NewsletterResponse> {
  try {
    const completion = await client.responses.parse({
      model: request.options?.model ?? "gpt-5",
      input: request.prompt,
      reasoning: { effort: "high" },
      text: {
        format: zodTextFormat(NewsletterResponseSchema, "event"),
      },
    });
    
    if (!completion.output_parsed) {
      throw new Error("OpenAI newsletter generation failed: No output received");
    }

    return completion.output_parsed;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Newsletter generation failed: ${error.message}`);
    }
    throw new Error("Newsletter generation failed with unknown error");
  }
}
