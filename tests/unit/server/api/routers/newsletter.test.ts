/**
 * Newsletter Router Tests
 *
 * Tests the tRPC router procedures for newsletter generation by invoking them
 * through the caller, validating input schemas, authentication, and error handling.
 */

import { TRPCError } from "@trpc/server";
import { newsletterService } from "~/server/services/NewsletterService";
import { topicRepo } from "~/server/db/repo/topicRepo";
import { createTRPCContext } from "~/server/api/trpc";
import { newsletterRouter } from "~/server/api/routers/newsletter";
import { TopicFactory } from "tests/factories";

vi.mock("~/server/services/NewsletterService", () => ({
  newsletterService: {
    generateNewsletterForTopic: vi.fn(),
  },
}));

vi.mock("~/server/db/repo/topicRepo", () => ({
  topicRepo: {
    findTopicsWithoutIssues: vi.fn(),
  },
}));

vi.mock("~/server/db/repo/issueRepo", () => ({
  issueRepo: {
    findByTopicId: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    deleteWithCascade: vi.fn(),
  },
}));

vi.mock("~/server/db/repo/deliveryRepo", () => ({
  deliveryRepo: {
    findRecentIssueMetrics: vi.fn(),
    findActiveSubscribersWithFailedDeliveries: vi.fn(),
  },
}));

vi.mock("~/server/newsletter/sendNewsletter", () => ({
  sendNewsletterToAdmin: vi.fn(),
}));

vi.mock("~/server/newsletter/resendNewsletter", () => ({
  resendNewsletterToFailedUsers: vi.fn(),
}));

vi.mock("~/server/email/emailService", () => ({
  emailService: {
    sendNewsletterEmail: vi.fn(),
  },
}));

vi.mock("~/lib/jwt", () => ({
  verifyToken: vi.fn(),
  extractTokenFromHeader: vi.fn(),
}));

import { verifyToken, extractTokenFromHeader } from "~/lib/jwt";

const mockedNewsletterService = vi.mocked(newsletterService);
const mockedTopicRepo = vi.mocked(topicRepo);
const mockedVerifyToken = vi.mocked(verifyToken);
const mockedExtractTokenFromHeader = vi.mocked(extractTokenFromHeader);

/**
 * Creates a tRPC caller with admin authentication
 */
const createAuthenticatedCaller = async () => {
  const ctx = await createTRPCContext({
    headers: new Headers({ authorization: "Bearer valid-admin-token" }),
  });
  return newsletterRouter.createCaller(ctx);
};

/**
 * Creates a tRPC caller without authentication
 */
const createUnauthenticatedCaller = async () => {
  const ctx = await createTRPCContext({
    headers: new Headers(),
  });
  return newsletterRouter.createCaller(ctx);
};

/**
 * Sets up mocks for valid admin authentication
 */
const setupAdminAuthMocks = () => {
  mockedExtractTokenFromHeader.mockReturnValue("valid-admin-token");
  mockedVerifyToken.mockReturnValue({
    email: "admin@test.com",
    isAdmin: true,
  });
};

/**
 * Sets up mocks for invalid/missing authentication
 */
const setupNoAuthMocks = () => {
  mockedExtractTokenFromHeader.mockReturnValue(null);
  mockedVerifyToken.mockReturnValue(null);
};

