import type {
  EmailSendRequest,
  BulkEmailSendResponse,
} from "~/server/email/types";
import { userService } from "~/server/services/UserService";
import { transactionalEmailRepo } from "~/server/db/repo/transactionalEmailRepo";
import { MESSAGE_TAG_NAMES } from "~/server/email/constants/messageTagNames";
import { emailService } from "~/server/email/emailService";
import { DB_FETCH_SIZE } from "~/server/email/constants/bulkEmailConstants";
import { env } from "~/env";

interface EmailContent {
  subject: string;
  htmlContent: string;
  textContent: string;
}

interface CampaignUser {
  id: string;
  email: string;
}

export interface MarketingCampaignConfig {
  campaignId: string;
  getContent: () => EmailContent;
  personalizeContent?: (
    content: EmailContent,
    user: CampaignUser,
  ) => EmailContent;
}

function buildEmailRequest(
  user: CampaignUser,
  content: EmailContent,
  campaignId: string,
): EmailSendRequest {
  return {
    to: user.email,
    from: env.AWS_SES_FROM_EMAIL,
    userId: user.id,
    subject: content.subject,
    html: content.htmlContent,
    text: content.textContent,
    deliveryConfiguration: env.AWS_SES_TRANSACTIONAL_CONFIG_SET,
    tags: [
      { name: MESSAGE_TAG_NAMES.EMAIL_TYPE, value: "marketing" },
      { name: MESSAGE_TAG_NAMES.CAMPAIGN_ID, value: campaignId },
      { name: MESSAGE_TAG_NAMES.USER_ID, value: user.id },
    ],
  };
}

/**
 * Send a marketing campaign to all users with active subscriptions.
 */
export async function sendCampaignToActiveUsers(
  config: MarketingCampaignConfig,
): Promise<BulkEmailSendResponse> {
  const result = await buildAndSendMarketingCampaign(config);

  console.log(
    `[Campaign: ${config.campaignId}] Completed - ${result.totalSent} sent, ${result.totalFailed} failed`,
  );

  return result;
}

async function filterUsersNotYetReceived(
  users: CampaignUser[],
  campaignId: string,
): Promise<CampaignUser[]> {
  const userIds = users.map((u) => u.id);
  const alreadySent = await transactionalEmailRepo.getUsersWhoReceivedCampaign(
    userIds,
    "marketing",
    campaignId,
  );
  return users.filter((user) => !alreadySent.has(user.id));
}

function getContentForUser(
  baseContent: EmailContent,
  user: CampaignUser,
  personalizer?: MarketingCampaignConfig["personalizeContent"],
): EmailContent {
  return personalizer ? personalizer(baseContent, user) : baseContent;
}

async function buildAndSendMarketingCampaign(
  config: MarketingCampaignConfig,
): Promise<BulkEmailSendResponse> {
  const baseContent = config.getContent();
  let page = 1;
  let totalSent = 0;
  let totalFailed = 0;
  const allFailedUserIds: string[] = [];

  while (true) {
    const userBatch = await userService.getUsersWithActiveSubscription(
      page,
      DB_FETCH_SIZE,
    );
    if (userBatch.length === 0) break;

    const eligibleUsers = await filterUsersNotYetReceived(
      userBatch,
      config.campaignId,
    );
    if (eligibleUsers.length === 0) continue;

    const batchRequests = eligibleUsers.map((user) => {
      const content = getContentForUser(
        baseContent,
        user,
        config.personalizeContent,
      );
      return buildEmailRequest(user, content, config.campaignId);
    });

    const result = await emailService.sendMarketingCampaign(
      batchRequests,
      "marketing",
      config.campaignId,
    );

    totalSent += result.totalSent;
    totalFailed += result.totalFailed;
    allFailedUserIds.push(...result.failedUserIds);

    page++;
  }

  return {
    success: totalFailed === 0,
    totalSent,
    totalFailed,
    failedUserIds: allFailedUserIds,
  };
}
