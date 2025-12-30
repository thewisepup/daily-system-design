import { subscriptionService } from "~/server/services/SubscriptionService";
import { subscriptionRepo } from "~/server/db/repo/SubscriptionRepo";
import { subscriptionAuditRepo } from "~/server/db/repo/SubscriptionAuditRepo";
import { redis, CACHE_KEYS, CACHE_TTL } from "~/server/redis";
import { safeRedisOperation, invalidateCache } from "~/server/redis/utils";
import { env } from "~/env";
import { SubscriptionFactory } from "~/test/factories";
import { z } from "zod";

vi.mock("~/server/db/repo/SubscriptionRepo", () => ({
  subscriptionRepo: {
    findByUserAndSubject: vi.fn(),
    createForUser: vi.fn(),
    updateStatus: vi.fn(),
    bulkCreate: vi.fn(),
    getActiveUsersCount: vi.fn(),
    getNumberOfUserUnsubscribes: vi.fn(),
  },
}));

vi.mock("~/server/db/repo/SubscriptionAuditRepo", () => ({
  subscriptionAuditRepo: {
    logInsert: vi.fn(),
    logUpdate: vi.fn(),
    bulkLogInsert: vi.fn(),
  },
}));

vi.mock("~/server/redis", () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  },
  CACHE_KEYS: {
    SUBSCRIBER_COUNT: "test:daily-system-design:subscriber-count",
  },
  CACHE_TTL: {
    SUBSCRIBER_COUNT: 21600, // 6 hours
  },
}));

vi.mock("~/server/redis/utils", () => ({
  safeRedisOperation: vi.fn(async (operation, fallback) => {
    try {
      return await operation();
    } catch (error) {
      return await fallback();
    }
  }),
  invalidateCache: vi.fn(),
}));

vi.mock("~/env", () => ({
  env: {
    VERCEL_ENV: "test",
  },
}));

const mockedSubscriptionRepo = vi.mocked(subscriptionRepo);
const mockedSubscriptionAuditRepo = vi.mocked(subscriptionAuditRepo);
const mockedRedis = vi.mocked(redis);
const mockedSafeRedisOperation = vi.mocked(safeRedisOperation);
const mockedInvalidateCache = vi.mocked(invalidateCache);

const NUM_UNSUBSCRIBES_CACHE_TTL = 60 * 60; // 1 hour

/**
 * Helper function to construct the unsubscribes cache key.
 * Matches the format used in SubscriptionService.getNumberOfUserUnsubscribes.
 */
const getUnsubscribesCacheKey = (subjectId: number, days: number) =>
  `${env.VERCEL_ENV}:daily-system-design:unsubscribes:${subjectId}:${days}`;

