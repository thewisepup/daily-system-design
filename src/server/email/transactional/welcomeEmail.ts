import type { EmailSendResponse } from "../types";
import type { DeliveryStatus } from "~/server/db/schema/deliveries";
import { emailService } from "../emailService";
import {
  getWelcomeEmail,
  getWelcomeEmailText,
} from "../templates/welcomeTemplate";
import { MESSAGE_TAG_NAMES } from "../constants/messageTagNames";

import { env } from "~/env";
import { userService } from "~/server/services/UserService";

/**
 * Send welcome email to a user after signup
 * Email service handles delivery tracking automatically
 */
export async function sendWelcomeEmail(
  userId: string,
): Promise<EmailSendResponse> {
  try {
    const user = await userService.findByUserId(userId);
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
          { name: MESSAGE_TAG_NAMES.EMAIL_TYPE, value: "welcome" },
          { name: MESSAGE_TAG_NAMES.USER_ID, value: userId },
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
