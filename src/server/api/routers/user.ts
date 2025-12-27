import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { userService } from "~/server/services/UserService";
import { subscriptionService } from "~/server/services/SubscriptionService";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

const MAX_DAYS_WINDOW = 30;
export const userRouter = createTRPCRouter({
  subscribe: publicProcedure
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
          message: "This email is already subscribed",
        });
      }

      try {
        return await userService.createUser(input.email);
      } catch (error) {
        console.error("Failed to create user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to subscribe. Please try again.",
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
      return await userService.getDailySignupStats(input.days);
    }),

  //TODO: Create getSignUpStatsics ZOD object, and export it to @StaticsCard.tsx to define response types
  getSignupStatistics: adminProcedure
    .input(
      z.object({
        subjectId: z.number().default(SYSTEM_DESIGN_SUBJECT_ID),
        days: z.number().min(1).max(MAX_DAYS_WINDOW).default(7),
      }),
    )
    .query(async ({ input }) => {
      return userService.getSignupStatistics(input.subjectId, input.days);
    }),

  getUserById: adminProcedure
    .input(
      z.object({
        id: z.string().uuid("Please provide a valid user ID"),
      }),
    )
    .query(async ({ input }) => {
      const user = await userService.getUserById(input.id);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      return user;
    }),

  deleteUser: adminProcedure
    .input(
      z.object({
        id: z.string().uuid("Please provide a valid user ID"),
      }),
    )
    .mutation(async ({ input }) => {
      console.log(`Delete user request received for ID: ${input.id}`);
      try {
        const user = await userService.getUserById(input.id);
        if (!user) {
          console.log(`User not found for ID: ${input.id}`);
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        console.log(`User found - ${user.id}, proceeding with deletion`);
        await userService.deleteUser(input.id);

        console.log(`Successfully deleted user ${input.id}`);
        return {
          success: true,
          message: `User ${user.id} and all related records have been deleted`,
        };
      } catch (error) {
        console.error(`Failed to delete user ${input.id}:`, error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete user. Please try again.",
        });
      }
    }),
});
