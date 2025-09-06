import { TRPCError } from "@trpc/server";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { userRepo } from "~/server/db/repo/userRepo";
import { emailService } from "~/server/email/emailService";

import type { SendNewsletterResponse } from "~/server/email/types";

import { env } from "~/env";
import {
  canSendIssue,
  generateEmailSendRequest,
} from "./utils/newsletterUtils";

export interface SendNewsletterToAdminRequest {
  topicId: number;
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
 * Future: Send newsletter to all subscribers
 */
export async function sendNewsletterToAllSubscribers(_topicId: number) {
  // TODO: Implement sending to all subscribers
  // This would involve:
  // 1. Fetch all active subscribers
  // 2. Get today's newsletter
  // 3. Send message in batches

  throw new Error("Not implemented yet - use sendNewsletterToAdmin for now");
}
