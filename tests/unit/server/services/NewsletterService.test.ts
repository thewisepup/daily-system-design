import { Effort } from "@openrouter/sdk/models";
import { newsletterService } from "~/server/services/NewsletterService";
import { topicRepo } from "~/server/db/repo/topicRepo";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { complete } from "~/server/llm/openRouterClient";
import { convertContentJsonToHtml } from "~/server/email/templates/newsletterTemplate";
import { TopicFactory, IssueFactory } from "~/test/factories";
import { TopicsResponseFactory } from "~/test/factories";
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
      mockedIssueRepo.findByTopicId.mockResolvedValue(null);
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

    describe("happy path", () => {
      it("successfully generates newsletter and returns success with issueId", async () => {
        setupSuccessMocks();

        const result =
          await newsletterService.generateNewsletterForTopic(topicId);

        expect(result).toEqual({ success: true, issueId: mockIssue.id });
      });
    });

    describe("error cases", () => {
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

      it("throws when issue creation fails in database", async () => {
        mockedTopicRepo.findById.mockResolvedValue(mockTopic);
        mockedIssueRepo.findByTopicId.mockResolvedValue(null);
        mockedIssueRepo.create.mockResolvedValue(null);

        await expect(
          newsletterService.generateNewsletterForTopic(topicId),
        ).rejects.toThrow("Failed to create newsletter issue in database");

        expect(mockedComplete).not.toHaveBeenCalled();
      });

      it("throws when Zod validation fails on invalid topicData", async () => {
        const topicWithInvalidData = TopicFactory.createTopic({
          id: topicId,
          topicData: { invalidField: "bad data" }, // Missing required fields
        });
        mockedTopicRepo.findById.mockResolvedValue(topicWithInvalidData);
        mockedIssueRepo.findByTopicId.mockResolvedValue(null);
        mockedIssueRepo.create.mockResolvedValue(mockIssue);

        await expect(
          newsletterService.generateNewsletterForTopic(topicId),
        ).rejects.toThrow();

        expect(mockedIssueRepo.update).toHaveBeenCalledWith(mockIssue.id, {
          status: "failed",
        });
      });

      it("sets issue status to failed when LLM generation fails", async () => {
        mockedTopicRepo.findById.mockResolvedValue(mockTopic);
        mockedIssueRepo.findByTopicId.mockResolvedValue(null);
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

      it("throws when database update fails after LLM succeeds (partial failure)", async () => {
        mockedTopicRepo.findById.mockResolvedValue(mockTopic);
        mockedIssueRepo.findByTopicId.mockResolvedValue(null);
        mockedIssueRepo.create.mockResolvedValue(mockIssue);
        mockedComplete.mockResolvedValue(mockNewsletterResponse);
        mockedConvertContentJsonToHtml.mockReturnValue(mockRawHtml);
        mockedIssueRepo.update
          .mockResolvedValueOnce(null) // First call fails (content update)
          .mockResolvedValueOnce({ ...mockIssue, status: "failed" }); // Second call for status update

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
    });

    describe("behavior verification", () => {
      beforeEach(() => {
        setupSuccessMocks();
      });

      it("calls topicRepo.findById with correct topicId", async () => {
        await newsletterService.generateNewsletterForTopic(topicId);

        expect(mockedTopicRepo.findById).toHaveBeenCalledWith(topicId);
        expect(mockedTopicRepo.findById).toHaveBeenCalledTimes(1);
      });

      it("calls issueRepo.findByTopicId to check for duplicates", async () => {
        await newsletterService.generateNewsletterForTopic(topicId);

        expect(mockedIssueRepo.findByTopicId).toHaveBeenCalledWith(topicId);
        expect(mockedIssueRepo.findByTopicId).toHaveBeenCalledTimes(1);
      });

      it("calls issueRepo.create with correct initial data", async () => {
        await newsletterService.generateNewsletterForTopic(topicId);

        expect(mockedIssueRepo.create).toHaveBeenCalledWith({
          topicId: mockTopic.id,
          title: mockTopic.title,
          status: "generating",
        });
      });

      it("calls LLM complete with correct prompt and schema", async () => {
        await newsletterService.generateNewsletterForTopic(topicId);

        expect(mockedComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: expect.any(String),
            schema: expect.any(Object),
            schemaName: "newsletter_response",
          }),
        );
      });

      it("passes correct reasoning config to complete with effort: Effort.Medium", async () => {
        await newsletterService.generateNewsletterForTopic(topicId);

        expect(mockedComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            reasoning: {
              effort: Effort.Medium,
            },
          }),
        );
      });

      it("calls issueRepo.update with generated content and status draft", async () => {
        await newsletterService.generateNewsletterForTopic(topicId);

        expect(mockedIssueRepo.update).toHaveBeenCalledWith(mockIssue.id, {
          contentJson: mockNewsletterResponse,
          rawHtml: mockRawHtml,
          status: "draft",
        });
      });

      it("calls convertContentJsonToHtml to generate rawHtml", async () => {
        await newsletterService.generateNewsletterForTopic(topicId);

        expect(mockedConvertContentJsonToHtml).toHaveBeenCalledWith(
          mockNewsletterResponse,
          mockTopic.title,
        );
      });
    });
  });
});

