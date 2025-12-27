import { issueService } from "~/server/services/IssueService";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { redis, CACHE_TTL } from "~/server/redis";
import { env } from "~/env";
import { IssueFactory } from "~/test/factories";
import type { IssueSummary } from "~/server/api/routers/issue";

vi.mock("~/server/db/repo/issueRepo", () => ({
  issueRepo: {
    getSentIssueById: vi.fn(),
    getLatestSentIssue: vi.fn(),
    getIssueSummaries: vi.fn(),
  },
}));

vi.mock("~/server/redis", () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
  },
  CACHE_KEYS: {
    SENT_ISSUE: (issueId: number) =>
      `test:daily-system-design:sent-issue:${issueId}`,
    LATEST_SENT_ISSUE: (subjectId: number) =>
      `test:daily-system-design:latest-sent-issue:${subjectId}`,
  },
  CACHE_TTL: {
    SENT_ISSUE: 43200, // 12 hours
  },
}));

const mockedRedis = vi.mocked(redis);
const mockedIssueRepo = vi.mocked(issueRepo);
const { get: mockRedisGet, setex: mockRedisSetex } = mockedRedis;
const { getSentIssueById, getLatestSentIssue, getIssueSummaries } =
  mockedIssueRepo;

vi.mock("~/env", () => ({
  env: {
    VERCEL_ENV: "test",
  },
}));

