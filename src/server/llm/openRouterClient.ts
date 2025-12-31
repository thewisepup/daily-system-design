import { OpenRouter } from "@openrouter/sdk";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { env } from "~/env";

const client = new OpenRouter({
  apiKey: env.OPEN_ROUTER_API_KEY,
});

const DEFAULT_MODEL = "openai/gpt-5.2";
const DEFAULT_SCHEMA_NAME = "response";

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

export async function complete<T = string>(
  request: CompletionRequest<T>,
): Promise<T> {
  const startTime = Date.now();
  const { prompt, model, schema, schemaName, systemPrompt } = request;
  const selectedModel = model ?? DEFAULT_MODEL;

  console.log(`[OpenRouter] Starting completion request`, {
    model: selectedModel,
    structuredOutput: !!schema,
    schemaName,
    promptLength: prompt.length,
    hasSystemPrompt: !!systemPrompt,
  });

  try {
    const response = await client.chat.send({
      model: selectedModel,
      messages: buildMessages(prompt, systemPrompt),
      responseFormat: buildResponseFormat(schema, schemaName),
      stream: false,
    });

    const duration = Date.now() - startTime;
    const content = response.choices[0]?.message?.content;
    const usage = response.usage;

    validateResponseContent(
      content,
      selectedModel,
      duration,
      response.id,
      usage,
    );

    const textContent = extractTextContent(content);

    if (schema) {
      return parseStructuredResponse(
        textContent,
        schema,
        selectedModel,
        duration,
        schemaName,
        usage,
      );
    }

    return handleTextResponse(textContent, selectedModel, duration, usage);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[OpenRouter] Completion failed after ${duration}ms`, {
      model: selectedModel,
      structuredOutput: !!schema,
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new Error(`OpenRouter completion failed: ${error.message}`, {
        cause: error,
      });
    }
    throw error;
  }
}

/**
 * Builds the messages array for OpenRouter API request.
 */
function buildMessages(
  prompt: string,
  systemPrompt?: string,
): Array<{ role: "system" | "user"; content: string }> {
  const messages: Array<{ role: "system" | "user"; content: string }> = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  return messages;
}

/**
 * Builds the response format configuration for structured outputs.
 */
function buildResponseFormat<T>(
  schema?: z.ZodSchema<T>,
  schemaName?: string,
):
  | {
      type: "json_schema";
      jsonSchema: {
        name: string;
        schema: { [k: string]: any };
      };
    }
  | undefined {
  if (!schema) {
    return undefined;
  }

  return {
    type: "json_schema",
    jsonSchema: {
      name: schemaName ?? DEFAULT_SCHEMA_NAME,
      schema: zodToJsonSchema(schema, { $refStrategy: "none" }) as {
        [k: string]: any;
      },
    },
  };
}

/**
 * Extracts text content from OpenRouter response.
 * Handles both string and array content formats.
 */
function extractTextContent(
  content: string | Array<{ type: string; text?: string }>,
): string {
  if (typeof content === "string") {
    return content;
  }

  return content
    .filter((item) => item.type === "text")
    .map((item) => item.text ?? "")
    .join("");
}

/**
 * Validates response content is not empty.
 * @throws {Error} When content is empty
 */
function validateResponseContent(
  content: unknown,
  model: string,
  duration: number,
  responseId?: string,
  usage?: unknown,
): asserts content is string | Array<{ type: string; text?: string }> {
  if (!content) {
    console.error(`[OpenRouter] Empty response received after ${duration}ms`, {
      model,
      responseId,
      usage,
    });
    throw new Error("OpenRouter returned empty response");
  }
}

/**
 * Parses and validates structured response against Zod schema.
 * @throws {z.ZodError} When schema validation fails
 */
function parseStructuredResponse<T>(
  textContent: string,
  schema: z.ZodSchema<T>,
  model: string,
  duration: number,
  schemaName?: string,
  usage?: unknown,
): T {
  try {
    const parsed = schema.parse(JSON.parse(textContent));

    console.log(`[OpenRouter] Completion successful (${duration}ms)`, {
      model,
      responseType: "structured",
      schemaName: schemaName ?? DEFAULT_SCHEMA_NAME,
      responseLength: textContent.length,
      usage,
    });

    return parsed;
  } catch (parseError) {
    console.error(`[OpenRouter] Schema validation failed after ${duration}ms`, {
      model,
      schemaName: schemaName ?? DEFAULT_SCHEMA_NAME,
      error:
        parseError instanceof Error ? parseError.message : String(parseError),
      usage,
    });
    throw parseError;
  }
}

/**
 * Handles text-only response (no schema validation).
 */
function handleTextResponse<T>(
  textContent: string,
  model: string,
  duration: number,
  usage?: unknown,
): T {
  console.log(`[OpenRouter] Completion successful (${duration}ms)`, {
    model,
    responseType: "text",
    responseLength: textContent.length,
    usage,
  });

  return textContent as T;
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
