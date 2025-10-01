import { eq, and, count, gte } from "drizzle-orm";
import { db } from "~/server/db";
import { subscriptions } from "~/server/db/schema/subscriptions";
import { users } from "~/server/db/schema/users";
import type { SubscriptionStatus } from "~/server/db/schema/subscriptions";

export class SubscriptionRepo {
  /**
   * Find subscription by userId and subjectId
   */
  async findByUserAndSubject(userId: string, subjectId: number) {
    return await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.subjectId, subjectId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
  }

  /**
   * Update subscription status and return both old and new values
   */
  async updateStatus(id: string, status: SubscriptionStatus) {
    // Update the subscription
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();

    return updatedSubscription;
  }

  /**
   * Create subscription for user
   */
  async createForUser(userId: string, subjectId: number) {
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        userId,
        subjectId,
        status: "active",
      })
      .returning();
    return subscription;
  }

  /**
   * Get count of users with active subscriptions for a subject
   */
  async getActiveUsersCount(subjectId: number) {
    const result = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, "active"),
          eq(subscriptions.subjectId, subjectId),
        ),
      );

    return result[0]?.count ?? 0;
  }

  /**
   * Bulk create subscriptions for multiple users
   * NOTE: This method assumes all users have been created but no subscriptions exist for them yet
   */
  async bulkCreate(userIds: string[], subjectId: number) {
    if (userIds.length === 0) {
      return [];
    }

    const subscriptionValues = userIds.map((userId) => ({
      userId,
      subjectId,
      status: "active" as const,
    }));

    const createdSubscriptions = await db
      .insert(subscriptions)
      .values(subscriptionValues)
      .returning();

    return createdSubscriptions;
  }

  /**
   * Cancel all active subscriptions for a user by email address
   */
  async cancelSubscriptionsByEmail(email: string): Promise<number> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return 0;
    }

    const updatedSubscriptions = await db
      .update(subscriptions)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subscriptions.userId, user.id),
          eq(subscriptions.status, "active"),
        ),
      )
      .returning();

    return updatedSubscriptions.length;
  }

  async getNumberOfUserUnsubscribes(
    subjectId: number,
    days: number,
  ): Promise<number> {
    const timeStart = new Date();
    timeStart.setDate(timeStart.getDate() - days);
    timeStart.setHours(0, 0, 0, 0);

    const cancelledSubscriptionsCount = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          gte(subscriptions.createdAt, timeStart),
          eq(subscriptions.status, "cancelled"),
          eq(subscriptions.subjectId, subjectId),
        ),
      );
    return cancelledSubscriptionsCount[0]?.count ?? 0;
  }
}

// Create singleton instance
export const subscriptionRepo = new SubscriptionRepo();
