import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  complete,
  DEFAULT_MODEL,
  TOPIC_MODEL,
} from "~/server/llm/openaiClient";
import { NewsletterResponseSchema } from "~/server/llm/schemas/newsletter";
import { TopicsResponseSchema } from "~/server/llm/schemas/topics";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("openai", () => ({
  default: vi.fn(() => ({ responses: { create } })),
}));
vi.mock("~/env", () => ({ env: { OPENAI_API_KEY: "test-key" } }));

function response(output_text = "A lesson") {
  return {
    id: "resp_test",
    status: "completed",
    output_text,
    output: [],
    usage: {},
  };
}

describe("openaiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    create.mockResolvedValue(response());
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("uses Astra by default and passes instructions and reasoning through Responses", async () => {
    expect(
      await complete({
        prompt: "Teach caching",
        systemPrompt: "Be precise",
        reasoning: { effort: "high" },
      }),
    ).toBe("A lesson");
    expect(create).toHaveBeenCalledWith({
      model: DEFAULT_MODEL,
      input: [{ role: "user", content: "Teach caching" }],
      instructions: "Be precise",
      reasoning: { effort: "high" },
      store: false,
      text: undefined,
    });
    expect(DEFAULT_MODEL).toBe("gpt-6-astra");
  });

  it("uses the requested Sol model and validates JSON", async () => {
    create.mockResolvedValue(response('{"title":"Caching"}'));
    expect(
      await complete({
        prompt: "Topic",
        model: TOPIC_MODEL,
        schema: z.object({ title: z.string() }),
        schemaName: "topic",
      }),
    ).toEqual({ title: "Caching" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-6-sol",
        text: {
          format: expect.objectContaining({
            type: "json_schema",
            name: "topic",
            strict: true,
          }),
        },
      }),
    );
  });

  it.each([TopicsResponseSchema, NewsletterResponseSchema])(
    "sends a strict schema for the actual generation contracts",
    async (schema) => {
      await complete<unknown>({ prompt: "Generate", schema }).catch(
        () => undefined,
      );
      const format = create.mock.calls[0]![0].text.format;
      expect(format.schema.additionalProperties).toBe(false);
      expect(format.schema.required).toEqual(
        Object.keys(format.schema.properties),
      );
      expect(format.name).toBe("response");
    },
  );

  it("rejects invalid structured content with its schema name and cause", async () => {
    create.mockResolvedValue(response('{"title":12}'));
    await expect(
      complete({
        prompt: "Topic",
        schema: z.object({ title: z.string() }),
        schemaName: "topic",
      }),
    ).rejects.toThrow('Schema validation failed for "topic"');
  });

  it("rejects malformed JSON", async () => {
    create.mockResolvedValue(response("not JSON"));
    await expect(
      complete({ prompt: "Topic", schema: z.object({ title: z.string() }) }),
    ).rejects.toThrow("OpenAI completion failed");
  });

  it.each(["", "   "])("rejects empty output", async (text) => {
    create.mockResolvedValue(response(text));
    await expect(complete({ prompt: "Topic" })).rejects.toThrow(
      "empty response",
    );
  });

  it("rejects incomplete content before parsing or returning it", async () => {
    create.mockResolvedValue({
      ...response("partial lesson"),
      status: "incomplete",
      incomplete_details: { reason: "max_output_tokens" },
    });
    await expect(complete({ prompt: "Topic" })).rejects.toThrow(
      "incomplete response (max_output_tokens)",
    );
  });

  it("rejects refusals even when text accompanies them", async () => {
    create.mockResolvedValue({
      ...response(),
      output: [
        {
          type: "message",
          content: [{ type: "refusal", refusal: "Cannot comply" }],
        },
      ],
    });
    await expect(complete({ prompt: "Topic" })).rejects.toThrow("refused");
  });

  it("preserves API errors as the cause and identifies the model", async () => {
    const error = new Error("Rate limited");
    create.mockRejectedValue(error);
    await expect(
      complete({ prompt: "Topic", model: TOPIC_MODEL }),
    ).rejects.toMatchObject({
      message: "OpenAI completion failed (model: gpt-6-sol): Rate limited",
      cause: error,
    });
  });

  it("logs metadata without prompt or generated content", async () => {
    await complete({ prompt: "private input" });
    const logs = JSON.stringify(vi.mocked(console.log).mock.calls);
    expect(logs).not.toContain("private input");
    expect(logs).not.toContain("A lesson");
    expect(logs).toContain("resp_test");
  });
});
