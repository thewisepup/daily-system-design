import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import {
  generateTopics,
  type GenerateTopicsParams,
} from "~/server/subject/generateTopics";

const generateTopicsSchema = z.object({
  subjectId: z.number().int().positive(),
  subjectName: z.string().min(1),
  count: z.number().int().positive().default(150).optional(),
  replaceExisting: z.boolean().default(false).optional(),
});

export const topicsRouter = createTRPCRouter({
  generate: adminProcedure
    .input(generateTopicsSchema)
    .mutation(async ({ input }) => {
      const params: GenerateTopicsParams = {
        subjectId: input.subjectId,
        subjectName: input.subjectName,
        count: input.count,
        replaceExisting: input.replaceExisting,
      };

      return await generateTopics(params);
    }),
});
