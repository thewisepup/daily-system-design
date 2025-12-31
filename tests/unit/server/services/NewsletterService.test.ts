import { Effort } from "@openrouter/sdk/models";
import { newsletterService } from "~/server/services/NewsletterService";
import { topicRepo } from "~/server/db/repo/topicRepo";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { complete } from "~/server/llm/openRouterClient";
import { convertContentJsonToHtml } from "~/server/email/templates/newsletterTemplate";
import {
  TopicFactory,
  IssueFactory,
  TopicsResponseFactory,
} from "~/test/factories";

import type { NewsletterResponse } from "~/server/llm/schemas/newsletter";

vi.mock("~/server/db/repo/topicRepo", () => ({
  topicRepo: {
    findById: vi.fn(),
  },
}));

vi.mock("~/server/db/repo/issueRepo", () => ({
  issueRepo: {
    findByTopicId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("~/server/llm/openRouterClient", () => ({
  complete: vi.fn(),
}));

vi.mock("~/server/email/templates/newsletterTemplate", () => ({
  convertContentJsonToHtml: vi.fn(),
}));

const mockedTopicRepo = vi.mocked(topicRepo);
const mockedIssueRepo = vi.mocked(issueRepo);
const mockedComplete = vi.mocked(complete);
const mockedConvertContentJsonToHtml = vi.mocked(convertContentJsonToHtml);

/**
 * Creates a valid TopicResponse object for topicData field
 */
function createValidTopicData() {
  return TopicsResponseFactory.createTopicResponse({
    sequenceOrder: 1,
    title: "Load Balancing",
    description: "Understanding load balancing in distributed systems",
    learningObjective: "Learn how to distribute traffic across servers",
    exampleFocus: "Round-robin and weighted load balancing",
    commonPitfalls: "Not considering sticky sessions",
  });
}

/**
 * Creates a mock NewsletterResponse matching the schema
 */
function createMockNewsletterResponse(): NewsletterResponse {
  return {
    introduction: {
      headline: "Introduction to Load Balancing",
      content: "Load balancing is a critical concept...",
    },
    concept: {
      headline: "Core Concepts",
      content: "At its core, load balancing distributes...",
    },
    tradeoffs: {
      headline: "Trade-offs",
      content: "When implementing load balancing...",
    },
    applications: {
      headline: "Real-World Applications",
      content: "Load balancing is used in...",
    },
    example: {
      headline: "Example Implementation",
      content: "Consider a web application...",
    },
    commonPitfalls: {
      headline: "Common Pitfalls",
      content: "Teams often overlook...",
    },
    keyTakeaways: {
      headline: "Key Takeaways",
      bullets: [
        "Load balancing distributes traffic",
        "Multiple algorithms exist",
        "Health checks are essential",
      ],
      closingSentence: "Start with simple strategies and evolve.",
    },
  };
}

describe("NewsletterService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateNewsletterForTopic", () => {
    const topicId = 1;
    const mockTopic = TopicFactory.createTopic({
      id: topicId,
      title: "Load Balancing",
      topicData: createValidTopicData(),
    });
    const mockIssue = IssueFactory.createIssue({
      id: 1,
      topicId,
      title: mockTopic.title,
      status: "generating",
    });
    const mockNewsletterResponse = createMockNewsletterResponse();
    const mockRawHtml = "<html>Generated newsletter content</html>";

    const setupSuccessMocks = () => {
      mockedTopicRepo.findById.mockResolvedValue(mockTopic);
      mockedIssueRepo.findByTopicId.mockResolvedValue(undefined);
      mockedIssueRepo.create.mockResolvedValue(mockIssue);
      mockedComplete.mockResolvedValue(mockNewsletterResponse);
      mockedConvertContentJsonToHtml.mockReturnValue(mockRawHtml);
      mockedIssueRepo.update.mockResolvedValue({
        ...mockIssue,
        contentJson: mockNewsletterResponse,
        rawHtml: mockRawHtml,
        status: "draft",
      });
    };

    describe("success cases", () => {
      it("generates newsletter, saves to database with draft status, and returns issueId", async () => {
        setupSuccessMocks();

        const result =
          await newsletterService.generateNewsletterForTopic(topicId);

        expect(result).toEqual({ success: true, issueId: mockIssue.id });
        expect(mockedIssueRepo.update).toHaveBeenCalledWith(mockIssue.id, {
          contentJson: mockNewsletterResponse,
          rawHtml: mockRawHtml,
          status: "draft",
        });
        expect(mockedComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: expect.any(String),
            schema: expect.any(Object),
            schemaName: "newsletter_response",
            reasoning: { effort: Effort.Medium },
          }),
        );
      });
    });

    describe("validation errors", () => {
      it("throws when topic does not exist", async () => {
        mockedTopicRepo.findById.mockResolvedValue(null);

        await expect(
          newsletterService.generateNewsletterForTopic(topicId),
        ).rejects.toThrow(`Topic with ID ${topicId} does not exist`);

        expect(mockedIssueRepo.findByTopicId).not.toHaveBeenCalled();
        expect(mockedIssueRepo.create).not.toHaveBeenCalled();
      });

      it("throws when newsletter already exists for topic", async () => {
        const existingIssue = IssueFactory.createIssue({
          id: 99,
          topicId,
          status: "draft",
        });
        mockedTopicRepo.findById.mockResolvedValue(mockTopic);
        mockedIssueRepo.findByTopicId.mockResolvedValue(existingIssue);

        await expect(
          newsletterService.generateNewsletterForTopic(topicId),
        ).rejects.toThrow(
          `Newsletter already exists for topic ${topicId} (Issue ID: 99, Status: draft)`,
        );

        expect(mockedIssueRepo.create).not.toHaveBeenCalled();
      });

      it("throws when topicData is null", async () => {
        const topicWithNullData = TopicFactory.createTopic({
          id: topicId,
          topicData: null,
        });
        mockedTopicRepo.findById.mockResolvedValue(topicWithNullData);
        mockedIssueRepo.findByTopicId.mockResolvedValue(undefined);
        mockedIssueRepo.create.mockResolvedValue(mockIssue);
        mockedIssueRepo.update.mockResolvedValue({
          ...mockIssue,
          status: "failed",
        });

        await expect(
          newsletterService.generateNewsletterForTopic(topicId),
        ).rejects.toThrow();

        expect(mockedIssueRepo.update).toHaveBeenCalledWith(mockIssue.id, {
          status: "failed",
        });
      });

      it("throws when topicData fails Zod schema validation", async () => {
        const topicWithInvalidData = TopicFactory.createTopic({
          id: topicId,
          topicData: { invalidField: "bad data" },
        });
        mockedTopicRepo.findById.mockResolvedValue(topicWithInvalidData);
        mockedIssueRepo.findByTopicId.mockResolvedValue(undefined);
        mockedIssueRepo.create.mockResolvedValue(mockIssue);
        mockedIssueRepo.update.mockResolvedValue({
          ...mockIssue,
          status: "failed",
        });

        await expect(
          newsletterService.generateNewsletterForTopic(topicId),
        ).rejects.toThrow();

        expect(mockedIssueRepo.update).toHaveBeenCalledWith(mockIssue.id, {
          status: "failed",
        });
      });
    });

    describe("database errors", () => {
      it("throws when issue creation fails in database", async () => {
        mockedTopicRepo.findById.mockResolvedValue(mockTopic);
        mockedIssueRepo.findByTopicId.mockResolvedValue(undefined);
        mockedIssueRepo.create.mockResolvedValue(undefined);

        await expect(
          newsletterService.generateNewsletterForTopic(topicId),
        ).rejects.toThrow("Failed to create newsletter issue in database");

        expect(mockedComplete).not.toHaveBeenCalled();
      });

      it("throws and marks issue as failed when content update fails", async () => {
        mockedTopicRepo.findById.mockResolvedValue(mockTopic);
        mockedIssueRepo.findByTopicId.mockResolvedValue(undefined);
        mockedIssueRepo.create.mockResolvedValue(mockIssue);
        mockedComplete.mockResolvedValue(mockNewsletterResponse);
        mockedConvertContentJsonToHtml.mockReturnValue(mockRawHtml);
        mockedIssueRepo.update
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce({ ...mockIssue, status: "failed" });

        await expect(
          newsletterService.generateNewsletterForTopic(topicId),
        ).rejects.toThrow(
          "Failed to update newsletter issue with generated content",
        );

        expect(mockedIssueRepo.update).toHaveBeenNthCalledWith(
          1,
          mockIssue.id,
          expect.objectContaining({
            contentJson: mockNewsletterResponse,
            rawHtml: mockRawHtml,
            status: "draft",
          }),
        );
        expect(mockedIssueRepo.update).toHaveBeenNthCalledWith(
          2,
          mockIssue.id,
          { status: "failed" },
        );
      });

      it("throws original error when status update also fails", async () => {
        const originalError = new Error("LLM generation failed");
        mockedTopicRepo.findById.mockResolvedValue(mockTopic);
        mockedIssueRepo.findByTopicId.mockResolvedValue(undefined);
        mockedIssueRepo.create.mockResolvedValue(mockIssue);
        mockedComplete.mockRejectedValue(originalError);
        mockedIssueRepo.update.mockRejectedValue(
          new Error("Database connection lost"),
        );

        await expect(
          newsletterService.generateNewsletterForTopic(topicId),
        ).rejects.toThrow("LLM generation failed");
      });
    });

    describe("LLM and generation errors", () => {
      it("marks issue as failed when LLM generation fails", async () => {
        mockedTopicRepo.findById.mockResolvedValue(mockTopic);
        mockedIssueRepo.findByTopicId.mockResolvedValue(undefined);
        mockedIssueRepo.create.mockResolvedValue(mockIssue);
        mockedComplete.mockRejectedValue(new Error("LLM request failed"));
        mockedIssueRepo.update.mockResolvedValue({
          ...mockIssue,
          status: "failed",
        });

        await expect(
          newsletterService.generateNewsletterForTopic(topicId),
        ).rejects.toThrow("LLM request failed");

        expect(mockedIssueRepo.update).toHaveBeenCalledWith(mockIssue.id, {
          status: "failed",
        });
      });

      it("marks issue as failed when HTML conversion throws", async () => {
        mockedTopicRepo.findById.mockResolvedValue(mockTopic);
        mockedIssueRepo.findByTopicId.mockResolvedValue(undefined);
        mockedIssueRepo.create.mockResolvedValue(mockIssue);
        mockedComplete.mockResolvedValue(mockNewsletterResponse);
        mockedConvertContentJsonToHtml.mockImplementation(() => {
          throw new Error("HTML template error");
        });
        mockedIssueRepo.update.mockResolvedValue({
          ...mockIssue,
          status: "failed",
        });

        await expect(
          newsletterService.generateNewsletterForTopic(topicId),
        ).rejects.toThrow("HTML template error");

        expect(mockedIssueRepo.update).toHaveBeenCalledWith(mockIssue.id, {
          status: "failed",
        });
      });

      it("marks issue as failed when LLM returns null response", async () => {
        mockedTopicRepo.findById.mockResolvedValue(mockTopic);
        mockedIssueRepo.findByTopicId.mockResolvedValue(undefined);
        mockedIssueRepo.create.mockResolvedValue(mockIssue);
        mockedComplete.mockResolvedValue(null as unknown as NewsletterResponse);
        mockedConvertContentJsonToHtml.mockImplementation(() => {
          throw new Error("Cannot convert null to HTML");
        });
        mockedIssueRepo.update.mockResolvedValue({
          ...mockIssue,
          status: "failed",
        });

        await expect(
          newsletterService.generateNewsletterForTopic(topicId),
        ).rejects.toThrow();

        expect(mockedIssueRepo.update).toHaveBeenCalledWith(mockIssue.id, {
          status: "failed",
        });
      });
    });
  });
});
