import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { env } from "~/env";

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const TOPIC_MODEL = "gpt-6-sol";
export const NEWSLETTER_MODEL = "gpt-6-astra";
export const DEFAULT_MODEL = NEWSLETTER_MODEL;
const DEFAULT_SCHEMA_NAME = "response";

export interface CompletionRequest<T = string> {
  prompt: string;
  model?: string;
  schema?: z.ZodSchema<T>;
  schemaName?: string;
  systemPrompt?: string;
  reasoning?: { effort: "low" | "medium" | "high" };
}

/**
 * Generates text or validated structured content using the OpenAI Responses API.
 * @param request - Prompt, model, optional system instructions and output schema.
 * @returns Generated text, or JSON parsed and validated against the supplied schema.
 * @throws When the API fails, refuses, returns incomplete/empty output, or violates the schema.
 */
export async function complete<T = string>(
  request: CompletionRequest<T>,
): Promise<T> {
  const { prompt, schema, systemPrompt, reasoning } = request;
  const model = request.model ?? DEFAULT_MODEL;
  const schemaName = request.schemaName ?? DEFAULT_SCHEMA_NAME;
  const startTime = Date.now();
  const logContext: Record<string, unknown> = {
    model,
    structuredOutput: !!schema,
    schemaName: schema ? schemaName : undefined,
    promptLength: prompt.length,
    hasSystemPrompt: !!systemPrompt,
    reasoning,
    status: "pending",
  };

  try {
    const response = await client.responses.create({
      model,
      input: [{ role: "user", content: prompt }],
      instructions: systemPrompt,
      reasoning,
      store: false,
      text: schema ? { format: zodTextFormat(schema, schemaName) } : undefined,
    });

    logContext.responseId = response.id;
    logContext.usage = response.usage;
    if (response.status !== "completed") {
      throw new Error(
        `OpenAI returned ${response.status} response (${response.incomplete_details?.reason ?? response.error?.code ?? "no details"})`,
      );
    }
    const refused = response.output.some(
      (item) =>
        item.type === "message" &&
        item.content.some((content) => content.type === "refusal"),
    );
    if (refused) {
      throw new Error("OpenAI refused the completion request");
    }
    if (!response.output_text?.trim()) {
      throw new Error("OpenAI returned empty response");
    }

    const result = schema
      ? schema.parse(JSON.parse(response.output_text))
      : (response.output_text as T);
    logContext.responseLength = response.output_text.length;
    logContext.status = "success";
    return result;
  } catch (error) {
    logContext.status = "error";
    logContext.errorType = error instanceof z.ZodError ? "validation" : "api";
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      error instanceof z.ZodError
        ? `Schema validation failed for "${schemaName}": ${message}`
        : `OpenAI completion failed (model: ${model}): ${message}`,
      { cause: error },
    );
  } finally {
    logContext.duration = Date.now() - startTime;
    if (logContext.status === "success") {
      console.log("[OpenAI] Completion successful", logContext);
    } else {
      console.error("[OpenAI] Completion failed", logContext);
    }
  }
}
