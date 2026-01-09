import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { BulkEmailSendResponseSchema } from "~/server/email/types";
import { sendJanuary2025UpdateAnnouncement } from "~/server/email/transactional/january2025UpdateAnnouncement";
import { subscriptionService } from "~/server/services/SubscriptionService";
import {
  SYSTEM_DESIGN_SUBJECT_ID,
  JANUARY_2025_UPDATE_CAMPAIGN_ID,
} from "~/lib/constants";
const { getJanuary2025UpdateAnnouncementContent } = await import(
  "~/server/email/templates/january2025UpdateAnnouncement"
);

export const marketingRouter = createTRPCRouter({
  /**
   * Preview January 2025 Update Announcement before sending
   */
  previewJanuary2025UpdateAnnouncement: adminProcedure.query(async () => {
    try {
      const activeSubscriberCount =
        await subscriptionService.getActiveUsersCount(SYSTEM_DESIGN_SUBJECT_ID);


      const content = getJanuary2025UpdateAnnouncementContent();

      return {
        campaignId: JANUARY_2025_UPDATE_CAMPAIGN_ID,
        recipientCount: activeSubscriberCount,
        subject: content.subject,
        htmlContent: content.htmlContent,
        htmlPreview: content.htmlContent.substring(0, 500) + "...",
        textPreview: content.textContent.substring(0, 300) + "...",
      };
    } catch (error) {
      console.error(
        "Error previewing January 2025 update announcement:",
        error,
      );
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to preview January 2025 update announcement",
      });
    }
  }),

  /**
   * Send January 2025 Update Announcement campaign
   */
  sendJanuary2025UpdateAnnouncement: adminProcedure
    .input(
      z.object({
        campaignId: z.string().min(1).default(JANUARY_2025_UPDATE_CAMPAIGN_ID),
      }),
    )
    .output(BulkEmailSendResponseSchema)
    .mutation(async ({ input }) => {
      try {
        console.log(
          `[${new Date().toISOString()}] [INFO] Admin triggered January 2025 update announcement`,
          {
            campaignId: input.campaignId,
          },
        );

        const result = await sendJanuary2025UpdateAnnouncement(
          input.campaignId,
        );

        console.log(
          `[${new Date().toISOString()}] [INFO] January 2025 update announcement completed`,
          {
            campaignId: input.campaignId,
            totalSent: result.totalSent,
            totalFailed: result.totalFailed,
            success: result.success,
          },
        );

        return result;
      } catch (error) {
        console.error("Error sending January 2025 update announcement:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to send January 2025 update announcement",
        });
      }
    }),
});
