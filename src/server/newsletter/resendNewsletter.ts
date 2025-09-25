import { TRPCError } from "@trpc/server";
import { deliveryRepo } from "~/server/db/repo/deliveryRepo";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { topicRepo } from "~/server/db/repo/topicRepo";
import { userService } from "~/server/services/UserService";
import { emailService } from "~/server/email/emailService";
import type {
  BulkEmailSendResponse,
  SendNewsletterRequest,
} from "~/server/email/types";
import {
  generateEmailSendRequests,
  canSendIssue,
} from "./utils/newsletterUtils";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

export interface ResendNewsletterResponse extends BulkEmailSendResponse {
  issueId: number;
  resendCount: number;
}

/**
 * Resend newsletter to users with failed or pending deliveries for a specific issue
 * @param issueId Newsletter issue ID to resend
 * @returns Results of the resend operation
 */
export async function resendNewsletterToFailedUsers(
  issueId: number,
): Promise<ResendNewsletterResponse> {
  console.log(
    `[${new Date().toISOString()}] [INFO] Starting newsletter resend`,
    { issueId },
  );

  // Get the issue and validate it can be resent
  const issue = await issueRepo.findById(issueId);
  if (!issue) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Newsletter issue with ID ${issueId} not found`,
    });
  }

  // Only allow resending for sent newsletters
  if (issue.status !== "sent") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Can only resend failed deliveries for sent newsletters",
    });
  }

  // Get the topic to retrieve the sequence number
  const topic = await topicRepo.findById(issue.topicId);
  if (!topic) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Topic for issue ${issueId} not found`,
    });
  }

  // Get active subscribers with failed or pending deliveries
  const activeUsers =
    await deliveryRepo.findActiveSubscribersWithFailedDeliveries(issueId);

  if (activeUsers.length === 0) {
    console.log(
      `[${new Date().toISOString()}] [INFO] No active subscribers with failed deliveries found for resend`,
      { issueId },
    );

    return {
      success: true,
      totalSent: 0,
      totalFailed: 0,
      failedUserIds: [],
      issueId,
      resendCount: 0,
    };
  }

  console.log(
    `[${new Date().toISOString()}] [INFO] Found active subscribers for resend`,
    { issueId, resendCount: activeUsers.length },
  );

  try {
    console.log(
      `[${new Date().toISOString()}] [INFO] Generating email requests for resend`,
      {
        issueId,
        activeUserCount: activeUsers.length,
        sequenceNumber: topic.sequenceOrder,
      },
    );

    // Generate email requests for the active users using the topic's sequence number
    const emailRequests = await generateEmailSendRequests(
      activeUsers,
      issue,
      SYSTEM_DESIGN_SUBJECT_ID,
      topic.sequenceOrder, // Use the topic's sequence number
    );

    // Create the bulk request
    const bulkRequest: SendNewsletterRequest = {
      entries: emailRequests,
      issue_id: issue.id,
    };

    // Send the emails using the existing email service
    const result = await emailService.sendNewsletterIssue(bulkRequest);

    console.log(
      `[${new Date().toISOString()}] [INFO] Newsletter resend completed`,
      {
        issueId,
        sequenceNumber: topic.sequenceOrder,
        resendCount: activeUsers.length,
        totalSent: result.totalSent,
        totalFailed: result.totalFailed,
        successRate:
          activeUsers.length > 0
            ? `${Math.round((result.totalSent / activeUsers.length) * 100)}%`
            : "0%",
      },
    );

    return {
      ...result,
      issueId,
      resendCount: activeUsers.length,
    };
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [ERROR] Newsletter resend failed`,
      {
        issueId,
        resendCount: activeUsers.length,
        error: error instanceof Error ? error.message : String(error),
      },
    );

    // Re-throw TRPC errors as-is
    if (error instanceof TRPCError) {
      throw error;
    }

    // Wrap other errors
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to resend newsletter to failed users",
      cause: error,
    });
  }
}
