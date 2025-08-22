import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // TODO: persist to database
      return {
        id: 1,
        name: input.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),

  getLatest: publicProcedure.query(async () => {
    // TODO: get from database
    return {
      id: 1,
      name: "Hello World",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }),
});