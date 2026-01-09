import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { BulkEmailSendResponseSchema } from "~/server/email/types";
import { sendJanuary2026UpdateAnnouncement } from "~/server/email/transactional/january2026UpdateAnnouncement";
import { subscriptionService } from "~/server/services/SubscriptionService";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { MARKETING_CAMPAIGNS } from "~/lib/constants/campaigns";
const { getJanuary2026UpdateAnnouncementContent } = await import(
  "~/server/email/templates/january2026UpdateAnnouncement"
);

export const marketingRouter = createTRPCRouter({
  /**
   * Preview January 2026 Update Announcement before sending
   */
  previewJanuary2026UpdateAnnouncement: adminProcedure.query(async () => {
    try {
      const activeSubscriberCount =
        await subscriptionService.getActiveUsersCount(SYSTEM_DESIGN_SUBJECT_ID);

      const content = getJanuary2026UpdateAnnouncementContent();

      return {
        campaignId: MARKETING_CAMPAIGNS.JANUARY_2026_UPDATE,
        recipientCount: activeSubscriberCount,
        subject: content.subject,
        htmlContent: content.htmlContent,
        htmlPreview: content.htmlContent.substring(0, 500) + "...",
        textPreview: content.textContent.substring(0, 300) + "...",
      };
    } catch (error) {
      console.error(
        "Error previewing January 2026 update announcement:",
        error,
      );
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to preview January 2026 update announcement",
      });
    }
  }),

  /**
   * Send January 2026 Update Announcement campaign
   */
  sendJanuary2026UpdateAnnouncement: adminProcedure
    .input(
      z.object({
        campaignId: z
          .string()
          .min(1)
          .default(MARKETING_CAMPAIGNS.JANUARY_2026_UPDATE),
      }),
    )
    .output(BulkEmailSendResponseSchema)
    .mutation(async ({ input }) => {
      try {
        console.log(
          `[${new Date().toISOString()}] [INFO] Admin triggered January 2026 update announcement`,
          {
            campaignId: input.campaignId,
          },
        );

        const result = await sendJanuary2026UpdateAnnouncement(
          input.campaignId,
        );

        console.log(
          `[${new Date().toISOString()}] [INFO] January 2026 update announcement completed`,
          {
            campaignId: input.campaignId,
            totalSent: result.totalSent,
            totalFailed: result.totalFailed,
            success: result.success,
          },
        );

        return result;
      } catch (error) {
        console.error("Error sending January 2026 update announcement:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to send January 2026 update announcement",
        });
      }
    }),
});
