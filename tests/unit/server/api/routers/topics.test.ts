/**
 * Topics Router Tests
 *
 * TODO: Add tests for the following procedures:
 * - getWithIssues: Paginated query for topics with issue status
 * - getAllWithIssues: Query for all topics with issue status
 * - deleteAll: Mutation to delete all topics for a subject
 */

import { TRPCError } from "@trpc/server";
import { topicService } from "~/server/services/TopicService";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

vi.mock("~/server/services/TopicService", () => ({
  topicService: {
    generateTopics: vi.fn(),
  },
}));

vi.mock("~/server/db/repo/topicRepo", () => ({
  topicRepo: {
    getTopicsWithIssueStatusPaginated: vi.fn(),
    getTopicsWithIssueStatus: vi.fn(),
    deleteBySubjectId: vi.fn(),
  },
}));

const mockedTopicService = vi.mocked(topicService);

describe("topicsRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generate procedure", () => {
    const mockGenerateResult = {
      success: true,
      topicsCreated: 10,
      totalBatches: 1,
      duration: 5000,
    };

    it("successfully calls topicService.generateTopics with correct params", async () => {
      mockedTopicService.generateTopics.mockResolvedValue(mockGenerateResult);

      const batchSize = 15;
      await mockedTopicService.generateTopics(
        SYSTEM_DESIGN_SUBJECT_ID,
        batchSize,
      );

      expect(mockedTopicService.generateTopics).toHaveBeenCalledWith(
        SYSTEM_DESIGN_SUBJECT_ID,
        batchSize,
      );
    });

    it("returns success response with topic count and duration", async () => {
      mockedTopicService.generateTopics.mockResolvedValue(mockGenerateResult);

      const result = await mockedTopicService.generateTopics(
        SYSTEM_DESIGN_SUBJECT_ID,
        10,
      );

      expect(result.success).toBe(true);
      expect(result.topicsCreated).toBe(10);
      expect(result.totalBatches).toBe(1);
      expect(result.duration).toBe(5000);
    });

    it("throws error on service failure", async () => {
      const serviceError = new Error("LLM request failed");
      mockedTopicService.generateTopics.mockRejectedValue(serviceError);

      await expect(
        mockedTopicService.generateTopics(SYSTEM_DESIGN_SUBJECT_ID, 10),
      ).rejects.toThrow("LLM request failed");
    });
  });

  describe("error handling", () => {
    it("wraps service errors in TRPCError with INTERNAL_SERVER_ERROR code", async () => {
      mockedTopicService.generateTopics.mockRejectedValue(
        new Error("Database connection failed"),
      );

      try {
        await mockedTopicService.generateTopics(SYSTEM_DESIGN_SUBJECT_ID, 10);
      } catch (error) {
        const trpcError = new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
        expect(trpcError.code).toBe("INTERNAL_SERVER_ERROR");
        expect(trpcError.message).toBe("Database connection failed");
      }
    });

    it("uses generic message for non-Error objects", () => {
      const trpcError = new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate topics",
      });

      expect(trpcError.message).toBe("Failed to generate topics");
    });
  });
});

