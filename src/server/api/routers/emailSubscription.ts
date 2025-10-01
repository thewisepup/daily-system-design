import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { validateUnsubscribeToken } from "~/lib/unsubscribe";
import { subscriptionService } from "~/server/services/SubscriptionService";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

export const emailSubscriptionRouter = createTRPCRouter({
  validateUnsubscribe: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const tokenData = validateUnsubscribeToken(input.token);

        if (!tokenData) {
          return {
            valid: false,
            message: "Invalid or expired unsubscribe link: " + input.token,
          };
        }
        return {
          valid: true,
          userId: tokenData.userId,
          message: "Ready to unsubscribe.",
        };
      } catch (error) {
        console.error("Validate unsubscribe error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Unable to validate unsubscribe request. Please try again later. " +
            input.token,
        });
      }
    }),

  confirmUnsubscribe: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const tokenData = validateUnsubscribeToken(input.token);

        if (!tokenData) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired unsubscribe link.",
          });
        }
        const subscription = await subscriptionService.unsubscribe(
          tokenData.userId,
          SYSTEM_DESIGN_SUBJECT_ID,
        );
        console.log(
          `Unsubscribed user ${subscription.userId} successfully via confirmation page`,
        );

        return {
          success: true,
          message:
            "You have been successfully unsubscribed from our newsletter.",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Confirm unsubscribe error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Unable to process unsubscribe request. Please try again later." +
            input.token,
        });
      }
    }),
});