describe("IssueService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSentIssueById", () => {
    const issueId = 42;
    const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:sent-issue:${issueId}`;

    it("returns cached issue when found in Redis (cache hit)", async () => {
      const cachedIssue = IssueFactory.createIssueWithStringDates({
        id: issueId,
      });
      mockRedisGet.mockResolvedValue(cachedIssue);

      const result = await issueService.getSentIssueById(issueId);

      expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
      expect(getSentIssueById).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result?.id).toBe(issueId);
      expect(result?.createdAt).toBeInstanceOf(Date);
    });

    it("deserializes Date fields correctly from cached string format", async () => {
      const now = new Date("2024-01-15T10:30:00.000Z");
      const cachedIssue = IssueFactory.createIssueWithStringDates({
        id: issueId,
        createdAt: now,
        updatedAt: now,
        approvedAt: now,
        sentAt: now,
      });
      mockRedisGet.mockResolvedValue(cachedIssue);

      const result = await issueService.getSentIssueById(issueId);

      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
      expect(result?.approvedAt).toBeInstanceOf(Date);
      expect(result?.sentAt).toBeInstanceOf(Date);
      expect(result?.createdAt.toISOString()).toBe(now.toISOString());
    });

    it("handles null date fields correctly from cached data", async () => {
      const cachedIssue = IssueFactory.createIssueWithStringDates({
        id: issueId,
        updatedAt: null,
        approvedAt: null,
        sentAt: null,
      });
      mockRedisGet.mockResolvedValue(cachedIssue);

      const result = await issueService.getSentIssueById(issueId);

      expect(result?.updatedAt).toBeNull();
      expect(result?.approvedAt).toBeNull();
      expect(result?.sentAt).toBeNull();
    });

    it("fetches from database and caches when not in Redis (cache miss)", async () => {
      const dbIssue = IssueFactory.createIssue({ id: issueId });
      mockRedisGet.mockResolvedValue(null);
      getSentIssueById.mockResolvedValue(dbIssue);

      const result = await issueService.getSentIssueById(issueId);

      expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
      expect(getSentIssueById).toHaveBeenCalledWith(issueId);
      expect(mockRedisSetex).toHaveBeenCalledWith(
        expectedCacheKey,
        CACHE_TTL.SENT_ISSUE,
        dbIssue,
      );
      expect(result).toEqual(dbIssue);
    });

    it("returns undefined and does not cache when issue not found in database", async () => {
      mockRedisGet.mockResolvedValue(null);
      getSentIssueById.mockResolvedValue(undefined);

      const result = await issueService.getSentIssueById(issueId);

      expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
      expect(getSentIssueById).toHaveBeenCalledWith(issueId);
      expect(mockRedisSetex).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe("getLatestSentIssue", () => {
    const subjectId = 1;
    const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:latest-sent-issue:${subjectId}`;

    it("returns cached issue when found in Redis (cache hit)", async () => {
      const cachedIssue = IssueFactory.createIssueWithStringDates({ id: 100 });
      mockRedisGet.mockResolvedValue(cachedIssue);

      const result = await issueService.getLatestSentIssue(subjectId);

      expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
      expect(getLatestSentIssue).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result?.createdAt).toBeInstanceOf(Date);
    });

    it("deserializes Date fields correctly from cached string format", async () => {
      const now = new Date("2024-06-20T15:45:00.000Z");
      const cachedIssue = IssueFactory.createIssueWithStringDates({
        id: 100,
        createdAt: now,
        sentAt: now,
      });
      mockRedisGet.mockResolvedValue(cachedIssue);

      const result = await issueService.getLatestSentIssue(subjectId);

      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.sentAt).toBeInstanceOf(Date);
      expect(result?.createdAt.toISOString()).toBe(now.toISOString());
    });

    it("fetches from database and caches when not in Redis (cache miss)", async () => {
      const dbIssue = IssueFactory.createIssue({ id: 100 });
      mockRedisGet.mockResolvedValue(null);
      getLatestSentIssue.mockResolvedValue(dbIssue);

      const result = await issueService.getLatestSentIssue(subjectId);

      expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
      expect(getLatestSentIssue).toHaveBeenCalledWith(subjectId);
      expect(mockRedisSetex).toHaveBeenCalledWith(
        expectedCacheKey,
        CACHE_TTL.SENT_ISSUE,
        dbIssue,
      );
      expect(result).toEqual(dbIssue);
    });

    it("returns undefined and does not cache when no sent issues exist", async () => {
      mockRedisGet.mockResolvedValue(null);
      getLatestSentIssue.mockResolvedValue(undefined);

      const result = await issueService.getLatestSentIssue(subjectId);

      expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
      expect(getLatestSentIssue).toHaveBeenCalledWith(subjectId);
      expect(mockRedisSetex).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe("getIssueSummaries", () => {
    const subjectId = 1;
    const page = 1;
    const resultsPerPage = 10;

    const getCacheKey = (s: number, p: number, r: number): string =>
      `${env.VERCEL_ENV}:daily-system-design:issue-summaries:${s}:${p}:${r}`;

    it("returns cached summaries when found in Redis (cache hit)", async () => {
      const cachedSummaries = IssueFactory.createIssueSummaries(5);
      mockRedisGet.mockResolvedValue(cachedSummaries);

      const result = await issueService.getIssueSummaries(
        subjectId,
        page,
        resultsPerPage,
      );

      expect(mockRedisGet).toHaveBeenCalledWith(
        getCacheKey(subjectId, page, resultsPerPage),
      );
      expect(getIssueSummaries).not.toHaveBeenCalled();
      expect(result).toEqual(cachedSummaries);
    });

    it("fetches from database and caches when not in Redis (cache miss)", async () => {
      const dbSummaries = IssueFactory.createIssueSummaries(5);
      mockRedisGet.mockResolvedValue(null);
      getIssueSummaries.mockResolvedValue(dbSummaries);

      const result = await issueService.getIssueSummaries(
        subjectId,
        page,
        resultsPerPage,
      );

      expect(mockRedisGet).toHaveBeenCalledWith(
        getCacheKey(subjectId, page, resultsPerPage),
      );
      expect(getIssueSummaries).toHaveBeenCalledWith(
        subjectId,
        0, // offset for page 1
        resultsPerPage,
      );
      expect(mockRedisSetex).toHaveBeenCalledWith(
        getCacheKey(subjectId, page, resultsPerPage),
        5 * 60, // GET_ISSUES_SUMMARIES_TTL
        dbSummaries,
      );
      expect(result).toEqual(dbSummaries);
    });

    it("calculates correct offset for pagination", async () => {
      const testPage = 3;
      const expectedOffset = (testPage - 1) * resultsPerPage; // 20
      mockRedisGet.mockResolvedValue(null);
      getIssueSummaries.mockResolvedValue([]);

      await issueService.getIssueSummaries(subjectId, testPage, resultsPerPage);

      expect(getIssueSummaries).toHaveBeenCalledWith(
        subjectId,
        expectedOffset,
        resultsPerPage,
      );
    });

    it("filters out summaries with null issueId", async () => {
      const dbSummaries = [
        { issueId: 1, title: "Valid Issue", issueNumber: 1 },
        { issueId: null, title: "Invalid Issue", issueNumber: 2 },
        { issueId: 3, title: "Another Valid", issueNumber: 3 },
      ] as (
        | IssueSummary
        | { issueId: null; title: string; issueNumber: number }
      )[];
      mockRedisGet.mockResolvedValue(null);
      getIssueSummaries.mockResolvedValue(dbSummaries as IssueSummary[]);

      const result = await issueService.getIssueSummaries(
        subjectId,
        page,
        resultsPerPage,
      );

      expect(result).toHaveLength(2);
      expect(result.every((s) => s.issueId !== null)).toBe(true);
    });

    it("filters out summaries with null title", async () => {
      const dbSummaries = [
        { issueId: 1, title: "Valid Issue", issueNumber: 1 },
        { issueId: 2, title: null, issueNumber: 2 },
        { issueId: 3, title: "Another Valid", issueNumber: 3 },
      ] as (
        | IssueSummary
        | { issueId: number; title: null; issueNumber: number }
      )[];
      mockRedisGet.mockResolvedValue(null);
      getIssueSummaries.mockResolvedValue(dbSummaries as IssueSummary[]);

      const result = await issueService.getIssueSummaries(
        subjectId,
        page,
        resultsPerPage,
      );

      expect(result).toHaveLength(2);
      expect(result.every((s) => s.title !== null)).toBe(true);
    });

    it("returns empty array when no summaries exist", async () => {
      mockRedisGet.mockResolvedValue(null);
      getIssueSummaries.mockResolvedValue([]);

      const result = await issueService.getIssueSummaries(
        subjectId,
        page,
        resultsPerPage,
      );

      expect(result).toEqual([]);
      expect(mockRedisSetex).toHaveBeenCalledWith(
        getCacheKey(subjectId, page, resultsPerPage),
        5 * 60,
        [],
      );
    });

    it("uses default values for page and resultsPerPage when not provided", async () => {
      mockRedisGet.mockResolvedValue(null);
      getIssueSummaries.mockResolvedValue([]);

      await issueService.getIssueSummaries(subjectId);

      expect(mockRedisGet).toHaveBeenCalledWith(getCacheKey(subjectId, 1, 10));
      expect(getIssueSummaries).toHaveBeenCalledWith(subjectId, 0, 10);
    });
  });

  describe("changeIssueStatus", () => {
    it("is a stub that returns immediately (TODO: implement when method is completed)", async () => {
      const result = await issueService.changeIssueStatus(1, "approved");
      expect(result).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    describe("getSentIssueById", () => {
      it("handles negative issueId", async () => {
        const issueId = -1;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:sent-issue:${issueId}`;
        mockRedisGet.mockResolvedValue(null);
        getSentIssueById.mockResolvedValue(undefined);

        const result = await issueService.getSentIssueById(issueId);

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        expect(getSentIssueById).toHaveBeenCalledWith(issueId);
        expect(result).toBeUndefined();
      });

      it("handles zero issueId", async () => {
        const issueId = 0;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:sent-issue:${issueId}`;
        mockRedisGet.mockResolvedValue(null);
        getSentIssueById.mockResolvedValue(undefined);

        const result = await issueService.getSentIssueById(issueId);

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        expect(getSentIssueById).toHaveBeenCalledWith(issueId);
        expect(result).toBeUndefined();
      });
    });

    describe("getLatestSentIssue", () => {
      it("handles negative subjectId", async () => {
        const subjectId = -1;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:latest-sent-issue:${subjectId}`;
        mockRedisGet.mockResolvedValue(null);
        getLatestSentIssue.mockResolvedValue(undefined);

        const result = await issueService.getLatestSentIssue(subjectId);

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        expect(getLatestSentIssue).toHaveBeenCalledWith(subjectId);
        expect(result).toBeUndefined();
      });
    });

    describe("getIssueSummaries", () => {
      it("handles negative page number", async () => {
        const subjectId = 1;
        const page = -1;
        const resultsPerPage = 10;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:issue-summaries:${subjectId}:${page}:${resultsPerPage}`;
        mockRedisGet.mockResolvedValue(null);
        getIssueSummaries.mockResolvedValue([]);

        await issueService.getIssueSummaries(subjectId, page, resultsPerPage);

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        // Offset calculation: (-1 - 1) * 10 = -20
        expect(getIssueSummaries).toHaveBeenCalledWith(
          subjectId,
          -20,
          resultsPerPage,
        );
      });

      it("handles zero page number", async () => {
        const subjectId = 1;
        const page = 0;
        const resultsPerPage = 10;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:issue-summaries:${subjectId}:${page}:${resultsPerPage}`;
        mockRedisGet.mockResolvedValue(null);
        getIssueSummaries.mockResolvedValue([]);

        await issueService.getIssueSummaries(subjectId, page, resultsPerPage);

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        // Offset calculation: (0 - 1) * 10 = -10
        expect(getIssueSummaries).toHaveBeenCalledWith(
          subjectId,
          -10,
          resultsPerPage,
        );
      });

      it("handles negative resultsPerPage", async () => {
        const subjectId = 1;
        const page = 1;
        const resultsPerPage = -10;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:issue-summaries:${subjectId}:${page}:${resultsPerPage}`;
        mockRedisGet.mockResolvedValue(null);
        getIssueSummaries.mockResolvedValue([]);

        await issueService.getIssueSummaries(subjectId, page, resultsPerPage);

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        // Negative resultsPerPage is normalized to 0
        expect(getIssueSummaries).toHaveBeenCalledWith(subjectId, 0, 0);
      });

      it("handles very large resultsPerPage (>1000)", async () => {
        const subjectId = 1;
        const page = 1;
        const resultsPerPage = 1001;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:issue-summaries:${subjectId}:${page}:${resultsPerPage}`;
        mockRedisGet.mockResolvedValue(null);
        getIssueSummaries.mockResolvedValue([]);

        await issueService.getIssueSummaries(subjectId, page, resultsPerPage);

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        expect(getIssueSummaries).toHaveBeenCalledWith(
          subjectId,
          0,
          resultsPerPage,
        );
      });

      it("handles page number beyond available data", async () => {
        const subjectId = 1;
        const page = 999;
        const resultsPerPage = 10;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:issue-summaries:${subjectId}:${page}:${resultsPerPage}`;
        mockRedisGet.mockResolvedValue(null);
        getIssueSummaries.mockResolvedValue([]);

        const result = await issueService.getIssueSummaries(
          subjectId,
          page,
          resultsPerPage,
        );

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        expect(getIssueSummaries).toHaveBeenCalledWith(
          subjectId,
          9980,
          resultsPerPage,
        );
        expect(result).toEqual([]);
      });

      it("handles negative subjectId", async () => {
        const subjectId = -1;
        const page = 1;
        const resultsPerPage = 10;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:issue-summaries:${subjectId}:${page}:${resultsPerPage}`;
        mockRedisGet.mockResolvedValue(null);
        getIssueSummaries.mockResolvedValue([]);

        await issueService.getIssueSummaries(subjectId, page, resultsPerPage);

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        expect(getIssueSummaries).toHaveBeenCalledWith(
          subjectId,
          0,
          resultsPerPage,
        );
      });
    });
  });

  describe("Error Cases", () => {
    describe("getSentIssueById", () => {
      it("handles Redis connection failure", async () => {
        const issueId = 42;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:sent-issue:${issueId}`;
        const dbIssue = IssueFactory.createIssue({ id: issueId });
        const redisError = new Error("Redis connection failed");
        mockRedisGet.mockRejectedValue(redisError);
        getSentIssueById.mockResolvedValue(dbIssue);

        await expect(issueService.getSentIssueById(issueId)).rejects.toThrow(
          "Redis connection failed",
        );

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
      });

      it("handles Redis setex failure", async () => {
        const issueId = 42;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:sent-issue:${issueId}`;
        const dbIssue = IssueFactory.createIssue({ id: issueId });
        mockRedisGet.mockResolvedValue(null);
        getSentIssueById.mockResolvedValue(dbIssue);
        const setexError = new Error("Redis setex failed");
        mockRedisSetex.mockRejectedValue(setexError);

        await expect(issueService.getSentIssueById(issueId)).rejects.toThrow(
          "Redis setex failed",
        );

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        expect(getSentIssueById).toHaveBeenCalledWith(issueId);
      });

      it("handles repository throws error", async () => {
        const issueId = 42;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:sent-issue:${issueId}`;
        const repoError = new Error("Database query failed");
        mockRedisGet.mockResolvedValue(null);
        getSentIssueById.mockRejectedValue(repoError);

        await expect(issueService.getSentIssueById(issueId)).rejects.toThrow(
          "Database query failed",
        );

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        expect(getSentIssueById).toHaveBeenCalledWith(issueId);
      });

      it("handles malformed cached data (invalid JSON)", async () => {
        const issueId = 42;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:sent-issue:${issueId}`;
        const malformedData = "{ invalid json }";
        mockRedisGet.mockResolvedValue(malformedData);

        // The deserialization might fail or produce unexpected results
        const result = await issueService.getSentIssueById(issueId);

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        // Result might be undefined or have invalid date fields
        expect(result).toBeDefined();
      });

      it("handles corrupted dates in cached data", async () => {
        const issueId = 42;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:sent-issue:${issueId}`;
        const cachedIssue = {
          ...IssueFactory.createIssueWithStringDates({ id: issueId }),
          createdAt: "invalid-date-string",
        };
        mockRedisGet.mockResolvedValue(cachedIssue);

        const result = await issueService.getSentIssueById(issueId);

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        expect(result).toBeDefined();
        // Date parsing might create Invalid Date
        expect(result?.createdAt).toBeInstanceOf(Date);
      });
    });

    describe("getLatestSentIssue", () => {
      it("handles Redis connection failure", async () => {
        const subjectId = 1;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:latest-sent-issue:${subjectId}`;
        const redisError = new Error("Redis connection failed");
        mockRedisGet.mockRejectedValue(redisError);

        await expect(
          issueService.getLatestSentIssue(subjectId),
        ).rejects.toThrow("Redis connection failed");

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
      });

      it("handles Redis setex failure", async () => {
        const subjectId = 1;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:latest-sent-issue:${subjectId}`;
        const dbIssue = IssueFactory.createIssue({ id: 100 });
        mockRedisGet.mockResolvedValue(null);
        getLatestSentIssue.mockResolvedValue(dbIssue);
        const setexError = new Error("Redis setex failed");
        mockRedisSetex.mockRejectedValue(setexError);

        await expect(
          issueService.getLatestSentIssue(subjectId),
        ).rejects.toThrow("Redis setex failed");

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        expect(getLatestSentIssue).toHaveBeenCalledWith(subjectId);
      });

      it("handles repository throws error", async () => {
        const subjectId = 1;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:latest-sent-issue:${subjectId}`;
        const repoError = new Error("Database query failed");
        mockRedisGet.mockResolvedValue(null);
        getLatestSentIssue.mockRejectedValue(repoError);

        await expect(
          issueService.getLatestSentIssue(subjectId),
        ).rejects.toThrow("Database query failed");

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        expect(getLatestSentIssue).toHaveBeenCalledWith(subjectId);
      });
    });

    describe("getIssueSummaries", () => {
      it("handles Redis connection failure", async () => {
        const subjectId = 1;
        const page = 1;
        const resultsPerPage = 10;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:issue-summaries:${subjectId}:${page}:${resultsPerPage}`;
        const redisError = new Error("Redis connection failed");
        mockRedisGet.mockRejectedValue(redisError);

        await expect(
          issueService.getIssueSummaries(subjectId, page, resultsPerPage),
        ).rejects.toThrow("Redis connection failed");

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
      });

      it("handles Redis setex failure", async () => {
        const subjectId = 1;
        const page = 1;
        const resultsPerPage = 10;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:issue-summaries:${subjectId}:${page}:${resultsPerPage}`;
        const dbSummaries = IssueFactory.createIssueSummaries(5);
        mockRedisGet.mockResolvedValue(null);
        getIssueSummaries.mockResolvedValue(dbSummaries);
        const setexError = new Error("Redis setex failed");
        mockRedisSetex.mockRejectedValue(setexError);

        await expect(
          issueService.getIssueSummaries(subjectId, page, resultsPerPage),
        ).rejects.toThrow("Redis setex failed");

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        expect(getIssueSummaries).toHaveBeenCalled();
      });

      it("handles repository throws error", async () => {
        const subjectId = 1;
        const page = 1;
        const resultsPerPage = 10;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:issue-summaries:${subjectId}:${page}:${resultsPerPage}`;
        const repoError = new Error("Database query failed");
        mockRedisGet.mockResolvedValue(null);
        getIssueSummaries.mockRejectedValue(repoError);

        await expect(
          issueService.getIssueSummaries(subjectId, page, resultsPerPage),
        ).rejects.toThrow("Database query failed");

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        expect(getIssueSummaries).toHaveBeenCalled();
      });

      it("handles malformed cached data (invalid array)", async () => {
        const subjectId = 1;
        const page = 1;
        const resultsPerPage = 10;
        const expectedCacheKey = `${env.VERCEL_ENV}:daily-system-design:issue-summaries:${subjectId}:${page}:${resultsPerPage}`;
        const malformedData = "not an array";
        mockRedisGet.mockResolvedValue(malformedData);
        // When cached data is malformed, service treats it as cache miss and fetches from DB
        getIssueSummaries.mockResolvedValue([]);
        // Reset setex mock to resolve successfully (previous test may have set it to reject)
        mockRedisSetex.mockResolvedValue(undefined);

        const result = await issueService.getIssueSummaries(
          subjectId,
          page,
          resultsPerPage,
        );

        expect(mockRedisGet).toHaveBeenCalledWith(expectedCacheKey);
        // Service should return an array (fetched from DB when cache is malformed)
        expect(Array.isArray(result)).toBe(true);
        expect(getIssueSummaries).toHaveBeenCalled();
      });
    });
  });
});
