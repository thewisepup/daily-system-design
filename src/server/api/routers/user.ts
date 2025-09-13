import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { userRepo } from "~/server/db/repo/userRepo";
import { userService } from "~/server/services/UserService";
import { subscriptionService } from "~/server/services/SubscriptionService";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

export const userRouter = createTRPCRouter({
  addToWaitlist: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email address"),
      }),
    )
    .mutation(async ({ input }) => {
      const existingUser = await userService.findByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This email is already on the waitlist",
        });
      }

      try {
        return await userService.createUser(input.email);
      } catch (error) {
        console.error("Failed to create user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add email to waitlist. Please try again.",
        });
      }
    }),

  // Admin endpoints
  listUsers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
      }),
    )
    .query(async ({ input }) => {
      const users = await userService.getUsersWithActiveSubscription(
        input.page,
        25,
      );
      const totalCount = await subscriptionService.getActiveUsersCount(
        SYSTEM_DESIGN_SUBJECT_ID,
      );

      return {
        users,
        totalCount,
        currentPage: input.page,
        totalPages: Math.ceil(totalCount / 25),
      };
    }),

  getTotalCount: publicProcedure.query(async () => {
    try {
      return await subscriptionService.getActiveUsersCount(
        SYSTEM_DESIGN_SUBJECT_ID,
      );
    } catch (error) {
      console.error("Failed to get total count:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve subscriber count",
      });
    }
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
