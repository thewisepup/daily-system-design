import { TRPCError } from "@trpc/server";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { userRepo } from "~/server/db/repo/userRepo";
import { newsletterSequenceRepo } from "~/server/db/repo/newsletterSequenceRepo";
import { emailService } from "~/server/email/emailService";

import type { SendNewsletterResponse } from "~/server/email/types";

import { env } from "~/env";
import {
  canSendIssue,
  generateEmailSendRequest,
  getTodaysNewsletter,
  processAllUsersInBatches,
  type BatchAggregatedResults,
} from "./utils/newsletterUtils";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

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
}: SendNewsletterToAdminRequest): Promise<SendNewsletterResponse> {
  const issue = await issueRepo.findByTopicId(topicId);
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
  console.log("sendNewsletterToAdmin ", sequenceNumber);
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
    await issueRepo.update(issue!.id, { sentAt: new Date() });
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
  console.log(
    `Starting daily newsletter cron job... [${new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}]`,
  );

  try {
    const { issue, sequence, topic } = await getTodaysNewsletter(subjectId);
    console.log("Todays newsletter issue is #" + sequence.currentSequence);
    results = await processAllUsersInBatches(
      issue,
      topic.sequenceOrder,
      subjectId,
    );
    console.log("Newsletter sent to all users");
    const newsletterSequence =
      await newsletterSequenceRepo.incrementSequence(subjectId);
    console.log(
      "Newsletter sequence incremented to #" +
        newsletterSequence?.currentSequence,
    );
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
