import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { generateNewsletterForTopic } from "~/server/subject/generateNewsletter";

export const newsletterRouter = createTRPCRouter({
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