import { env } from "~/env";
import { issueRepo } from "../db/repo/issueRepo";
import type { Issue, IssueStatus } from "../db/schema/issues";
import { redis } from "../redis";
import type { IssueSummary } from "../api/routers/issue";

class IssueService {
  private GET_ISSUE_BY_ID_TTL = 60 * 12 * 12; //12 hours TODO: figure out more optimial TTL
  private GET_ISSUES_SUMMARIES_TTL = 60 * 12 * 12; //12 hours TODO: figure out more optimial TTL

  async getIssueById(issueId: number): Promise<Issue | undefined> {
    //TODO: do validation
    const cacheKey = `${env.VERCEL_ENV}:daily-system-design:issue:${issueId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached as Issue;
    }
    const issue = issueRepo.findById(issueId);
    await redis.setex(cacheKey, this.GET_ISSUE_BY_ID_TTL, issue);
    return issue;
  }

  async changeIssueStatus(issueId: number, status: IssueStatus) {
    //issue.changeStatus(issueId, status);

    //cache invalidation
    return;
  }

  async getIssueSummaries(
    subjectId: number,
    numResults = 10,
  ): Promise<IssueSummary[]> {
    //TODO: do input validation
    const cacheKey = this.getIssueSummariesCacheKey(subjectId, numResults);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached as IssueSummary[];
    }
    const issueSummaries = await issueRepo.getIssueSummaries(
      subjectId,
      numResults,
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
    numResults: number,
  ): string {
    return `${env.VERCEL_ENV}:daily-system-design:issue-summaries:${subjectId}:${numResults}`;
  }
}
export const issueService = new IssueService();
