import { OpenRouter } from "@openrouter/sdk";
import type { Reasoning } from "@openrouter/sdk/models";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { env } from "~/env";

const client = new OpenRouter({
  apiKey: env.OPEN_ROUTER_API_KEY,
});

export const DEFAULT_MODEL = "anthropic/claude-opus-4.5";
const DEFAULT_SCHEMA_NAME = "response";

/**
 * Configuration for an OpenRouter completion request.
 * @template T - The expected response type when using structured outputs
 */
export interface CompletionRequest<T = string> {
  /** The user prompt to send to the model */
  prompt: string;
  /** OpenRouter model identifier (e.g., `openai/gpt-5.2`, `anthropic/claude-4.5-sonnet`) */
  model?: string;
  /** Zod schema for structured output - enables JSON Schema mode when provided */
  schema?: z.ZodSchema<T>;
  /** Name for the JSON schema in the API request */
  schemaName?: string;
  /** System prompt to set model behavior and context */
  systemPrompt?: string;
  /** Reasoning configuration for models that support chain-of-thought reasoning */
  reasoning?: Reasoning;
}

export async function complete<T = string>(
  request: CompletionRequest<T>,
): Promise<T> {
  const { prompt, model, schema, schemaName, systemPrompt } = request;
  const selectedModel = model ?? DEFAULT_MODEL;

  const logContext: Record<string, unknown> = {
    prompt: prompt,
    model: selectedModel,
    structuredOutput: !!schema,
    schemaName,
    reasoning: request.reasoning,
    promptLength: prompt.length,
    hasSystemPrompt: !!systemPrompt,
    status: "pending",
    startTime: Date.now(),
  };

  try {
    const response = await client.chat.send({
      model: selectedModel,
      messages: buildMessages(prompt, systemPrompt),
      responseFormat: buildResponseFormat(schema, schemaName),
      stream: false,
      reasoning: request.reasoning,
    });

    const result = extractResultFromResponse(
      response,
      schema,
      schemaName,
      logContext,
    );

    logContext.status = "success";
    return result;
  } catch (error) {
    handleCompleteError(error, request, logContext);
  } finally {
    logCompleteContext(logContext);
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
        schema: Record<string, unknown>;
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
      schema: zodToJsonSchema(schema, {
        $refStrategy: "none",
      }) as Record<string, unknown>,
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
): asserts content is string | Array<{ type: string; text?: string }> {
  if (!content) {
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
): T {
  return schema.parse(JSON.parse(textContent));
}

/**
 * Extracts and parses the result from OpenRouter response.
 * Updates log context with response metadata.
 * @throws {Error} When response content is empty or invalid
 * @throws {z.ZodError} When schema validation fails
 */
function extractResultFromResponse<T>(
  response: {
    id: string;
    usage?: unknown;
    choices: Array<{
      message?: {
        content?: string | Array<{ type: string; text?: string }> | null;
      };
    }>;
  },
  schema: z.ZodSchema<T> | undefined,
  schemaName: string | undefined,
  logContext: Record<string, unknown>,
): T {
  const content = response.choices[0]?.message?.content;

  logContext.responseId = response.id;
  logContext.usage = response.usage;

  validateResponseContent(content);

  const textContent = extractTextContent(content);
  logContext.responseLength = textContent.length;

  if (schema) {
    const result = parseStructuredResponse(textContent, schema);
    logContext.responseType = "structured";
    logContext.schemaName = schemaName ?? DEFAULT_SCHEMA_NAME;
    return result;
  }

  logContext.responseType = "text";
  return textContent as T;
}

/**
 * Handles errors from OpenRouter completion requests.
 * Updates log context and throws enhanced error with request context.
 * @throws {Error} Enhanced error with context
 */
function handleCompleteError(
  error: unknown,
  request: CompletionRequest<unknown>,
  logContext: Record<string, unknown>,
): never {
  logContext.status = "error";
  logContext.error = error instanceof Error ? error.message : String(error);
  logContext.errorType = error instanceof z.ZodError ? "validation" : "api";

  if (error instanceof z.ZodError) {
    const enhancedError = new Error(
      `Schema validation failed for "${request.schemaName ?? DEFAULT_SCHEMA_NAME}": ${error.message}`,
    );
    enhancedError.cause = error;
    throw enhancedError;
  }

  if (error instanceof Error) {
    const enhancedError = new Error(
      `OpenRouter completion failed (model: ${request.model ?? DEFAULT_MODEL}): ${error.message}`,
    );
    enhancedError.cause = error;
    throw enhancedError;
  }

  throw new Error(`OpenRouter completion failed: ${String(error)}`);
}

function logCompleteContext(logContext: Record<string, unknown>): void {
  logContext.duration = Date.now() - (logContext.startTime as number);
  if (logContext.status === "success") {
    console.log(
      `[OpenRouter] Completion successful (${logContext.duration}ms)`,
      logContext,
    );
  } else {
    console.error(
      `[OpenRouter] Completion failed (${logContext.duration}ms)`,
      logContext,
    );
  }
}
