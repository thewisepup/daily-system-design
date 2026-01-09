import type { BulkEmailSendResponse } from "~/server/email/types";
import { sendCampaignToActiveUsers } from "~/server/email/campaigns/MarketingCampaignSender";
import { getJanuary2025UpdateAnnouncementContent } from "~/server/email/templates/january2025UpdateAnnouncement";
import { generateMarketingFeedbackPageUrl } from "~/lib/jwt/FeedbackTokenService";

function replacePlaceholders(content: string, feedbackUrl: string): string {
  return content.replace(/\{\{FEEDBACK_URL\}\}/g, feedbackUrl);
}

/**
 * Send January 2025 Update Announcement campaign to all eligible users.
 * Includes per-user feedback URL personalization.
 */
export async function sendJanuary2025UpdateAnnouncement(
  campaignId: string,
): Promise<BulkEmailSendResponse> {
  return sendCampaignToActiveUsers({
    campaignId,
    getContent: getJanuary2025UpdateAnnouncementContent,
    personalizeContent: (content, user) => {
      const feedbackUrl = generateMarketingFeedbackPageUrl(user.id, campaignId);
      return {
        subject: content.subject,
        htmlContent: replacePlaceholders(content.htmlContent, feedbackUrl),
        textContent: replacePlaceholders(content.textContent, feedbackUrl),
      };
    },
  });
}
