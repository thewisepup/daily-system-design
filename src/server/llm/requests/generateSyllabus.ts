import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { LLMRequest } from "../types";
import { type TopicsResponse, TopicsResponseSchema } from "../schemas/topics";
import { env } from "~/env";

/**
 * Generates a syllabus using OpenAI with structured output
 */

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  timeout: 600000, // 10 minutes
});

export async function generateSyllabus(
  request: LLMRequest,
): Promise<TopicsResponse> {
  try {
    const completion = await client.responses.parse({
      model: "gpt-5",
      input: request.prompt,
      reasoning: { effort: "high" },
      text: {
        format: zodTextFormat(TopicsResponseSchema, "event"),
      },
    });
    if (!completion.output_parsed) {
      throw new Error("OpenAI syllabus generation failed: No output received");
    }

    return completion.output_parsed;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OpenAI syllabus generation failed: ${error.message}`);
    }
    throw new Error("OpenAI syllabus generation failed with unknown error");
  }
}
