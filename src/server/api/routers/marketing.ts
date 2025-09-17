import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { BulkEmailSendResponseSchema } from "~/server/email/types";
import { sendLaunchAnnouncement } from "~/server/email/transactional/launchAnnouncement";
import { subscriptionService } from "~/server/services/SubscriptionService";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

export const marketingRouter = createTRPCRouter({
  /**
   * Send launch announcement campaign
   */
  sendLaunchAnnouncement: adminProcedure
    .input(
      z.object({
        campaignId: z
          .string()
          .min(1)
          .default("marketing-launch-announcement-2025"),
      }),
    )
    .output(BulkEmailSendResponseSchema)
    .mutation(async ({ input }) => {
      try {
        console.log(
          `[${new Date().toISOString()}] [INFO] Admin triggered launch announcement`,
          {
            campaignId: input.campaignId,
          },
        );

        const result = await sendLaunchAnnouncement(input.campaignId);

        console.log(
          `[${new Date().toISOString()}] [INFO] Launch announcement completed`,
          {
            campaignId: input.campaignId,
            totalSent: result.totalSent,
            totalFailed: result.totalFailed,
            success: result.success,
          },
        );

        return result;
      } catch (error) {
        console.error("Error sending launch announcement:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to send launch announcement",
        });
      }
    }),

  /**
   * Preview launch announcement before sending
   */
  previewLaunchAnnouncement: adminProcedure
    .input(
      z.object({
        campaignId: z
          .string()
          .min(1)
          .default("marketing-launch-announcement-2025"),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Get total active subscriber count
        const activeSubscriberCount =
          await subscriptionService.getActiveUsersCount(
            SYSTEM_DESIGN_SUBJECT_ID,
          );

        // Get sample content
        const { getLaunchAnnouncementContent } = await import(
          "~/server/email/templates/launchAnnouncement"
        );
        const content = getLaunchAnnouncementContent();

        return {
          campaignId: input.campaignId,
          recipientCount: activeSubscriberCount,
          subject: content.subject,
          htmlContent: content.htmlContent,
          htmlPreview: content.htmlContent.substring(0, 500) + "...",
          textPreview: content.textContent.substring(0, 300) + "...",
        };
      } catch (error) {
        console.error("Error previewing launch announcement:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to preview launch announcement",
        });
      }
    }),
});
