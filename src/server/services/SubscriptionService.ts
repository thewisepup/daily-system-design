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
import { z } from "zod";

/**
 * Service for managing user subscriptions to newsletter subjects.
 * Handles subscription lifecycle, caching, and audit trail logging.
 */
export class SubscriptionService {
  /**
   * Unsubscribe a user from a subject.
   * Ensures subscription exists, updates status to 'cancelled', and invalidates cache.
   *
   * @param userId - The unique identifier of the user to unsubscribe
   * @param subjectId - The unique identifier of the subject to unsubscribe from
   * @returns The updated subscription object
   * @throws Error if subscription update fails or userId is invalid
   */
  async unsubscribe(userId: string, subjectId: number) {
    // Validate userId is a valid UUID
    z.string().uuid().parse(userId);
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
    await this.setActiveUsersCountCache(subjectId);
    console.log(`User ${userId} unsubscribed from subject ${subjectId}`);
    return updatedSubscription;
  }

  /**
   * Ensure a subscription exists for a user and subject.
   * If subscription doesn't exist, creates it and logs audit trail.
   *
   * @param userId - The unique identifier of the user
   * @param subjectId - The unique identifier of the subject
   * @returns The existing or newly created subscription object
   * @throws Error if subscription creation fails
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
   * Bulk create subscriptions for multiple users to a subject.
   * Creates subscriptions for all provided user IDs and logs audit trail.
   *
   * @param userIds - Array of user IDs to subscribe
   * @param subjectId - The unique identifier of the subject to subscribe to
   * @returns Array of created subscription objects, or empty array if no user IDs provided
   * @throws Error if bulk creation fails
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
   * Get count of users with active subscriptions for a subject with caching.
   * Uses Redis cache with fallback to database query if cache fails.
   *
   * @param subjectId - The unique identifier of the subject
   * @returns The number of users with active subscriptions for the subject
   */
  async getActiveUsersCount(subjectId: number) {
    return await safeRedisOperation(
      async () => {
        const cached = await redis.get(CACHE_KEYS.SUBSCRIBER_COUNT);
        if (cached !== null) {
          return cached as number;
        }

        // Cache miss
        return this.setActiveUsersCountCache(subjectId);
      },
      async () => {
        return await subscriptionRepo.getActiveUsersCount(subjectId);
      },
    );
  }

  /**
   * Set the active users count cache for a subject.
   * Queries database and stores result in Redis with configured TTL.
   *
   * @param subjectId - The unique identifier of the subject
   * @returns The number of users with active subscriptions for the subject
   */
  async setActiveUsersCountCache(subjectId: number) {
    // Cache miss
    const count = await subscriptionRepo.getActiveUsersCount(subjectId);
    await redis.setex(
      CACHE_KEYS.SUBSCRIBER_COUNT,
      CACHE_TTL.SUBSCRIBER_COUNT,
      count,
    );
    return count;
  }

  /**
   * Get the number of user unsubscribes for a subject within a time window.
   * Results are cached in Redis for 1 hour to reduce database load.
   *
   * @param subjectId - The unique identifier of the subject
   * @param days - Number of days to look back for unsubscribes (must be > 0)
   * @returns The number of unsubscribes within the specified time window
   * @throws AssertionError if subjectId <= 0 or days <= 0
   */
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

  /**
   * Check if a subscription can be unsubscribed.
   * A subscription can be unsubscribed if its status is not 'cancelled'.
   *
   * @param subscription - The subscription object to check
   * @returns True if subscription can be unsubscribed, false otherwise
   * @todo Move to a SubscriptionUtils class
   */
  private canUnsubscribe(subscription: Subscription): boolean {
    return subscription.status !== "cancelled";
  }

  /**
   * Convert a subscription object to audit values format.
   * Transforms dates to ISO strings for audit trail logging.
   *
   * @param subscription - The subscription object to convert
   * @returns Audit values object with ISO string dates
   */
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
   * Update subscription status with audit trail.
   * Updates the subscription status and logs both old and new values to audit table.
   *
   * @param subscription - The subscription object to update
   * @param newStatus - The new status to set
   * @param reason - The reason for the status change (for audit trail)
   * @returns The updated subscription object
   * @throws Error if subscription update fails
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
