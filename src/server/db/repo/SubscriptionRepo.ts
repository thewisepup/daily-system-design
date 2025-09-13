import { eq, and, count } from "drizzle-orm";
import { db } from "~/server/db";
import { subscriptions } from "~/server/db/schema/subscriptions";
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
          eq(subscriptions.subjectId, subjectId)
        )
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
}

// Create singleton instance
export const subscriptionRepo = new SubscriptionRepo();

