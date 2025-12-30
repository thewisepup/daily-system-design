import { env } from "~/env";
import { issueRepo } from "../db/repo/issueRepo";
import type { Issue, IssueStatus } from "../db/schema/issues";
import { redis, CACHE_TTL, CACHE_KEYS } from "../redis";
import type { IssueSummary } from "../api/routers/issue";

class IssueService {
  private GET_ISSUES_SUMMARIES_TTL = 5 * 60;

  async getSentIssueById(issueId: number): Promise<Issue | undefined> {
    const cacheKey = CACHE_KEYS.SENT_ISSUE(issueId);
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return this.deserializeIssue(cached);
    }
    const issue = await issueRepo.getSentIssueById(issueId);
    if (issue) {
      await redis.setex(cacheKey, CACHE_TTL.SENT_ISSUE, issue);
    }
    return issue;
  }

  /**
   * Retrieves the most recently sent issue for a given subject.
   * Includes caching support with Redis.
   *
   * @param subjectId - The ID of the subject to query issues for
   * @returns The latest sent issue, or undefined if no sent issues exist for the subject
   */
  async getLatestSentIssue(subjectId: number): Promise<Issue | undefined> {
    const cacheKey = CACHE_KEYS.LATEST_SENT_ISSUE(subjectId);
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return this.deserializeIssue(cached);
    }
    const issue = await issueRepo.getLatestSentIssue(subjectId);
    if (issue) {
      await redis.setex(cacheKey, CACHE_TTL.SENT_ISSUE, issue);
    }
    return issue;
  }

  async changeIssueStatus(_issueId: number, _status: IssueStatus) {
    //validate status change is valid
    //issue.changeStatus(issueId, status);
    //cache invalidation if needed
    return;
  }

  async getIssueSummaries(
    subjectId: number,
    page = 1,
    resultsPerPage = 10,
  ): Promise<IssueSummary[]> {
    const normalizedPage = page <= 0 ? 1 : page;
    const normalizedResultsPerPage = resultsPerPage < 0 ? 0 : resultsPerPage;

    // Use original values for cache key to match test expectations
    const cacheKey = this.getIssueSummariesCacheKey(
      subjectId,
      page,
      resultsPerPage,
    );
    const cached = await redis.get(cacheKey);
    if (cached) {
      // Validate cached data is an array before returning
      if (Array.isArray(cached)) {
        return cached as IssueSummary[];
      }
      // If cached data is malformed, treat as cache miss and fetch from DB
    }
    const offset = (normalizedPage - 1) * normalizedResultsPerPage;
    const issueSummaries = await issueRepo.getIssueSummaries(
      subjectId,
      offset,
      normalizedResultsPerPage,
    );
    // Filter out any null values to ensure type safety
    const validIssueSummaries = issueSummaries.filter(
      (summary): summary is IssueSummary =>
        summary.issueId !== null && summary.title !== null,
    );
    await redis.setex(
      cacheKey,
      this.GET_ISSUES_SUMMARIES_TTL,
      validIssueSummaries,
    );
    return validIssueSummaries;
  }

  private getIssueSummariesCacheKey(
    subjectId: number,
    page: number,
    resultsPerPage: number,
  ): string {
    return `${env.VERCEL_ENV}:daily-system-design:issue-summaries:${subjectId}:${page}:${resultsPerPage}`;
  }

  /**
   * Deserializes an Issue object from Redis cache, converting Date string fields back to Date objects.
   * Redis serializes Date objects to strings, so we need to convert them back.
   *
   * @param cached - The cached Issue object (may have Date fields as strings)
   * @returns Issue object with proper Date objects
   */
  private deserializeIssue(cached: unknown): Issue {
    const issue = cached as Record<string, unknown>;
    return {
      ...issue,
      createdAt:
        issue.createdAt instanceof Date
          ? issue.createdAt
          : new Date(issue.createdAt as string),
      updatedAt: issue.updatedAt
        ? issue.updatedAt instanceof Date
          ? issue.updatedAt
          : new Date(issue.updatedAt as string)
        : null,
      approvedAt: issue.approvedAt
        ? issue.approvedAt instanceof Date
          ? issue.approvedAt
          : new Date(issue.approvedAt as string)
        : null,
      sentAt: issue.sentAt
        ? issue.sentAt instanceof Date
          ? issue.sentAt
          : new Date(issue.sentAt as string)
        : null,
    } as Issue;
  }
}
export const issueService = new IssueService();
