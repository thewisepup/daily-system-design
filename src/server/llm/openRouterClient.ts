import { OpenRouter } from "@openrouter/sdk";
import { type z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { env } from "~/env";

const client = new OpenRouter({
  apiKey: env.OPEN_ROUTER_API_KEY,
});

const DEFAULT_MODEL = "openai/gpt-4o";

/**
 * Configuration for an OpenRouter completion request.
 * @template T - The expected response type when using structured outputs
 */
export interface CompletionRequest<T = string> {
  /** The user prompt to send to the model */
  prompt: string;
  /** OpenRouter model identifier (e.g., `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`) */
  model?: string;
  /** Zod schema for structured output - enables JSON Schema mode when provided */
  schema?: z.ZodSchema<T>;
  /** Name for the JSON schema in the API request */
  schemaName?: string;
  /** System prompt to set model behavior and context */
  systemPrompt?: string;
}

/**
 * Sends a completion request to OpenRouter with optional structured output support.
 *
 * @template T - The expected return type. Defaults to `string` when no schema is provided.
 *
 * @param request - The completion request configuration
 * @param request.prompt - The user prompt to send to the model
 * @param request.model - OpenRouter model identifier (default: `openai/gpt-4o`)
 * @param request.schema - Optional Zod schema for structured output validation
 * @param request.schemaName - Name for the JSON schema (default: `response`)
 * @param request.systemPrompt - Optional system prompt to prepend to messages
 *
 * @returns Parsed and validated response of type `T` when schema is provided,
 *          otherwise raw string content
 *
 * @throws {Error} When OpenRouter returns an empty response
 * @throws {z.ZodError} When response fails schema validation
 *
 * @example
 * // Structured output with Zod schema
 * const topics = await complete({
 *   prompt: "Generate 5 system design topics",
 *   schema: TopicsResponseSchema,
 *   schemaName: "topics_response",
 * });
 *
 * @example
 * // Raw text output
 * const summary = await complete({ prompt: "Summarize this article" });
 */
export async function complete<T = string>(
  request: CompletionRequest<T>,
): Promise<T> {
  const { prompt, model, schema, schemaName, systemPrompt } = request;

  const messages = [
    ...(systemPrompt
      ? [{ role: "system" as const, content: systemPrompt }]
      : []),
    { role: "user" as const, content: prompt },
  ];

  const responseFormat = schema
    ? {
        type: "json_schema" as const,
        jsonSchema: {
          name: schemaName ?? "response",
          schema: zodToJsonSchema(schema, { $refStrategy: "none" }),
        },
      }
    : undefined;

  const response = await client.chat.send({
    model: model ?? DEFAULT_MODEL,
    messages,
    responseFormat,
    stream: false,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned empty response");
  }

  const textContent =
    typeof content === "string"
      ? content
      : content
          .filter((item) => item.type === "text")
          .map((item) => (item as { type: "text"; text: string }).text)
          .join("");

  if (schema) {
    return schema.parse(JSON.parse(textContent));
  }

  return textContent as T;
}
