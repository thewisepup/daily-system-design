import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { generateTopics } from "~/server/subject/generateTopics";
import { topicRepo } from "~/server/db/repo/topicRepo";

export const topicsRouter = createTRPCRouter({
  getWithIssues: adminProcedure
    .input(z.object({
      subjectId: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      try {
        return topicRepo.getTopicsWithIssueStatus(input.subjectId);
      } catch (error) {
        console.error("Error fetching topics with issues:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch topics",
        });
      }
    }),

  generate: adminProcedure.mutation(async () => {
    try {
      await generateTopics();
      return { success: true, message: "Topics generated successfully" };
    } catch (error) {
      console.error("Error generating topics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to generate topics",
      });
    }
  }),

  deleteAll: adminProcedure
    .input(z.object({
      subjectId: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      try {
        await topicRepo.deleteBySubjectId(input.subjectId);
        return { 
          success: true, 
          message: `All topics for subject ${input.subjectId} deleted successfully` 
        };
      } catch (error) {
        console.error("Error deleting topics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to delete topics",
        });
      }
    }),
});
