import { eq, and } from "drizzle-orm";
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
}

// Create singleton instance
export const subscriptionRepo = new SubscriptionRepo();

