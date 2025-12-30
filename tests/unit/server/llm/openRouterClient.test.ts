import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { complete } from "~/server/llm/openRouterClient";

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock("@openrouter/sdk", () => ({
  OpenRouter: vi.fn().mockImplementation(() => ({
    chat: {
      send: mockSend,
    },
  })),
}));

vi.mock("~/env", () => ({
  env: {
    OPEN_ROUTER_API_KEY: "test-api-key",
  },
}));

describe("openRouterClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("complete", () => {
    describe("text responses (no schema)", () => {
      it("returns parsed text content when no schema provided", async () => {
        const expectedContent = "This is the AI response";
        mockSend.mockResolvedValue({
          choices: [{ message: { content: expectedContent } }],
        });

        const result = await complete({ prompt: "Test prompt" });

        expect(result).toBe(expectedContent);
        expect(mockSend).toHaveBeenCalledWith({
          model: "openai/gpt-4o",
          messages: [{ role: "user", content: "Test prompt" }],
          responseFormat: undefined,
          stream: false,
        });
      });

      it("uses custom model when provided", async () => {
        mockSend.mockResolvedValue({
          choices: [{ message: { content: "response" } }],
        });

        await complete({
          prompt: "Test prompt",
          model: "anthropic/claude-3.5-sonnet",
        });

        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            model: "anthropic/claude-3.5-sonnet",
          }),
        );
      });

      it("uses default model when not specified", async () => {
        mockSend.mockResolvedValue({
          choices: [{ message: { content: "response" } }],
        });

        await complete({ prompt: "Test prompt" });

        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            model: "openai/gpt-4o",
          }),
        );
      });
    });

    describe("message building", () => {
      it("correctly builds messages array with system prompt", async () => {
        mockSend.mockResolvedValue({
          choices: [{ message: { content: "response" } }],
        });

        await complete({
          prompt: "User prompt",
          systemPrompt: "You are a helpful assistant",
        });

        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: [
              { role: "system", content: "You are a helpful assistant" },
              { role: "user", content: "User prompt" },
            ],
          }),
        );
      });

      it("correctly builds messages array without system prompt", async () => {
        mockSend.mockResolvedValue({
          choices: [{ message: { content: "response" } }],
        });

        await complete({ prompt: "User prompt only" });

        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: [{ role: "user", content: "User prompt only" }],
          }),
        );
      });
    });

    describe("structured output (with schema)", () => {
      const TestSchema = z.object({
        name: z.string(),
        value: z.number(),
      });

      it("returns validated structured data when schema provided", async () => {
        const jsonResponse = JSON.stringify({ name: "test", value: 42 });
        mockSend.mockResolvedValue({
          choices: [{ message: { content: jsonResponse } }],
        });

        const result = await complete({
          prompt: "Generate data",
          schema: TestSchema,
          schemaName: "test_schema",
        });

        expect(result).toEqual({ name: "test", value: 42 });
      });

      it("passes responseFormat with JSON schema when schema provided", async () => {
        const jsonResponse = JSON.stringify({ name: "test", value: 42 });
        mockSend.mockResolvedValue({
          choices: [{ message: { content: jsonResponse } }],
        });

        await complete({
          prompt: "Generate data",
          schema: TestSchema,
          schemaName: "custom_name",
        });

        const expectedJsonSchema = zodToJsonSchema(TestSchema, {
          $refStrategy: "none",
        });

        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            responseFormat: expect.objectContaining({
              type: "json_schema",
              jsonSchema: {
                name: "custom_name",
                schema: expectedJsonSchema,
              },
            }),
          }),
        );
      });

      it("uses default schemaName when not provided", async () => {
        const jsonResponse = JSON.stringify({ name: "test", value: 42 });
        mockSend.mockResolvedValue({
          choices: [{ message: { content: jsonResponse } }],
        });

        await complete({
          prompt: "Generate data",
          schema: TestSchema,
        });

        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            responseFormat: expect.objectContaining({
              jsonSchema: expect.objectContaining({
                name: "response",
              }),
            }),
          }),
        );
      });

      it("throws ZodError when response fails schema validation", async () => {
        const invalidJsonResponse = JSON.stringify({
          name: "test",
          value: "not a number",
        });
        mockSend.mockResolvedValue({
          choices: [{ message: { content: invalidJsonResponse } }],
        });

        await expect(
          complete({
            prompt: "Generate data",
            schema: TestSchema,
          }),
        ).rejects.toThrow(z.ZodError);
      });
    });

    describe("error handling", () => {
      it("throws error on empty response from OpenRouter", async () => {
        mockSend.mockResolvedValue({
          choices: [{ message: { content: null } }],
        });

        await expect(complete({ prompt: "Test prompt" })).rejects.toThrow(
          "OpenRouter returned empty response",
        );
      });

      it("throws error when choices array is empty", async () => {
        mockSend.mockResolvedValue({
          choices: [],
        });

        await expect(complete({ prompt: "Test prompt" })).rejects.toThrow(
          "OpenRouter returned empty response",
        );
      });

      it("throws error when message is undefined", async () => {
        mockSend.mockResolvedValue({
          choices: [{ message: undefined }],
        });

        await expect(complete({ prompt: "Test prompt" })).rejects.toThrow(
          "OpenRouter returned empty response",
        );
      });
    });

    describe("content array handling", () => {
      it("extracts text from content array format", async () => {
        mockSend.mockResolvedValue({
          choices: [
            {
              message: {
                content: [
                  { type: "text", text: "First part " },
                  { type: "text", text: "Second part" },
                ],
              },
            },
          ],
        });

        const result = await complete({ prompt: "Test prompt" });

        expect(result).toBe("First part Second part");
      });

      it("filters out non-text content items", async () => {
        mockSend.mockResolvedValue({
          choices: [
            {
              message: {
                content: [
                  { type: "text", text: "Text content" },
                  { type: "image", url: "http://example.com/image.png" },
                ],
              },
            },
          ],
        });

        const result = await complete({ prompt: "Test prompt" });

        expect(result).toBe("Text content");
      });
    });
  });
});
