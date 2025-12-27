import { issueService } from "../IssueService";
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

  describe("changeIssueStatus", () => {
    it("returns undefined (stub implementation)", async () => {
      const result = await issueService.changeIssueStatus(1, "approved");

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
});
