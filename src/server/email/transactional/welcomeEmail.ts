import type { EmailSendResponse } from "../types";
import type { DeliveryStatus } from "~/server/db/schema/deliveries";
import { emailService } from "../emailService";
import { userRepo } from "~/server/db/repo/userRepo";
import { getWelcomeEmail, getWelcomeEmailText } from "../templates";
import {
  MESSAGE_TAG_NAMES,
  EMAIL_TYPE_TAGS,
} from "../constants/messageTagNames";
import { env } from "~/env";

/**
 * Send welcome email to a user after signup
 * Email service handles delivery tracking automatically
 */
export async function sendWelcomeEmail(
  userId: string,
): Promise<EmailSendResponse> {
  try {
    // Get user details
    const user = await userRepo.findById(userId);
    if (!user) {
      return {
        status: "failed" as DeliveryStatus,
        error: "User not found",
        userId,
      };
    }

    const emailResult = await emailService.sendTransactionalEmail(
      {
        to: user.email,
        from: env.AWS_SES_FROM_EMAIL,
        subject: "Welcome to Daily System Design!",
        html: getWelcomeEmail(),
        text: getWelcomeEmailText(),
        userId,
        deliveryConfiguration: env.AWS_SES_TRANSACTIONAL_CONFIG_SET,
        tags: [
          {
            name: MESSAGE_TAG_NAMES.EMAIL_TYPE,
            value: EMAIL_TYPE_TAGS.WELCOME,
          },
        ],
      },
      "welcome",
    );

    console.log(`Welcome email sent to (userId: ${userId})`);
    return emailResult;
  } catch (error) {
    console.error(`Failed to send welcome email to userId ${userId}:`, error);

    return {
      status: "failed" as DeliveryStatus,
      error:
        error instanceof Error ? error.message : "Unknown welcome email error",
      userId,
    };
  }
}
