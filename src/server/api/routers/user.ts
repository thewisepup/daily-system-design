import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
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

      return await userRepo.create({ email: input.email });
    }),

  // Admin endpoints
  listUsers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
      }),
    )
    .query(async ({ input }) => {
      const users = await userRepo.findWithPagination(input.page, 25);
      const totalCount = await userRepo.getTotalCount();

      return {
        users,
        totalCount,
        currentPage: input.page,
        totalPages: Math.ceil(totalCount / 25),
      };
    }),

  getTotalCount: adminProcedure.query(async () => {
    return await userRepo.getTotalCount();
  }),

  getDailySignupStats: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(30).default(7),
      }),
    )
    .query(async ({ input }) => {
      return await userRepo.getDailySignupStats(input.days);
    }),

  getSignupStatistics: adminProcedure.query(async () => {
    return await userRepo.getSignupStatistics();
  }),
});
