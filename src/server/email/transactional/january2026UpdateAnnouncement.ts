import type { BulkEmailSendResponse } from "~/server/email/types";
import { sendCampaignToActiveUsers } from "~/server/email/campaigns/MarketingCampaignSender";
import { getJanuary2026UpdateAnnouncementContent } from "~/server/email/templates/january2026UpdateAnnouncement";
import { generateMarketingFeedbackPageUrl } from "~/lib/jwt/FeedbackTokenService";

function replacePlaceholders(content: string, feedbackUrl: string): string {
  return content.replace(/\{\{FEEDBACK_URL\}\}/g, feedbackUrl);
}

/**
 * Send January 2026 Update Announcement campaign to all eligible users.
 * Includes per-user feedback URL personalization.
 */
export async function sendJanuary2026UpdateAnnouncement(
  campaignId: string,
): Promise<BulkEmailSendResponse> {
  return sendCampaignToActiveUsers({
    campaignId,
    getContent: getJanuary2026UpdateAnnouncementContent,
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
