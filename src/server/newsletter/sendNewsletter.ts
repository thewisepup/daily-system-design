import { TRPCError } from "@trpc/server";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { newsletterSequenceRepo } from "~/server/db/repo/newsletterSequenceRepo";
import { emailService } from "~/server/email/emailService";

import type { SendNewsletterToAdminResponse } from "~/server/email/types";

import { env } from "~/env";
import {
  canSendIssue,
  generateEmailSendRequest,
  getTodaysNewsletter,
  processAllUsersInBatches,
  type BatchAggregatedResults,
} from "./utils/newsletterUtils";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { userService } from "../services/UserService";
import { newsletterSendResultService } from "../services/NewsletterSendResultService";

export interface SendNewsletterToAdminRequest {
  topicId: number;
  sequenceNumber: number;
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
  sequenceNumber,
}: SendNewsletterToAdminRequest): Promise<SendNewsletterToAdminResponse> {
  const issue = await issueRepo.findByTopicId(topicId);
  canSendIssue(issue);

  let adminUser = await userService.findByEmail(env.ADMIN_EMAIL);

  adminUser ??= await userService.createUser(env.ADMIN_EMAIL);

  if (!adminUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create or retrieve admin user",
    });
  }
  console.log(
    `[${new Date().toISOString()}] [INFO] Sending newsletter to admin`,
    {
      topicId,
      sequenceNumber,
      adminEmail: env.ADMIN_EMAIL,
      issueId: issue!.id,
    },
  );
  try {
    const emailSendRequest = generateEmailSendRequest(
      adminUser,
      issue!,
      SYSTEM_DESIGN_SUBJECT_ID,
      sequenceNumber,
    );
    const emailResponse = await emailService.sendNewsletterEmail(
      emailSendRequest,
      issue!.id,
    );
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
  const startTime = Date.now();
  let sendResultRecord: { id: number } | null = null;
  console.log(
    `[${new Date().toISOString()}] [INFO] Starting daily newsletter delivery`,
    {
      subjectId,
      date: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
    },
  );

  try {
    const { issue, sequence, topic } = await getTodaysNewsletter(subjectId);
    console.log(`[${new Date().toISOString()}] [INFO] Newsletter selected`, {
      issueId: issue.id,
      sequenceNumber: sequence.currentSequence,
      topicTitle: topic.title,
      issueTitle: issue.title,
    });

    // Record the start of newsletter send operation
    sendResultRecord = await newsletterSendResultService.recordSendStart({
      name: issue.title,
      issueId: issue.id,
      startTime: new Date(startTime),
    });
    results = await processAllUsersInBatches(
      issue,
      topic.sequenceOrder,
      subjectId,
    );

    const deliveryDuration = Date.now() - startTime;
    const newsletterSequence =
      await newsletterSequenceRepo.incrementSequence(subjectId);

    await issueRepo.update(issue.id, {
      status: "sent",
      sentAt: new Date(),
    });

    console.log(
      `[${new Date().toISOString()}] [INFO] Newsletter delivery completed successfully`,
      {
        issueId: issue.id,
        sequenceNumber: sequence.currentSequence,
        nextSequence: newsletterSequence?.currentSequence,
        totalSent: results.totalSent,
        totalFailed: results.totalFailed,
        successRate:
          results.processedUsers > 0
            ? `${Math.round((results.totalSent / results.processedUsers) * 100)}%`
            : "0%",
        duration: `${deliveryDuration}ms`,
        processedUsers: results.processedUsers,
      },
    );

    // Record the completion of newsletter send operation
    await newsletterSendResultService.recordSendCompletion(
      sendResultRecord?.id ?? null,
      {
        totalSent: results.totalSent,
        totalFailed: results.totalFailed,
        failedUserIds: results.failedUserIds,
      },
    );
    return {
      ...results,
      success: true,
      issueId: issue.id,
      sequenceNumber: sequence.currentSequence,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[${new Date().toISOString()}] [ERROR] Newsletter delivery failed`,
      {
        subjectId,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
      },
    );

    // Record completion even on failure with partial results
    await newsletterSendResultService.recordSendCompletion(
      sendResultRecord?.id ?? null,
      {
        totalSent: results.totalSent,
        totalFailed: results.totalFailed,
        failedUserIds: results.failedUserIds,
      },
    );

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
