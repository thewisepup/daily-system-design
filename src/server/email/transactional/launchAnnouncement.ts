import type { BulkEmailSendResponse } from "~/server/email/types";
import { sendCampaignToActiveUsers } from "~/server/email/campaigns/MarketingCampaignSender";
import { getLaunchAnnouncementContent } from "~/server/email/templates/launchAnnouncement";

/**
 * Send launch announcement campaign to all eligible users.
 */
export async function sendLaunchAnnouncement(
  campaignId: string,
): Promise<BulkEmailSendResponse> {
  return sendCampaignToActiveUsers({
    campaignId,
    getContent: getLaunchAnnouncementContent,
  });
}
