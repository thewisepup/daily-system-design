import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { userRepo } from "~/server/db/repo/userRepo";

export const userRouter = createTRPCRouter({
  addToWaitlist: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email address"),
      }),
    )
    .mutation(async ({ input }) => {
      const existingUser = await userRepo.findByEmail(input.email);

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This email is already on the waitlist",
        });
      }

      const user = await userRepo.create({ email: input.email });

      return user;
    }),
});
