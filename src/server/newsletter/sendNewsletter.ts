import { TRPCError } from "@trpc/server";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { userRepo } from "~/server/db/repo/userRepo";
import { deliveryRepo } from "~/server/db/repo/deliveryRepo";
import { emailService } from "~/server/email/emailService";
import {
  createNewsletterHtml,
  createNewsletterText,
} from "~/server/email/templates/newsletterTemplate";
import type { SendNewsletterResponse } from "~/server/email/types";
import { env } from "~/env";

export interface SendNewsletterToAdminRequest {
  topicId: number;
}

/**
 * Send newsletter to admin email for testing/preview purposes
 */
export async function sendNewsletterToAdmin({
  topicId,
}: SendNewsletterToAdminRequest): Promise<SendNewsletterResponse> {
  // 1. Fetch newsletter from database
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

  // 3. Get or create admin user record
  let adminUser = await userRepo.findByEmail(env.ADMIN_EMAIL);

  adminUser ??= await userRepo.create({ email: env.ADMIN_EMAIL });

  if (!adminUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create or retrieve admin user",
    });
  }

  // 4. Create delivery record
  const delivery = await deliveryRepo.create({
    issueId: issue.id,
    userId: adminUser.id,
    status: "pending",
  });

  if (!delivery) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create delivery record",
    });
  }

  try {
    // 5. Prepare email content
    const emailHtml = createNewsletterHtml({
      title: issue.title,
      content: issue.content,
      topicId,
    });

    const emailText = createNewsletterText({
      title: issue.title,
      content: issue.content,
      topicId,
    });

    // 6. Send email via email service
    const emailResponse = await emailService.sendEmail({
      to: env.ADMIN_EMAIL,
      from: `Daily System Design <noreply@${env.ADMIN_EMAIL.split("@")[1] ?? "example.com"}>`,
      subject: `[PREVIEW] ${issue.title}`,
      html: emailHtml,
      text: emailText,
    });

    // 7. Update delivery status based on email response
    if (emailResponse.success) {
      await deliveryRepo.updateStatus(delivery.id, "sent", {
        externalId: emailResponse.messageId,
        sentAt: new Date(),
      });

      // Update issue sent timestamp if this is the first successful send
      if (!issue.sentAt) {
        await issueRepo.update(issue.id, { sentAt: new Date() });
      }

      return {
        success: true,
        deliveryId: delivery.id,
        messageId: emailResponse.messageId,
      };
    } else {
      await deliveryRepo.updateStatus(delivery.id, "failed", {
        errorMessage: emailResponse.error ?? "Unknown email error",
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to send email: ${emailResponse.error}`,
      });
    }
  } catch (error) {
    // Update delivery status to failed if not already updated
    const currentDelivery = await deliveryRepo.findById(delivery.id);
    if (currentDelivery?.status === "pending") {
      await deliveryRepo.updateStatus(delivery.id, "failed", {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }

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
  // 3. Send message to SQS

  throw new Error("Not implemented yet - use sendNewsletterToAdmin for now");
}
