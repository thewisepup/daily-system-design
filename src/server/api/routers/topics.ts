import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { generateTopics } from "~/server/subject/generateTopics";

export const topicsRouter = createTRPCRouter({
  generate: adminProcedure.mutation(async () => {
    try {
      await generateTopics();
    } catch (error) {
      console.log(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }),
});
