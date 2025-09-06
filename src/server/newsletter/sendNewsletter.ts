import { TRPCError } from "@trpc/server";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { userRepo } from "~/server/db/repo/userRepo";
import { newsletterSequenceRepo } from "~/server/db/repo/newsletterSequenceRepo";
import { emailService } from "~/server/email/emailService";

import type { SendNewsletterResponse } from "~/server/email/types";

import { env } from "~/env";
import {
  aggregateBatchResults,
  canSendIssue,
  generateEmailSendRequest,
  getTodaysNewsletter,
  processBatch,
  type BatchAggregatedResults,
} from "./utils/newsletterUtils";
import { BULK_EMAIL_CONSTANTS } from "~/server/email/constants/bulkEmailConstants";

export interface SendNewsletterToAdminRequest {
  topicId: number;
}

export interface SendNewsletterToAllSubscribersResponse {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  failedUserIds: string[];
  issueId: number;
  sequenceNumber: number;
  processedUsers: number;
  error?: string;
}

/**
 * Send newsletter to admin email for testing/preview purposes
 */
export async function sendNewsletterToAdmin({
  topicId,
}: SendNewsletterToAdminRequest): Promise<SendNewsletterResponse> {
  const issue = await issueRepo.findByTopicId(topicId);

  if (!issue) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Newsletter not found for this topic",
    });
  }

  // 2. Validate newsletter is approved
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
  canSendIssue(issue);

  // 3. Get or create admin user record
  let adminUser = await userRepo.findByEmail(env.ADMIN_EMAIL);

  adminUser ??= await userRepo.create({ email: env.ADMIN_EMAIL });

  if (!adminUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create or retrieve admin user",
    });
  }

  try {
    const emailSendRequest = generateEmailSendRequest(adminUser, issue);
    const emailResponse = await emailService.sendEmail(emailSendRequest);
    await issueRepo.update(issue.id, { sentAt: new Date() });
    return {
      success: true,
      messageId: emailResponse.messageId,
    };
  } catch (error) {
    // Re-throw TRPC errors as-is
    if (error instanceof TRPCError) {
      throw error;
    }
    // Wrap other errors
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        error instanceof Error ? error.message : "Failed to send newsletter",
    });
  }
}

/**
 * Send newsletter to all subscribers using batch processing
 */
export async function sendNewsletterToAllSubscribers(
  subjectId: number,
): Promise<SendNewsletterToAllSubscribersResponse> {
  let results: BatchAggregatedResults = {
    totalSent: 0,
    totalFailed: 0,
    failedUserIds: [],
    processedUsers: 0,
  };
  try {
    const { issue, sequence } = await getTodaysNewsletter(subjectId);
    let page = 1;
    const batchSize = BULK_EMAIL_CONSTANTS.DB_FETCH_SIZE;

    while (true) {
      const users = await userRepo.findWithPagination(page, batchSize);
      // No more users to process
      if (users.length === 0) {
        break;
      }
      const batchResults = await processBatch(users, issue);
      results = aggregateBatchResults(results, batchResults);
      // Move to next page
      page++;
      // If we got fewer users than the batch size, we've reached the end
      if (users.length < batchSize) {
        break;
      }
    }
    await newsletterSequenceRepo.incrementSequence(subjectId);
    return {
      ...results,
      success: true,
      issueId: issue.id,
      sequenceNumber: sequence.currentSequence,
    };
  } catch (error) {
    console.error("Failed to send newsletter to all subscribers:", error);
    return {
      success: false,
      totalSent: 0,
      totalFailed: 0,
      failedUserIds: [],
      issueId: 0,
      sequenceNumber: 0,
      processedUsers: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
