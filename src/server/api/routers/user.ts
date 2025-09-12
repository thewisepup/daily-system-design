import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { userRepo } from "~/server/db/repo/userRepo";
import { subscriptionService } from "~/server/services/SubscriptionService";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { CACHE_KEYS, CACHE_TTL, redis } from "~/server/redis";
import { safeRedisOperation } from "~/server/redis/utils";
import { sendWelcomeEmail } from "~/server/email/transactional/welcomeEmail";

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

      let user;
      try {
        user = await userRepo.create({ email: input.email });
        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to add email to waitlist. Please try again.",
          });
        }
      } catch (error) {
        console.error("Failed to create user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add email to waitlist. Please try again.",
        });
      }

      // TODO: make it so that we use a userService. IS there a way to create both user and subscription at the same time
      try {
        await subscriptionService.ensureSubscriptionExists(
          user.id,
          SYSTEM_DESIGN_SUBJECT_ID,
        );
      } catch (error) {
        console.error("Failed to create subscription for user:", error);
        // Don't throw error here - user creation was successful, subscription can be created later via migration
      }

      await sendWelcomeEmail(user.id);
      return user;
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

  getTotalCount: publicProcedure.query(async () => {
    return await safeRedisOperation(
      async () => {
        const cached = await redis.get(CACHE_KEYS.SUBSCRIBER_COUNT);
        if (cached !== null) {
          return cached as number;
        }

        // Cache miss
        const count = await userRepo.getTotalCount();
        await redis.setex(
          CACHE_KEYS.SUBSCRIBER_COUNT,
          CACHE_TTL.SUBSCRIBER_COUNT,
          count,
        );
        return count;
      },
      // Fallback
      async () => {
        return await userRepo.getTotalCount();
      },
    );
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