describe("newsletterRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generate procedure", () => {
    const topicId = 1;
    const mockGenerateResult = {
      success: true,
      issueId: 1,
    };

    describe("with valid admin authentication", () => {
      beforeEach(() => {
        setupAdminAuthMocks();
      });

      it("successfully calls newsletterService.generateNewsletterForTopic with correct topicId", async () => {
        mockedNewsletterService.generateNewsletterForTopic.mockResolvedValue(
          mockGenerateResult,
        );
        const caller = await createAuthenticatedCaller();

        await caller.generate({ topicId });

        expect(
          mockedNewsletterService.generateNewsletterForTopic,
        ).toHaveBeenCalledWith(topicId);
      });

      it("returns success true on successful generation", async () => {
        mockedNewsletterService.generateNewsletterForTopic.mockResolvedValue(
          mockGenerateResult,
        );
        const caller = await createAuthenticatedCaller();

        const result = await caller.generate({ topicId });

        expect(result.success).toBe(true);
      });

      it("wraps service errors in TRPCError with INTERNAL_SERVER_ERROR code", async () => {
        const serviceError = new Error("Topic does not exist");
        mockedNewsletterService.generateNewsletterForTopic.mockRejectedValue(
          serviceError,
        );
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ topicId })).rejects.toMatchObject({
          code: "INTERNAL_SERVER_ERROR",
          message: "Topic does not exist",
        });
      });

      it("uses generic message for non-Error objects", async () => {
        mockedNewsletterService.generateNewsletterForTopic.mockRejectedValue(
          "string error",
        );
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ topicId })).rejects.toMatchObject({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate newsletter",
        });
      });
    });

    describe("input validation", () => {
      beforeEach(() => {
        setupAdminAuthMocks();
        mockedNewsletterService.generateNewsletterForTopic.mockResolvedValue(
          mockGenerateResult,
        );
      });

      it("rejects topicId of 0", async () => {
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ topicId: 0 })).rejects.toThrow();
      });

      it("rejects negative topicId", async () => {
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ topicId: -1 })).rejects.toThrow();
      });

      it("rejects non-integer topicId", async () => {
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ topicId: 1.5 })).rejects.toThrow();
      });

      it("accepts positive integer topicId", async () => {
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ topicId: 1 })).resolves.not.toThrow();

        expect(
          mockedNewsletterService.generateNewsletterForTopic,
        ).toHaveBeenCalledWith(1);
      });
    });

    describe("authentication", () => {
      it("throws UNAUTHORIZED when no token is provided", async () => {
        setupNoAuthMocks();
        const caller = await createUnauthenticatedCaller();

        await expect(caller.generate({ topicId })).rejects.toMatchObject({
          code: "UNAUTHORIZED",
        });
      });

      it("throws UNAUTHORIZED when token is invalid", async () => {
        mockedExtractTokenFromHeader.mockReturnValue("invalid-token");
        mockedVerifyToken.mockReturnValue(null);
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ topicId })).rejects.toMatchObject({
          code: "UNAUTHORIZED",
        });
      });

      it("throws UNAUTHORIZED when user is not admin", async () => {
        mockedExtractTokenFromHeader.mockReturnValue("valid-token");
        mockedVerifyToken.mockReturnValue({
          email: "user@test.com",
          isAdmin: false,
        });
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ topicId })).rejects.toMatchObject({
          code: "UNAUTHORIZED",
        });
      });
    });
  });

  describe("generateBulk procedure", () => {
    describe("with valid admin authentication", () => {
      beforeEach(() => {
        setupAdminAuthMocks();
      });

      it("returns early when no topics without issues", async () => {
        mockedTopicRepo.findTopicsWithoutIssues.mockResolvedValue([]);
        const caller = await createAuthenticatedCaller();

        const result = await caller.generateBulk({ subjectId: 1, count: 5 });

        expect(result).toEqual({
          totalRequested: 5,
          successful: 0,
          failed: 0,
          results: [],
          message: "No topics found without existing newsletters",
        });
        expect(
          mockedNewsletterService.generateNewsletterForTopic,
        ).not.toHaveBeenCalled();
      });

      it("successfully generates newsletters for multiple topics in parallel", async () => {
        const topics = TopicFactory.createTopics(3);
        mockedTopicRepo.findTopicsWithoutIssues.mockResolvedValue(topics);
        mockedNewsletterService.generateNewsletterForTopic.mockResolvedValue({
          success: true,
          issueId: 1,
        });
        const caller = await createAuthenticatedCaller();

        const result = await caller.generateBulk({ subjectId: 1, count: 5 });

        expect(result.successful).toBe(3);
        expect(result.failed).toBe(0);
        expect(result.results).toHaveLength(3);
        expect(
          mockedNewsletterService.generateNewsletterForTopic,
        ).toHaveBeenCalledTimes(3);
      });

      it("handles mixed success/failure results", async () => {
        const topics = TopicFactory.createTopics(3);
        mockedTopicRepo.findTopicsWithoutIssues.mockResolvedValue(topics);
        mockedNewsletterService.generateNewsletterForTopic
          .mockResolvedValueOnce({ success: true, issueId: 1 })
          .mockRejectedValueOnce(new Error("LLM failed"))
          .mockResolvedValueOnce({ success: true, issueId: 2 });
        const caller = await createAuthenticatedCaller();

        const result = await caller.generateBulk({ subjectId: 1, count: 5 });

        expect(result.successful).toBe(2);
        expect(result.failed).toBe(1);
        expect(result.results).toHaveLength(3);

        const failedResult = result.results.find((r) => !r.success);
        expect(failedResult?.error).toBe("LLM failed");
      });

      it("returns correct counts (successful, failed, totalRequested)", async () => {
        const topics = TopicFactory.createTopics(2);
        mockedTopicRepo.findTopicsWithoutIssues.mockResolvedValue(topics);
        mockedNewsletterService.generateNewsletterForTopic.mockResolvedValue({
          success: true,
          issueId: 1,
        });
        const caller = await createAuthenticatedCaller();

        const result = await caller.generateBulk({ subjectId: 1, count: 10 });

        expect(result.totalRequested).toBe(10);
        expect(result.successful).toBe(2);
        expect(result.failed).toBe(0);
        expect(result.message).toBe("Successfully generated 2/2 newsletters");
      });

      it("calls topicRepo.findTopicsWithoutIssues with correct parameters", async () => {
        mockedTopicRepo.findTopicsWithoutIssues.mockResolvedValue([]);
        const caller = await createAuthenticatedCaller();

        await caller.generateBulk({ subjectId: 1, count: 15 });

        expect(mockedTopicRepo.findTopicsWithoutIssues).toHaveBeenCalledWith(
          1,
          15,
        );
      });
    });

    describe("input validation", () => {
      beforeEach(() => {
        setupAdminAuthMocks();
        mockedTopicRepo.findTopicsWithoutIssues.mockResolvedValue([]);
      });

      it("uses default subjectId of 1 when not provided", async () => {
        const caller = await createAuthenticatedCaller();

        await caller.generateBulk({});

        expect(mockedTopicRepo.findTopicsWithoutIssues).toHaveBeenCalledWith(
          1,
          5,
        );
      });

      it("uses default count of 5 when not provided", async () => {
        const caller = await createAuthenticatedCaller();

        await caller.generateBulk({ subjectId: 1 });

        expect(mockedTopicRepo.findTopicsWithoutIssues).toHaveBeenCalledWith(
          1,
          5,
        );
      });

      it("rejects count less than 1", async () => {
        const caller = await createAuthenticatedCaller();

        await expect(
          caller.generateBulk({ subjectId: 1, count: 0 }),
        ).rejects.toThrow();
      });

      it("rejects count greater than 50", async () => {
        const caller = await createAuthenticatedCaller();

        await expect(
          caller.generateBulk({ subjectId: 1, count: 51 }),
        ).rejects.toThrow();
      });

      it("accepts count at minimum boundary (1)", async () => {
        const caller = await createAuthenticatedCaller();

        await expect(
          caller.generateBulk({ subjectId: 1, count: 1 }),
        ).resolves.not.toThrow();

        expect(mockedTopicRepo.findTopicsWithoutIssues).toHaveBeenCalledWith(
          1,
          1,
        );
      });

      it("accepts count at maximum boundary (50)", async () => {
        const caller = await createAuthenticatedCaller();

        await expect(
          caller.generateBulk({ subjectId: 1, count: 50 }),
        ).resolves.not.toThrow();

        expect(mockedTopicRepo.findTopicsWithoutIssues).toHaveBeenCalledWith(
          1,
          50,
        );
      });
    });

    describe("authentication", () => {
      it("throws UNAUTHORIZED when no token is provided", async () => {
        setupNoAuthMocks();
        const caller = await createUnauthenticatedCaller();

        await expect(
          caller.generateBulk({ subjectId: 1, count: 5 }),
        ).rejects.toMatchObject({
          code: "UNAUTHORIZED",
        });
      });

      it("throws UNAUTHORIZED when token is invalid", async () => {
        mockedExtractTokenFromHeader.mockReturnValue("invalid-token");
        mockedVerifyToken.mockReturnValue(null);
        const caller = await createAuthenticatedCaller();

        await expect(
          caller.generateBulk({ subjectId: 1, count: 5 }),
        ).rejects.toMatchObject({
          code: "UNAUTHORIZED",
        });
      });

      it("throws UNAUTHORIZED when user is not admin", async () => {
        mockedExtractTokenFromHeader.mockReturnValue("valid-token");
        mockedVerifyToken.mockReturnValue({
          email: "user@test.com",
          isAdmin: false,
        });
        const caller = await createAuthenticatedCaller();

        await expect(
          caller.generateBulk({ subjectId: 1, count: 5 }),
        ).rejects.toMatchObject({
          code: "UNAUTHORIZED",
        });
      });
    });
  });
});
