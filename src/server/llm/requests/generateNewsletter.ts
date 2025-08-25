import OpenAI from "openai";
import type { LLMRequest } from "../types";
import { env } from "~/env";

/**
 * Generates a newsletter using OpenAI
 */
const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function generateNewsletter(request: LLMRequest): Promise<string> {
  try {
    const completion = await client.chat.completions.create({
      model: request.options?.model ?? "gpt-5",
      reasoning_effort: "high",
      messages: [
        {
          role: "user",
          content: request.prompt,
        },
      ],
      //TODO: add response format
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error(
        "Failed to generate newsletter content - no content returned",
      );
    }

    return content;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Newsletter generation failed: ${error.message}`);
    }
    throw new Error("Newsletter generation failed with unknown error");
  }
}
