/**
 * Topics Router Tests
 *
 * Tests the tRPC router procedures by invoking them through the caller,
 * validating input schemas, authentication, and error handling.
 *
 * TODO: Add tests for the following procedures:
 * - getWithIssues: Paginated query for topics with issue status
 * - getAllWithIssues: Query for all topics with issue status
 * - deleteAll: Mutation to delete all topics for a subject
 */

import { TRPCError } from "@trpc/server";
import { topicService } from "~/server/services/TopicService";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { createTRPCContext } from "~/server/api/trpc";
import { topicsRouter } from "~/server/api/routers/topics";

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

vi.mock("~/lib/jwt", () => ({
  verifyToken: vi.fn(),
  extractTokenFromHeader: vi.fn(),
}));

import { verifyToken, extractTokenFromHeader } from "~/lib/jwt";

const mockedTopicService = vi.mocked(topicService);
const mockedVerifyToken = vi.mocked(verifyToken);
const mockedExtractTokenFromHeader = vi.mocked(extractTokenFromHeader);

/**
 * Creates a tRPC caller with admin authentication
 */
const createAuthenticatedCaller = async () => {
  const ctx = await createTRPCContext({
    headers: new Headers({ authorization: "Bearer valid-admin-token" }),
  });
  return topicsRouter.createCaller(ctx);
};

/**
 * Creates a tRPC caller without authentication
 */
const createUnauthenticatedCaller = async () => {
  const ctx = await createTRPCContext({
    headers: new Headers(),
  });
  return topicsRouter.createCaller(ctx);
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

    describe("with valid admin authentication", () => {
      beforeEach(() => {
        setupAdminAuthMocks();
      });

      it("successfully calls topicService.generateTopics with correct params", async () => {
        mockedTopicService.generateTopics.mockResolvedValue(mockGenerateResult);
        const caller = await createAuthenticatedCaller();

        await caller.generate({ batchSize: 15 });

        expect(mockedTopicService.generateTopics).toHaveBeenCalledWith(
          SYSTEM_DESIGN_SUBJECT_ID,
          15,
        );
      });

      it("uses default batchSize of 10 when not provided", async () => {
        mockedTopicService.generateTopics.mockResolvedValue(mockGenerateResult);
        const caller = await createAuthenticatedCaller();

        await caller.generate({});

        expect(mockedTopicService.generateTopics).toHaveBeenCalledWith(
          SYSTEM_DESIGN_SUBJECT_ID,
          10,
        );
      });

      it("returns success response with topic count and duration", async () => {
        mockedTopicService.generateTopics.mockResolvedValue(mockGenerateResult);
        const caller = await createAuthenticatedCaller();

        const result = await caller.generate({ batchSize: 10 });

        expect(result.success).toBe(true);
        expect(result.topicsCreated).toBe(10);
        expect(result.totalBatches).toBe(1);
        expect(result.duration).toBe(5000);
        expect(result.message).toBe("generateTopics request went successful");
      });

      it("wraps service errors in TRPCError with INTERNAL_SERVER_ERROR code", async () => {
        const serviceError = new Error("LLM request failed");
        mockedTopicService.generateTopics.mockRejectedValue(serviceError);
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ batchSize: 10 })).rejects.toMatchObject({
          code: "INTERNAL_SERVER_ERROR",
          message: "LLM request failed",
        });
      });

      it("uses generic message for non-Error objects", async () => {
        mockedTopicService.generateTopics.mockRejectedValue("string error");
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ batchSize: 10 })).rejects.toMatchObject({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate topics",
        });
      });
    });

    describe("input validation", () => {
      beforeEach(() => {
        setupAdminAuthMocks();
        mockedTopicService.generateTopics.mockResolvedValue(mockGenerateResult);
      });

      it("rejects batchSize less than 1", async () => {
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ batchSize: 0 })).rejects.toThrow();
      });

      it("rejects batchSize greater than 100", async () => {
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ batchSize: 101 })).rejects.toThrow();
      });

      it("rejects non-integer batchSize", async () => {
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ batchSize: 10.5 })).rejects.toThrow();
      });

      it("accepts batchSize at minimum boundary (1)", async () => {
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ batchSize: 1 })).resolves.not.toThrow();

        expect(mockedTopicService.generateTopics).toHaveBeenCalledWith(
          SYSTEM_DESIGN_SUBJECT_ID,
          1,
        );
      });

      it("accepts batchSize at maximum boundary (100)", async () => {
        const caller = await createAuthenticatedCaller();

        await expect(
          caller.generate({ batchSize: 100 }),
        ).resolves.not.toThrow();

        expect(mockedTopicService.generateTopics).toHaveBeenCalledWith(
          SYSTEM_DESIGN_SUBJECT_ID,
          100,
        );
      });
    });

    describe("authentication", () => {
      it("throws UNAUTHORIZED when no token is provided", async () => {
        setupNoAuthMocks();
        const caller = await createUnauthenticatedCaller();
        await expect(caller.generate({ batchSize: 10 })).rejects.toMatchObject({
          code: "UNAUTHORIZED",
        });
      });

      it("throws UNAUTHORIZED when token is invalid", async () => {
        mockedExtractTokenFromHeader.mockReturnValue("invalid-token");
        mockedVerifyToken.mockReturnValue(null);
        const caller = await createAuthenticatedCaller();

        await expect(caller.generate({ batchSize: 10 })).rejects.toMatchObject({
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

        await expect(caller.generate({ batchSize: 10 })).rejects.toMatchObject({
          code: "UNAUTHORIZED",
        });
      });
    });
  });
});
