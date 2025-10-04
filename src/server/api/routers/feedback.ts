import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { validateFeedbackToken } from "~/lib/jwt/FeedbackTokenService";
import { TRPCError } from "@trpc/server";
import { feedbackService } from "~/server/services/FeedbackService";

export const SubmitFeedbackRequestSchema = z.object({
  token: z.string(),
  feedback: z.string(),
  rating: z.number().min(0).max(5).optional(),
});
export type SubmitFeedbackRequest = z.infer<typeof SubmitFeedbackRequestSchema>;

export const feedbackRouter = createTRPCRouter({
  submitFeedback: publicProcedure
    .input(SubmitFeedbackRequestSchema)
    .mutation(async ({ input }) => {
      try {
        console.log(`Submitting feedback for token: ${input.token}`);
        const tokenData = validateFeedbackToken(input.token);
        if (!tokenData) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unable to submit feedback. Invalid token.",
          });
        }
        await feedbackService.submitFeedback({
          userId: tokenData.userId,
          issueId: tokenData.issueId,
          feedback: input.feedback,
          rating: input.rating,
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Failed to submit feedback", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Unable to process feedback Please try again later." + input.token,
        });
      }
    }),
});