describe("SubscriptionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("unsubscribe", () => {
    const userId = "00000000-0000-0000-0000-000000000001";
    const subjectId = 1;

    it("successfully unsubscribes user (active → cancelled)", async () => {
      const activeSubscription = SubscriptionFactory.createSubscription({
        userId,
        subjectId,
        status: "active",
      });
      const cancelledSubscription = SubscriptionFactory.createSubscription({
        ...activeSubscription,
        status: "cancelled",
      });

      mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(
        activeSubscription,
      );
      mockedSubscriptionRepo.updateStatus.mockResolvedValue(
        cancelledSubscription,
      );
      mockedSubscriptionAuditRepo.logUpdate.mockResolvedValue({} as never);

      const result = await subscriptionService.unsubscribe(userId, subjectId);

      expect(mockedSubscriptionRepo.findByUserAndSubject).toHaveBeenCalledWith(
        userId,
        subjectId,
      );
      expect(mockedSubscriptionRepo.updateStatus).toHaveBeenCalledWith(
        activeSubscription.id,
        "cancelled",
      );
      expect(mockedInvalidateCache).toHaveBeenCalledWith(
        CACHE_KEYS.SUBSCRIBER_COUNT,
      );
      expect(mockedSubscriptionRepo.getActiveUsersCount).toHaveBeenCalledWith(
        subjectId,
      );
      expect(result.status).toBe("cancelled");
    });

    it("returns existing subscription if already cancelled (no update)", async () => {
      const cancelledSubscription = SubscriptionFactory.createSubscription({
        userId,
        subjectId,
        status: "cancelled",
      });

      mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(
        cancelledSubscription,
      );

      const result = await subscriptionService.unsubscribe(userId, subjectId);

      expect(mockedSubscriptionRepo.findByUserAndSubject).toHaveBeenCalledWith(
        userId,
        subjectId,
      );
      expect(mockedSubscriptionRepo.updateStatus).not.toHaveBeenCalled();
      expect(mockedInvalidateCache).not.toHaveBeenCalled();
      expect(result).toEqual(cancelledSubscription);
    });

    it("creates subscription if doesn't exist, then unsubscribes", async () => {
      const newSubscription = SubscriptionFactory.createSubscription({
        userId,
        subjectId,
        status: "active",
      });
      const cancelledSubscription = SubscriptionFactory.createSubscription({
        ...newSubscription,
        status: "cancelled",
      });

      mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValueOnce(
        undefined,
      );
      mockedSubscriptionRepo.createForUser.mockResolvedValue(newSubscription);
      mockedSubscriptionAuditRepo.logInsert.mockResolvedValue({} as never);
      mockedSubscriptionRepo.updateStatus.mockResolvedValue(
        cancelledSubscription,
      );
      mockedSubscriptionAuditRepo.logUpdate.mockResolvedValue({} as never);

      const result = await subscriptionService.unsubscribe(userId, subjectId);

      expect(mockedSubscriptionRepo.findByUserAndSubject).toHaveBeenCalledTimes(
        1,
      );
      expect(mockedSubscriptionRepo.createForUser).toHaveBeenCalledWith(
        userId,
        subjectId,
      );
      expect(mockedSubscriptionAuditRepo.logInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          subjectId,
          status: "active",
        }),
        "system_migration",
      );
      expect(mockedSubscriptionRepo.updateStatus).toHaveBeenCalledWith(
        newSubscription.id,
        "cancelled",
      );
      expect(result.status).toBe("cancelled");
    });

    it("invalidates subscriber count cache", async () => {
      const activeSubscription = SubscriptionFactory.createSubscription({
        userId,
        subjectId,
        status: "active",
      });
      const cancelledSubscription = SubscriptionFactory.createSubscription({
        ...activeSubscription,
        status: "cancelled",
      });

      mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(
        activeSubscription,
      );
      mockedSubscriptionRepo.updateStatus.mockResolvedValue(
        cancelledSubscription,
      );
      mockedSubscriptionAuditRepo.logUpdate.mockResolvedValue({} as never);
      mockedSubscriptionRepo.getActiveUsersCount.mockResolvedValue(10);

      await subscriptionService.unsubscribe(userId, subjectId);

      expect(mockedInvalidateCache).toHaveBeenCalledWith(
        CACHE_KEYS.SUBSCRIBER_COUNT,
      );
    });

    it("updates active users count cache", async () => {
      const activeSubscription = SubscriptionFactory.createSubscription({
        userId,
        subjectId,
        status: "active",
      });
      const cancelledSubscription = SubscriptionFactory.createSubscription({
        ...activeSubscription,
        status: "cancelled",
      });
      const activeCount = 10;

      mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(
        activeSubscription,
      );
      mockedSubscriptionRepo.updateStatus.mockResolvedValue(
        cancelledSubscription,
      );
      mockedSubscriptionAuditRepo.logUpdate.mockResolvedValue({} as never);
      mockedSubscriptionRepo.getActiveUsersCount.mockResolvedValue(activeCount);

      await subscriptionService.unsubscribe(userId, subjectId);

      expect(mockedSubscriptionRepo.getActiveUsersCount).toHaveBeenCalledWith(
        subjectId,
      );
      expect(mockedRedis.setex).toHaveBeenCalledWith(
        CACHE_KEYS.SUBSCRIBER_COUNT,
        CACHE_TTL.SUBSCRIBER_COUNT,
        activeCount,
      );
    });

    it("throws error if subscription update fails", async () => {
      const activeSubscription = SubscriptionFactory.createSubscription({
        userId,
        subjectId,
        status: "active",
      });

      mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(
        activeSubscription,
      );
      mockedSubscriptionRepo.updateStatus.mockResolvedValue(undefined);

      await expect(
        subscriptionService.unsubscribe(userId, subjectId),
      ).rejects.toThrow("Failed to update subscription status");
    });
  });

  describe("ensureSubscriptionExists", () => {
    const userId = "00000000-0000-0000-0000-000000000001";
    const subjectId = 1;

    it("returns existing subscription if found", async () => {
      const existingSubscription = SubscriptionFactory.createSubscription({
        userId,
        subjectId,
      });

      mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(
        existingSubscription,
      );

      const result = await subscriptionService.ensureSubscriptionExists(
        userId,
        subjectId,
      );

      expect(mockedSubscriptionRepo.findByUserAndSubject).toHaveBeenCalledWith(
        userId,
        subjectId,
      );
      expect(mockedSubscriptionRepo.createForUser).not.toHaveBeenCalled();
      expect(result).toEqual(existingSubscription);
    });

    it("creates new subscription if not found", async () => {
      const newSubscription = SubscriptionFactory.createSubscription({
        userId,
        subjectId,
        status: "active",
      });

      mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(undefined);
      mockedSubscriptionRepo.createForUser.mockResolvedValue(newSubscription);
      mockedSubscriptionAuditRepo.logInsert.mockResolvedValue({} as never);

      const result = await subscriptionService.ensureSubscriptionExists(
        userId,
        subjectId,
      );

      expect(mockedSubscriptionRepo.findByUserAndSubject).toHaveBeenCalledWith(
        userId,
        subjectId,
      );
      expect(mockedSubscriptionRepo.createForUser).toHaveBeenCalledWith(
        userId,
        subjectId,
      );
      expect(result).toEqual(newSubscription);
    });

    it("logs audit trail for new subscription (system_migration reason)", async () => {
      const newSubscription = SubscriptionFactory.createSubscription({
        userId,
        subjectId,
        status: "active",
      });

      mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(undefined);
      mockedSubscriptionRepo.createForUser.mockResolvedValue(newSubscription);
      mockedSubscriptionAuditRepo.logInsert.mockResolvedValue({} as never);

      await subscriptionService.ensureSubscriptionExists(userId, subjectId);

      expect(mockedSubscriptionAuditRepo.logInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: newSubscription.id,
          userId: newSubscription.userId,
          subjectId: newSubscription.subjectId,
          status: "active",
          createdAt: newSubscription.createdAt.toISOString(),
          updatedAt: newSubscription.updatedAt.toISOString(),
        }),
        "system_migration",
      );
    });

    it("throws error if subscription creation fails", async () => {
      mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(undefined);
      mockedSubscriptionRepo.createForUser.mockResolvedValue(undefined);

      await expect(
        subscriptionService.ensureSubscriptionExists(userId, subjectId),
      ).rejects.toThrow("Failed to create subscription");
    });
  });

  describe("bulkCreateSubscription", () => {
    const userIds = [
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000002",
      "00000000-0000-0000-0000-000000000003",
    ];
    const subjectId = 1;

    it("creates subscriptions for multiple users", async () => {
      const subscriptions = SubscriptionFactory.createSubscriptions(
        userIds.length,
        { subjectId },
      );

      mockedSubscriptionRepo.bulkCreate.mockResolvedValue(subscriptions);
      mockedSubscriptionAuditRepo.bulkLogInsert.mockResolvedValue([]);

      const result = await subscriptionService.bulkCreateSubscription(
        userIds,
        subjectId,
      );

      expect(mockedSubscriptionRepo.bulkCreate).toHaveBeenCalledWith(
        userIds,
        subjectId,
      );
      expect(result).toEqual(subscriptions);
    });

    it("logs bulk audit trail (admin_action reason)", async () => {
      const subscriptions = SubscriptionFactory.createSubscriptions(
        userIds.length,
        { subjectId },
      );

      mockedSubscriptionRepo.bulkCreate.mockResolvedValue(subscriptions);
      mockedSubscriptionAuditRepo.bulkLogInsert.mockResolvedValue([]);

      await subscriptionService.bulkCreateSubscription(userIds, subjectId);

      expect(mockedSubscriptionAuditRepo.bulkLogInsert).toHaveBeenCalledWith(
        subscriptions.map((sub) =>
          expect.objectContaining({
            id: sub.id,
            userId: sub.userId,
            subjectId: sub.subjectId,
            status: "active",
            createdAt: sub.createdAt.toISOString(),
            updatedAt: sub.updatedAt.toISOString(),
          }),
        ),
        "admin_action",
      );
    });

    it("returns empty array for empty userIds array", async () => {
      const result = await subscriptionService.bulkCreateSubscription(
        [],
        subjectId,
      );

      expect(mockedSubscriptionRepo.bulkCreate).not.toHaveBeenCalled();
      expect(mockedSubscriptionAuditRepo.bulkLogInsert).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("throws error if bulk creation fails", async () => {
      const error = new Error("Database connection failed");
      mockedSubscriptionRepo.bulkCreate.mockRejectedValue(error);

      await expect(
        subscriptionService.bulkCreateSubscription(userIds, subjectId),
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("getActiveUsersCount", () => {
    const subjectId = 1;
    const expectedCount = 42;

    it("returns cached count on cache hit", async () => {
      mockedSafeRedisOperation.mockImplementation(async (operation) => {
        return await operation();
      });
      mockedRedis.get.mockResolvedValue(expectedCount);

      const result = await subscriptionService.getActiveUsersCount(subjectId);

      expect(mockedSafeRedisOperation).toHaveBeenCalled();
      expect(mockedRedis.get).toHaveBeenCalledWith(CACHE_KEYS.SUBSCRIBER_COUNT);
      expect(mockedSubscriptionRepo.getActiveUsersCount).not.toHaveBeenCalled();
      expect(result).toBe(expectedCount);
    });

    it("fetches from repo and caches on cache miss", async () => {
      mockedSafeRedisOperation.mockImplementation(async (operation) => {
        return await operation();
      });
      mockedRedis.get.mockResolvedValue(null);
      mockedSubscriptionRepo.getActiveUsersCount.mockResolvedValue(
        expectedCount,
      );

      const result = await subscriptionService.getActiveUsersCount(subjectId);

      expect(mockedRedis.get).toHaveBeenCalledWith(CACHE_KEYS.SUBSCRIBER_COUNT);
      expect(mockedSubscriptionRepo.getActiveUsersCount).toHaveBeenCalledWith(
        subjectId,
      );
      expect(mockedRedis.setex).toHaveBeenCalledWith(
        CACHE_KEYS.SUBSCRIBER_COUNT,
        CACHE_TTL.SUBSCRIBER_COUNT,
        expectedCount,
      );
      expect(result).toBe(expectedCount);
    });

    it("falls back to repo when redis fails (via safeRedisOperation)", async () => {
      // Reset the mock to use the actual implementation that handles errors
      mockedSafeRedisOperation.mockImplementation(
        async (operation, fallback) => {
          try {
            return await operation();
          } catch (error) {
            return await fallback();
          }
        },
      );
      // Make redis.get throw an error to trigger fallback in safeRedisOperation
      mockedRedis.get.mockRejectedValue(new Error("Redis connection failed"));
      mockedSubscriptionRepo.getActiveUsersCount.mockResolvedValue(
        expectedCount,
      );

      const result = await subscriptionService.getActiveUsersCount(subjectId);

      expect(mockedSafeRedisOperation).toHaveBeenCalled();
      expect(mockedSubscriptionRepo.getActiveUsersCount).toHaveBeenCalledWith(
        subjectId,
      );
      expect(result).toBe(expectedCount);
    });
  });

  describe("setActiveUsersCountCache", () => {
    const subjectId = 1;
    const expectedCount = 42;

    it("queries repo and sets cache with correct TTL", async () => {
      mockedSubscriptionRepo.getActiveUsersCount.mockResolvedValue(
        expectedCount,
      );

      const result =
        await subscriptionService.setActiveUsersCountCache(subjectId);

      expect(mockedSubscriptionRepo.getActiveUsersCount).toHaveBeenCalledWith(
        subjectId,
      );
      expect(mockedRedis.setex).toHaveBeenCalledWith(
        CACHE_KEYS.SUBSCRIBER_COUNT,
        CACHE_TTL.SUBSCRIBER_COUNT,
        expectedCount,
      );
      expect(result).toBe(expectedCount);
    });
  });

  describe("getNumberOfUserUnsubscribes", () => {
    const subjectId = 1;
    const days = 7;
    const expectedCount = 5;
    const cacheKey = getUnsubscribesCacheKey(subjectId, days);

    it("returns cached count on cache hit", async () => {
      mockedRedis.get.mockResolvedValue(expectedCount);

      const result = await subscriptionService.getNumberOfUserUnsubscribes(
        subjectId,
        days,
      );

      expect(mockedRedis.get).toHaveBeenCalledWith(cacheKey);
      expect(
        mockedSubscriptionRepo.getNumberOfUserUnsubscribes,
      ).not.toHaveBeenCalled();
      expect(result).toBe(expectedCount);
    });

    it("fetches from repo and caches on cache miss", async () => {
      mockedRedis.get.mockResolvedValue(null);
      mockedSubscriptionRepo.getNumberOfUserUnsubscribes.mockResolvedValue(
        expectedCount,
      );

      const result = await subscriptionService.getNumberOfUserUnsubscribes(
        subjectId,
        days,
      );

      expect(mockedRedis.get).toHaveBeenCalledWith(cacheKey);
      expect(
        mockedSubscriptionRepo.getNumberOfUserUnsubscribes,
      ).toHaveBeenCalledWith(subjectId, days);
      expect(mockedRedis.setex).toHaveBeenCalledWith(
        cacheKey,
        NUM_UNSUBSCRIBES_CACHE_TTL,
        expectedCount,
      );
      expect(result).toBe(expectedCount);
    });

    it("throws assertion error for subjectId <= 0", async () => {
      await expect(
        subscriptionService.getNumberOfUserUnsubscribes(0, days),
      ).rejects.toThrow();

      await expect(
        subscriptionService.getNumberOfUserUnsubscribes(-1, days),
      ).rejects.toThrow();
    });

    it("throws assertion error for days <= 0", async () => {
      await expect(
        subscriptionService.getNumberOfUserUnsubscribes(subjectId, 0),
      ).rejects.toThrow();

      await expect(
        subscriptionService.getNumberOfUserUnsubscribes(subjectId, -1),
      ).rejects.toThrow();
    });
  });

  describe("Edge Cases", () => {
    describe("unsubscribe", () => {
      it("handles invalid UUID format for userId", async () => {
        const invalidUserId = "not-a-uuid";
        const subjectId = 1;
        const { ZodError } = await import("zod");

        // Service now validates UUID format and throws ZodError for invalid UUIDs
        await expect(
          subscriptionService.unsubscribe(invalidUserId, subjectId),
        ).rejects.toThrow(ZodError);
      });

      it("handles empty string userId", async () => {
        const emptyUserId = "";
        const subjectId = 1;
        const { ZodError } = await import("zod");

        // Service validates UUID format and throws ZodError for empty string
        await expect(
          subscriptionService.unsubscribe(emptyUserId, subjectId),
        ).rejects.toThrow(ZodError);
      });

      it("handles negative subjectId", async () => {
        const userId = "00000000-0000-0000-0000-000000000001";
        const subjectId = -1;

        mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(
          undefined,
        );
        mockedSubscriptionRepo.createForUser.mockResolvedValue(
          SubscriptionFactory.createSubscription({
            userId,
            subjectId,
            status: "active",
          }),
        );
        mockedSubscriptionAuditRepo.logInsert.mockResolvedValue({} as never);

        const cancelledSubscription = SubscriptionFactory.createSubscription({
          userId,
          subjectId,
          status: "cancelled",
        });
        mockedSubscriptionRepo.updateStatus.mockResolvedValue(
          cancelledSubscription,
        );
        mockedSubscriptionAuditRepo.logUpdate.mockResolvedValue({} as never);
        mockedSubscriptionRepo.getActiveUsersCount.mockResolvedValue(0);

        const result = await subscriptionService.unsubscribe(userId, subjectId);

        expect(result.status).toBe("cancelled");
      });

      it("handles zero subjectId", async () => {
        const userId = "00000000-0000-0000-0000-000000000001";
        const subjectId = 0;

        mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(
          undefined,
        );
        mockedSubscriptionRepo.createForUser.mockResolvedValue(
          SubscriptionFactory.createSubscription({
            userId,
            subjectId,
            status: "active",
          }),
        );
        mockedSubscriptionAuditRepo.logInsert.mockResolvedValue({} as never);

        const cancelledSubscription = SubscriptionFactory.createSubscription({
          userId,
          subjectId,
          status: "cancelled",
        });
        mockedSubscriptionRepo.updateStatus.mockResolvedValue(
          cancelledSubscription,
        );
        mockedSubscriptionAuditRepo.logUpdate.mockResolvedValue({} as never);
        mockedSubscriptionRepo.getActiveUsersCount.mockResolvedValue(0);

        const result = await subscriptionService.unsubscribe(userId, subjectId);

        expect(result.status).toBe("cancelled");
      });
    });

    describe("bulkCreateSubscription", () => {
      it("handles duplicate userIds in array", async () => {
        const duplicateUserIds = [
          "00000000-0000-0000-0000-000000000001",
          "00000000-0000-0000-0000-000000000001",
          "00000000-0000-0000-0000-000000000002",
        ];
        const subjectId = 1;
        const subscriptions = SubscriptionFactory.createSubscriptions(2, {
          subjectId,
        });
        mockedSubscriptionRepo.bulkCreate.mockResolvedValue(subscriptions);
        mockedSubscriptionAuditRepo.bulkLogInsert.mockResolvedValue([]);

        const result = await subscriptionService.bulkCreateSubscription(
          duplicateUserIds,
          subjectId,
        );

        expect(mockedSubscriptionRepo.bulkCreate).toHaveBeenCalledWith(
          duplicateUserIds,
          subjectId,
        );
        expect(result).toEqual(subscriptions);
      });

      it("handles very large array (>10000)", async () => {
        const largeUserIds = Array.from(
          { length: 10001 },
          (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
        );
        const subjectId = 1;
        const subscriptions = SubscriptionFactory.createSubscriptions(
          largeUserIds.length,
          { subjectId },
        );
        mockedSubscriptionRepo.bulkCreate.mockResolvedValue(subscriptions);
        mockedSubscriptionAuditRepo.bulkLogInsert.mockResolvedValue([]);

        const result = await subscriptionService.bulkCreateSubscription(
          largeUserIds,
          subjectId,
        );

        expect(mockedSubscriptionRepo.bulkCreate).toHaveBeenCalledWith(
          largeUserIds,
          subjectId,
        );
        expect(result).toEqual(subscriptions);
      });
    });

    describe("getNumberOfUserUnsubscribes", () => {
      it("handles days = 1 (boundary)", async () => {
        const subjectId = 1;
        const days = 1;
        const expectedCount = 5;
        const cacheKey = getUnsubscribesCacheKey(subjectId, days);
        mockedRedis.get.mockResolvedValue(null);
        mockedSubscriptionRepo.getNumberOfUserUnsubscribes.mockResolvedValue(
          expectedCount,
        );

        const result = await subscriptionService.getNumberOfUserUnsubscribes(
          subjectId,
          days,
        );

        expect(mockedRedis.get).toHaveBeenCalledWith(cacheKey);
        expect(
          mockedSubscriptionRepo.getNumberOfUserUnsubscribes,
        ).toHaveBeenCalledWith(subjectId, days);
        expect(result).toBe(expectedCount);
      });

      it("handles very large days (>365)", async () => {
        const subjectId = 1;
        const days = 366;
        const expectedCount = 100;
        const cacheKey = getUnsubscribesCacheKey(subjectId, days);
        mockedRedis.get.mockResolvedValue(null);
        mockedSubscriptionRepo.getNumberOfUserUnsubscribes.mockResolvedValue(
          expectedCount,
        );

        const result = await subscriptionService.getNumberOfUserUnsubscribes(
          subjectId,
          days,
        );

        expect(mockedRedis.get).toHaveBeenCalledWith(cacheKey);
        expect(
          mockedSubscriptionRepo.getNumberOfUserUnsubscribes,
        ).toHaveBeenCalledWith(subjectId, days);
        expect(result).toBe(expectedCount);
      });
    });
  });

  describe("Error Cases", () => {
    describe("setActiveUsersCountCache", () => {
      it("handles Redis failures in setActiveUsersCountCache", async () => {
        const subjectId = 1;
        const expectedCount = 42;
        const redisError = new Error("Redis connection failed");
        mockedSubscriptionRepo.getActiveUsersCount.mockResolvedValue(
          expectedCount,
        );
        mockedRedis.setex.mockRejectedValue(redisError);

        await expect(
          subscriptionService.setActiveUsersCountCache(subjectId),
        ).rejects.toThrow("Redis connection failed");

        expect(mockedSubscriptionRepo.getActiveUsersCount).toHaveBeenCalledWith(
          subjectId,
        );
        expect(mockedRedis.setex).toHaveBeenCalled();
      });
    });

    describe("unsubscribe", () => {
      it("handles audit logging failures", async () => {
        const userId = "00000000-0000-0000-0000-000000000001";
        const subjectId = 1;
        const activeSubscription = SubscriptionFactory.createSubscription({
          userId,
          subjectId,
          status: "active",
        });
        const cancelledSubscription = SubscriptionFactory.createSubscription({
          ...activeSubscription,
          status: "cancelled",
        });

        mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(
          activeSubscription,
        );
        mockedSubscriptionRepo.updateStatus.mockResolvedValue(
          cancelledSubscription,
        );
        const auditError = new Error("Audit logging failed");
        mockedSubscriptionAuditRepo.logUpdate.mockRejectedValue(auditError);

        await expect(
          subscriptionService.unsubscribe(userId, subjectId),
        ).rejects.toThrow("Audit logging failed");
      });

      it("handles cache invalidation failures", async () => {
        const userId = "00000000-0000-0000-0000-000000000001";
        const subjectId = 1;
        const activeSubscription = SubscriptionFactory.createSubscription({
          userId,
          subjectId,
          status: "active",
        });
        const cancelledSubscription = SubscriptionFactory.createSubscription({
          ...activeSubscription,
          status: "cancelled",
        });

        mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(
          activeSubscription,
        );
        mockedSubscriptionRepo.updateStatus.mockResolvedValue(
          cancelledSubscription,
        );
        mockedSubscriptionAuditRepo.logUpdate.mockResolvedValue({} as never);
        mockedInvalidateCache.mockImplementation(() => {
          throw new Error("Cache invalidation failed");
        });

        // Cache invalidation failure might not throw, but we test behavior
        await expect(
          subscriptionService.unsubscribe(userId, subjectId),
        ).rejects.toThrow("Cache invalidation failed");
      });
    });

    describe("bulkCreateSubscription", () => {
      it("handles partial success (some succeed, some fail)", async () => {
        const userIds = [
          "00000000-0000-0000-0000-000000000001",
          "00000000-0000-0000-0000-000000000002",
        ];
        const subjectId = 1;
        // Only one subscription created successfully
        const partialSubscriptions = SubscriptionFactory.createSubscriptions(
          1,
          {
            subjectId,
          },
        );
        mockedSubscriptionRepo.bulkCreate.mockResolvedValue(
          partialSubscriptions,
        );
        mockedSubscriptionAuditRepo.bulkLogInsert.mockResolvedValue([]);

        const result = await subscriptionService.bulkCreateSubscription(
          userIds,
          subjectId,
        );

        expect(result).toEqual(partialSubscriptions);
        expect(result.length).toBeLessThan(userIds.length);
      });
    });
  });

  describe("Input Validation", () => {
    describe("unsubscribe - validation", () => {
      it("throws ZodError for invalid userId format", async () => {
        await expect(
          subscriptionService.unsubscribe("not-a-uuid", 1),
        ).rejects.toThrow(z.ZodError);
      });

      it("throws ZodError for empty userId", async () => {
        await expect(subscriptionService.unsubscribe("", 1)).rejects.toThrow(
          z.ZodError,
        );
      });

      it("accepts valid UUID format", async () => {
        const userId = "00000000-0000-0000-0000-000000000001";
        const subscription = SubscriptionFactory.createSubscription({
          userId,
          status: "cancelled",
        });

        mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(
          subscription,
        );

        await expect(
          subscriptionService.unsubscribe(userId, 1),
        ).resolves.not.toThrow();
      });
    });

    describe("ensureSubscriptionExists - validation", () => {
      it("throws ZodError for invalid userId format", async () => {
        await expect(
          subscriptionService.ensureSubscriptionExists("not-a-uuid", 1),
        ).rejects.toThrow(z.ZodError);
      });

      it("throws ZodError for empty userId", async () => {
        await expect(
          subscriptionService.ensureSubscriptionExists("", 1),
        ).rejects.toThrow(z.ZodError);
      });

      it("accepts valid UUID format", async () => {
        const userId = "00000000-0000-0000-0000-000000000001";
        const subscription = SubscriptionFactory.createSubscription({ userId });

        mockedSubscriptionRepo.findByUserAndSubject.mockResolvedValue(
          subscription,
        );

        await expect(
          subscriptionService.ensureSubscriptionExists(userId, 1),
        ).resolves.not.toThrow();
      });
    });

    describe("bulkCreateSubscription - validation", () => {
      const subjectId = 1;

      it("throws ZodError for invalid userId in array", async () => {
        const userIds = ["00000000-0000-0000-0000-000000000001", "not-a-uuid"];

        await expect(
          subscriptionService.bulkCreateSubscription(userIds, subjectId),
        ).rejects.toThrow(z.ZodError);
      });

      it("returns empty array for empty input without validation error", async () => {
        const result = await subscriptionService.bulkCreateSubscription(
          [],
          subjectId,
        );
        expect(result).toEqual([]);
      });

      it("accepts array of valid UUIDs", async () => {
        const userIds = [
          "00000000-0000-0000-0000-000000000001",
          "00000000-0000-0000-0000-000000000002",
        ];
        const subscriptions = userIds.map((userId) =>
          SubscriptionFactory.createSubscription({ userId, subjectId }),
        );

        mockedSubscriptionRepo.bulkCreate.mockResolvedValue(subscriptions);
        mockedSubscriptionAuditRepo.bulkLogInsert.mockResolvedValue([]);

        await expect(
          subscriptionService.bulkCreateSubscription(userIds, subjectId),
        ).resolves.not.toThrow();

        expect(mockedSubscriptionRepo.bulkCreate).toHaveBeenCalledWith(
          userIds,
          subjectId,
        );
      });
    });
  });
});
