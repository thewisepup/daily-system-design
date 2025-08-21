import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { LLMRequest } from "../types";
import { type TopicsResponse, TopicsResponseSchema } from "../schemas/topics";
import { env } from "~/env";

/**
 * Generates a syllabus using OpenAI with structured output
 */

const client = new OpenAI({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  apiKey: env.OPENAI_API_KEY,
});

export async function generateSyllabus(
  request: LLMRequest,
): Promise<TopicsResponse> {
  try {
    const completion = await client.chat.completions.parse({
      model: request.options?.model ?? "gpt-4o-2024-08-06",
      messages: [
        {
          role: "user",
          content: request.prompt,
        },
      ],
      response_format: zodResponseFormat(
        TopicsResponseSchema,
        "topics_response",
      ),
    });

    const message = completion.choices[0]?.message;
    if (!message?.parsed) {
      throw new Error(
        "Failed to parse OpenAI response - no parsed content available",
      );
    }

    return message.parsed;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OpenAI syllabus generation failed: ${error.message}`);
    }
    throw new Error("OpenAI syllabus generation failed with unknown error");
  }
}
