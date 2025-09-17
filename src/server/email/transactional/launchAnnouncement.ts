import type { EmailSendRequest, BulkEmailSendResponse } from "~/server/email/types";
import { userService } from "~/server/services/UserService";
import { transactionalEmailRepo } from "~/server/db/repo/transactionalEmailRepo";
import { getLaunchAnnouncementContent } from "~/server/email/templates/launchAnnouncement";
import { MESSAGE_TAG_NAMES } from "~/server/email/constants/messageTagNames";
import { emailService } from "~/server/email/emailService";
import { env } from "~/env";

/**
 * Send launch announcement campaign to all eligible users
 * Processes users in batches, filters duplicates, and sends emails
 */
export async function sendLaunchAnnouncement(
  campaignId: string,
): Promise<BulkEmailSendResponse> {
  const allEmailRequests: EmailSendRequest[] = [];
  const BATCH_SIZE = 500; // User pagination batch size
  const emailContent = getLaunchAnnouncementContent();

  // Process users in batches like newsletter sending
  let page = 1;
  let hasMoreUsers = true;

  console.log(
    `[${new Date().toISOString()}] [INFO] Starting launch announcement campaign generation`,
    { campaignId },
  );

  while (hasMoreUsers) {
    // 1. Get batch of users with active subscriptions (using existing method)
    const userBatch = await userService.getUsersWithActiveSubscription(
      page,
      BATCH_SIZE,
    );

    if (userBatch.length === 0) {
      hasMoreUsers = false;
      break;
    }

    // 2. Check which users in this batch already received the campaign
    const userIds = userBatch.map((user) => user.id);
    const usersAlreadySent =
      await transactionalEmailRepo.getUsersWhoReceivedCampaign(
        userIds,
        "marketing",
        campaignId,
      );

    // 3. Filter out users who already received campaign
    const eligibleUsers = userBatch.filter(
      (user) => !usersAlreadySent.has(user.id),
    );

    // 4. Generate EmailSendRequests for eligible users
    const batchEmailRequests = eligibleUsers.map(
      (user): EmailSendRequest => ({
        to: user.email,
        from: env.AWS_SES_FROM_EMAIL,
        userId: user.id,
        subject: emailContent.subject,
        html: emailContent.htmlContent,
        text: emailContent.textContent,
        tags: [
          {
            name: MESSAGE_TAG_NAMES.EMAIL_TYPE,
            value: "marketing",
          },
          {
            name: MESSAGE_TAG_NAMES.CAMPAIGN_ID,
            value: campaignId,
          },
          {
            name: MESSAGE_TAG_NAMES.USER_ID,
            value: user.id,
          },
        ],
      }),
    );

    allEmailRequests.push(...batchEmailRequests);

    // Log progress similar to newsletter
    console.log(
      `[${new Date().toISOString()}] [INFO] Processed user batch: page ${page}, ${userBatch.length} users fetched, ${usersAlreadySent.size} already sent, ${eligibleUsers.length} eligible for campaign ${campaignId}`,
    );

    page++;
  }

  console.log(
    `[${new Date().toISOString()}] [INFO] Email request generation complete`,
    {
      campaignId,
      totalEmailRequests: allEmailRequests.length,
      totalPages: page - 1,
    },
  );

  // Send the emails using emailService
  if (allEmailRequests.length === 0) {
    console.log(
      `[${new Date().toISOString()}] [INFO] No eligible users found for campaign ${campaignId}`,
    );
    return {
      success: true,
      totalSent: 0,
      totalFailed: 0,
      failedUserIds: [],
    };
  }

  console.log(
    `[${new Date().toISOString()}] [INFO] Starting email delivery for campaign ${campaignId}`,
    {
      totalEmails: allEmailRequests.length,
    },
  );

  const result = await emailService.sendMarketingCampaign(
    allEmailRequests,
    "marketing",
    campaignId,
  );

  console.log(
    `[${new Date().toISOString()}] [INFO] Launch announcement campaign completed`,
    {
      campaignId,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
      success: result.success,
    },
  );

  return result;
}
