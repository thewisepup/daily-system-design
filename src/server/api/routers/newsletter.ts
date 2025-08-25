import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { generateNewsletterForTopic } from "~/server/newsletter/generateNewsletter";
import { issueRepo } from "~/server/db/repo/issueRepo";

export const newsletterRouter = createTRPCRouter({
  getByTopicId: adminProcedure
    .input(z.object({
      topicId: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      try {
        const issue = await issueRepo.findByTopicId(input.topicId);
        if (!issue) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No newsletter found for this topic",
          });
        }
        return issue;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error fetching newsletter:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch newsletter",
        });
      }
    }),

  generate: adminProcedure
    .input(
      z.object({
        topicId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await generateNewsletterForTopic(input.topicId);
        return { success: true };
      } catch (error) {
        console.error("Error generating newsletter:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate newsletter",
        });
      }
    }),
});