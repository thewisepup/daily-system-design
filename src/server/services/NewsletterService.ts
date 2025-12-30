import { complete } from "../llm/openRouterClient";
import {
  NewsletterResponseSchema,
  type NewsletterResponse,
} from "../llm/schemas/newsletter";

class NewsletterService {
  /**
   * TODO: move @generateNewsletter.ts logic here
   * Generate newsletter content using LLM with structured output
   * @param prompt - The prompt to send to the LLM
   * @param model - Optional model override (default: openai/gpt-4o)
   */
  async generateContent(
    prompt: string,
    model?: string,
  ): Promise<NewsletterResponse> {
    return complete({
      prompt,
      model,
      schema: NewsletterResponseSchema,
      schemaName: "newsletter_response",
    });
  }
}

export const newsletterService = new NewsletterService();

