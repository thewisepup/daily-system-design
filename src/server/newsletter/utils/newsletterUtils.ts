import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { newsletterSequenceRepo } from "~/server/db/repo/newsletterSequenceRepo";
import { deliveryRepo } from "~/server/db/repo/deliveryRepo";
import { emailService } from "~/server/email/emailService";
import {
  createNewsletterHtml,
  createNewsletterText,
} from "~/server/email/templates/newsletterTemplate";
import type {
  EmailSendRequest,
  BulkEmailSendRequest,
} from "~/server/email/types";
import {
  generateOneClickUnsubscribeUrl,
  generateUnsubscribePageUrl,
} from "~/lib/unsubscribe";
import { env } from "~/env";

import { topicRepo } from "~/server/db/repo/topicRepo";
import type { User } from "~/server/db/schema/users";
import type { NewsletterSequence } from "~/server/db/schema/newsletterSequence";
import type { Issue } from "~/server/db/schema/issues";
import type { Topic } from "~/server/db/schema/topics";

/**
 * Get today's newsletter by current sequence for a subject
 */
export async function getTodaysNewsletter(
  subjectId: number,
): Promise<{ issue: Issue; sequence: NewsletterSequence; topic: Topic }> {
  const sequence = await newsletterSequenceRepo.getOrCreate(subjectId);
  if (!sequence) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Failed to get or create newsletter sequence",
    });
  }
  const topic = await topicRepo.findBySubjectIdAndSequence(
    subjectId,
    sequence.currentSequence,
  );

  if (!topic) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `No topic found for subjectId ${subjectId} and sequence ${sequence.currentSequence}`,
    });
  }
  const issue = await issueRepo.findByTopicId(topic.id);
  canSendIssue(issue);
  return { issue: issue!, sequence, topic };
}

/**
 * Generate email headers including unsubscribe headers
 */
export function generateEmailHeaders(userId: string, userEmail: string) {
  // TODO: Add AWS SES tracking headers for email metrics by userId and issueId
  // TODO: Add campaign tracking headers
  // TODO: Add delivery receipt headers

  const oneClickUnsubscribeUrl = generateOneClickUnsubscribeUrl(
    userId,
    userEmail,
  );

  return {
    "List-Unsubscribe": `<${oneClickUnsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * Generate EmailSendRequest object for a single user
 */
export function generateEmailSendRequest(
  user: User,
  issue: Issue,
): EmailSendRequest {
  const unsubscribePageUrl = generateUnsubscribePageUrl(user.id, user.email);
  const headers = generateEmailHeaders(user.id, user.email);

  return {
    to: user.email,
    from: env.AWS_SES_FROM_EMAIL,
    subject: issue.title,
    html: createNewsletterHtml({
      title: issue.title,
      content: issue.content!, // Add non-null assertion since we check content exists earlier
      topicId: issue.topicId,
      unsubscribeUrl: unsubscribePageUrl, // Two-step flow for footer link
    }),
    text: createNewsletterText({
      title: issue.title,
      content: issue.content!,
      topicId: issue.topicId,
      unsubscribeUrl: unsubscribePageUrl,
    }),
    headers,
    userId: user.id,
  };
}

/**
 * Generate EmailSendRequest objects for a batch of users
 */
export async function generateEmailSendRequests(
  users: User[],
  issue: Issue,
): Promise<EmailSendRequest[]> {
  return users.map((user) => generateEmailSendRequest(user, issue));
}

/**
 * Process a single batch of users for newsletter delivery
 */
export async function processBatch(users: User[], issue: Issue) {
  if (users.length === 0) {
    return { totalSent: 0, totalFailed: 0, failedUserIds: [] };
  }
  const userIds = users.map((u) => u.id);
  try {
    const emailRequests = await generateEmailSendRequests(users, issue);
    const bulkRequest: BulkEmailSendRequest = {
      entries: emailRequests,
      from: env.AWS_SES_FROM_EMAIL,
      issue_id: issue.id,
    };
    const bulkResults = await emailService.sendBulkEmail(bulkRequest);
    return bulkResults;
  } catch (error) {
    console.error("Batch processing error:", error);

    //TODO: figure out if updating deliver repo here is a good idea for error handling
    const failedUpdates = userIds.map((userId) => ({
      userId,
      status: "failed" as const,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    }));

    deliveryRepo
      .bulkUpdateStatuses(issue.id, failedUpdates)
      .catch((updateError) => {
        console.error(
          "Failed to update failed delivery statuses:",
          updateError,
        );
      });

    return {
      totalSent: 0,
      totalFailed: users.length,
      failedUserIds: userIds,
    };
  }
}

export function canSendIssue(issue: Issue | undefined) {
  if (!issue) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Newsletter not found for this topic",
    });
  }

  if (issue.status !== "approved") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Cannot send newsletter with status: ${issue.status}. Newsletter must be approved first.`,
    });
  }

  if (!issue.content) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Newsletter content is empty",
    });
  }
}

export interface BatchAggregatedResults {
  totalSent: number;
  totalFailed: number;
  failedUserIds: string[];
  processedUsers: number;
}

/**
 * Helper function to aggregate batch results
 */
export function aggregateBatchResults(
  currentResults: BatchAggregatedResults,
  batchResults: {
    totalSent: number;
    totalFailed: number;
    failedUserIds: string[];
  },
): BatchAggregatedResults {
  return {
    totalSent: currentResults.totalSent + batchResults.totalSent,
    totalFailed: currentResults.totalFailed + batchResults.totalFailed,
    failedUserIds: [
      ...currentResults.failedUserIds,
      ...batchResults.failedUserIds,
    ],
    processedUsers:
      currentResults.processedUsers +
      batchResults.totalSent +
      batchResults.totalFailed,
  };
}
