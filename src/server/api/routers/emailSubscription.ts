import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { validateUnsubscribeToken } from "~/lib/unsubscribe";

export const emailSubscriptionRouter = createTRPCRouter({
  // One-click unsubscribe for List-Unsubscribe header (RFC compliant)
  oneClickUnsubscribe: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Validate token
        const tokenData = validateUnsubscribeToken(input.token);

        if (!tokenData) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired unsubscribe link.",
          });
        }

        // TODO: Mark user as inactive in database
        // await userRepo.markInactive(tokenData.userId);
        console.log(`TODO: Mark user ${tokenData.userId} as inactive`);

        return {
          success: true,
          message: "You have been successfully unsubscribed.",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("One-click unsubscribe error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Unable to process unsubscribe request. Please try again later.",
        });
      }
    }),

  // Validate unsubscribe token for two-step confirmation flow
  validateUnsubscribe: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Validate token
        const tokenData = validateUnsubscribeToken(input.token);

        if (!tokenData) {
          return {
            valid: false,
            message: "Invalid or expired unsubscribe link.",
          };
        }

        // Return email for display on confirmation page (don't expose userId)
        return {
          valid: true,
          email: tokenData.email,
          message: "Ready to unsubscribe.",
        };
      } catch (error) {
        console.error("Validate unsubscribe error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Unable to validate unsubscribe request. Please try again later.",
        });
      }
    }),

  // Confirm unsubscribe for two-step confirmation flow
  confirmUnsubscribe: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Validate token
        const tokenData = validateUnsubscribeToken(input.token);

        if (!tokenData) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired unsubscribe link.",
          });
        }

        // TODO: Mark user as inactive in database
        // await userRepo.markInactive(tokenData.userId);
        console.log(
          `TODO: Mark user ${tokenData.userId} (${tokenData.email}) as inactive`,
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
            "Unable to process unsubscribe request. Please try again later.",
        });
      }
    }),
});
