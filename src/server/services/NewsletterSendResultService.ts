import { newsletterSendResultRepo } from "../db/repo/newsletterSendResultRepo";
import type { NewsletterSendResult } from "~/server/db/schema/newsletterSendResults";

export class NewsletterSendResultService {
  /**
   * Record the start of a newsletter send operation
   */
  async recordSendStart(data: {
    name: string;
    issueId: number;
    startTime: Date;
  }): Promise<NewsletterSendResult | null> {
    try {
      console.log(
        `[${new Date().toISOString()}] [INFO] Recording newsletter send start`,
        {
          name: data.name,
          issueId: data.issueId,
          startTime: data.startTime.toISOString(),
        },
      );

      const result = await newsletterSendResultRepo.create({
        name: data.name,
        issueId: data.issueId,
        startTime: data.startTime,
      });

      if (!result) {
        console.warn(
          `[${new Date().toISOString()}] [WARN] Failed to create newsletter send result - no result returned`,
        );
        return null;
      }

      return result;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ERROR] Failed to record newsletter send start`,
        {
          error: error instanceof Error ? error.message : String(error),
          name: data.name,
          issueId: data.issueId,
        },
      );
      return null;
    }
  }

  /**
   * Record the completion of a newsletter send operation
   */
  async recordSendCompletion(
    resultId: number | null,
    data: {
      totalSent: number;
      totalFailed: number;
      failedUserIds: string[];
    },
  ): Promise<NewsletterSendResult | null> {
    if (!resultId) {
      console.warn(
        `[${new Date().toISOString()}] [WARN] Cannot record completion - no result ID provided`,
      );
      return null;
    }

    try {
      const completionTime = new Date();

      console.log(
        `[${new Date().toISOString()}] [INFO] Recording newsletter send completion`,
        {
          resultId,
          totalSent: data.totalSent,
          totalFailed: data.totalFailed,
          failedCount: data.failedUserIds.length,
          completionTime: completionTime.toISOString(),
        },
      );

      const result = await newsletterSendResultRepo.updateCompletion(resultId, {
        ...data,
        completionTime,
      });

      if (!result) {
        console.warn(
          `[${new Date().toISOString()}] [WARN] Failed to update newsletter send completion - no result returned`,
        );
        return null;
      }

      return result;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ERROR] Failed to record newsletter send completion`,
        {
          error: error instanceof Error ? error.message : String(error),
          resultId,
          totalSent: data.totalSent,
          totalFailed: data.totalFailed,
        },
      );
      return null;
    }
  }

  /**
   * Get newsletter send results for a specific issue
   */
  async getResultsByIssue(issueId: number): Promise<NewsletterSendResult[]> {
    return await newsletterSendResultRepo.findByIssueId(issueId);
  }

  /**
   * Get latest newsletter send results
   */
  async getLatestResults(limit = 10): Promise<NewsletterSendResult[]> {
    return await newsletterSendResultRepo.findLatest(limit);
  }

  /**
   * Get specific newsletter send result by ID
   */
  async getResultById(id: number): Promise<NewsletterSendResult | undefined> {
    return await newsletterSendResultRepo.findById(id);
  }
}

export const newsletterSendResultService = new NewsletterSendResultService();
