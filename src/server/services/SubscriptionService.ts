import { subscriptionRepo } from "../db/repo/SubscriptionRepo";
import {
  subscriptionAuditRepo,
  type SubscriptionAuditValues,
} from "../db/repo/SubscriptionAuditRepo";
import type {
  Subscription,
  SubscriptionStatus,
} from "../db/schema/subscriptions";
import type { SubscriptionAuditReason } from "../db/schema/subscriptionsAudit";
import { CACHE_KEYS, CACHE_TTL, redis } from "~/server/redis";
import { safeRedisOperation, invalidateCache } from "~/server/redis/utils";
import assert from "assert";
import { env } from "~/env";

export class SubscriptionService {
  /**
   * Unsubscribe user from a subject
   */
  async unsubscribe(userId: string, subjectId: number) {
    const subscription = await this.ensureSubscriptionExists(userId, subjectId);
    if (!this.canUnsubscribe(subscription)) {
      console.log(
        `User ${userId} already unsubscribed from subject ${subjectId}`,
      );
      return subscription;
    }
    const updatedSubscription = await this.updateSubscriptionStatus(
      subscription,
      "cancelled",
      "user_unsubscribe",
    );

    invalidateCache(CACHE_KEYS.SUBSCRIBER_COUNT);

    console.log(`User ${userId} unsubscribed from subject ${subjectId}`);
    return updatedSubscription;
  }

  /**
   * Ensure subscription exists for user
   */
  async ensureSubscriptionExists(userId: string, subjectId: number) {
    const existingSubscription = await subscriptionRepo.findByUserAndSubject(
      userId,
      subjectId,
    );
    if (existingSubscription) return existingSubscription;

    const subscription = await subscriptionRepo.createForUser(
      userId,
      subjectId,
    );

    if (!subscription) {
      throw new Error(`Failed to create subscription for userId:  ${userId}`);
    }

    await subscriptionAuditRepo.logInsert(
      this.toAuditValues(subscription),
      "system_migration",
    );

    console.log(`User ${userId} subscribed to subject ${subjectId}`);
    return subscription;
  }

  /**
   * Bulk create subscriptions for multiple users to a subject
   */
  async bulkCreateSubscription(userIds: string[], subjectId: number) {
    if (userIds.length === 0) {
      return [];
    }

    try {
      const subscriptions = await subscriptionRepo.bulkCreate(
        userIds,
        subjectId,
      );
      const auditValues = subscriptions.map((subscription) =>
        this.toAuditValues(subscription),
      );
      await subscriptionAuditRepo.bulkLogInsert(auditValues, "admin_action");

      console.log(
        `Bulk subscription complete: ${subscriptions.length}/${userIds.length} users subscribed to subject ${subjectId}`,
      );

      return subscriptions;
    } catch (error) {
      console.error(`Failed to bulk create subscriptions:`, error);
      throw error;
    }
  }

  /**
   * Get count of users with active subscriptions for a subject with caching
   */
  async getActiveUsersCount(subjectId: number) {
    return await safeRedisOperation(
      async () => {
        const cached = await redis.get(CACHE_KEYS.SUBSCRIBER_COUNT);
        if (cached !== null) {
          return cached as number;
        }

        // Cache miss
        const count = await subscriptionRepo.getActiveUsersCount(subjectId);
        await redis.setex(
          CACHE_KEYS.SUBSCRIBER_COUNT,
          CACHE_TTL.SUBSCRIBER_COUNT,
          count,
        );
        return count;
      },
      async () => {
        return await subscriptionRepo.getActiveUsersCount(subjectId);
      },
    );
  }

  async getNumberOfUserUnsubscribes(
    subjectId: number,
    days: number,
  ): Promise<number> {
    assert(subjectId > 0);
    assert(days > 0);
    // assert days < MAX_DAYS_WINDOW
    const NUM_UNSUBSCRIBES_CACHE_TTL = 60 * 60; //1 hour

    const cacheKey = `${env.VERCEL_ENV}:daily-system-design:unsubscribes:${subjectId}:${days}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached as number;
    }

    //cache miss
    const numberOfUserUnsubscribes =
      await subscriptionRepo.getNumberOfUserUnsubscribes(subjectId, days);
    await redis.setex(
      cacheKey,
      NUM_UNSUBSCRIBES_CACHE_TTL,
      numberOfUserUnsubscribes,
    );
    return numberOfUserUnsubscribes;
  }

  //TODO: Move to a SubscriptionUtils class
  private canUnsubscribe(subscription: Subscription): boolean {
    return subscription.status !== "cancelled";
  }

  private toAuditValues(subscription: Subscription): SubscriptionAuditValues {
    return {
      id: subscription.id,
      userId: subscription.userId,
      subjectId: subscription.subjectId,
      status: subscription.status,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }

  /**
   * Update subscription status with audit trail
   */
  private async updateSubscriptionStatus(
    subscription: Subscription,
    newStatus: SubscriptionStatus,
    reason: SubscriptionAuditReason,
  ) {
    const oldValues = this.toAuditValues(subscription);
    const updatedSubscription = await subscriptionRepo.updateStatus(
      subscription.id,
      newStatus,
    );
    if (!updatedSubscription) {
      throw new Error(
        `Failed to update subscription status from ${subscription.status} to ${newStatus} for userId: ${subscription.userId}`,
      );
    }
    const newValues = this.toAuditValues(updatedSubscription);
    await subscriptionAuditRepo.logUpdate(
      subscription.id,
      subscription.userId,
      oldValues,
      newValues,
      reason,
    );
    return updatedSubscription;
  }
}

// Create singleton instance
export const subscriptionService = new SubscriptionService();
