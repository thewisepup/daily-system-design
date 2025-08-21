import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { generateTopics } from "~/server/subject/generateTopics";

export const topicsRouter = createTRPCRouter({
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
});
