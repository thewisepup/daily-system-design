import { env } from "~/env";
import { issueRepo } from "../db/repo/issueRepo";
import type { Issue, IssueStatus } from "../db/schema/issues";
import { redis } from "../redis";
import type { IssueSummary } from "../api/routers/issue";

class IssueService {
  private GET_ISSUE_BY_ID_TTL = 12 * 60 * 60; //12 hours TODO: figure out more optimial TTL
  private GET_ISSUES_SUMMARIES_TTL = 5 * 60; //5 min TODO: figure out more optimial TTL

  //TODO: we need to make this so that it is getSentIssueById
  async getSentIssueById(issueId: number): Promise<Issue | undefined> {
    //TODO: do validation and caching
    // const cacheKey = `${env.VERCEL_ENV}:daily-system-design:sent-issue:${issueId}`;
    // const cached = await redis.get(cacheKey);
    // if (cached) {
    //   return cached as Issue;
    // }
    const issue = await issueRepo.getSentIssueById(issueId);
    // await redis.setex(cacheKey, this.GET_ISSUE_BY_ID_TTL, issue);
    return issue;
  }

  async getLatestSentIssue(subjectId: number): Promise<Issue | undefined> {
    // const cacheKey = `${env.VERCEL_ENV}:daily-system-design:latest-sent-issue:${subjectId}`;
    // const cached = await redis.get(cacheKey);
    // if (cached) {
    //   return cached as Issue;
    // }
    const issue = await issueRepo.getLatestSentIssue(subjectId);
    // if (issue) {
    //   await redis.setex(cacheKey, this.GET_ISSUE_BY_ID_TTL, issue);
    // }
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
    //TODO: do input validation
    const cacheKey = this.getIssueSummariesCacheKey(
      subjectId,
      page,
      resultsPerPage,
    );
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached as IssueSummary[];
    }
    const offset = (page - 1) * resultsPerPage;
    const issueSummaries = await issueRepo.getIssueSummaries(
      subjectId,
      offset,
      resultsPerPage,
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
}
export const issueService = new IssueService();
