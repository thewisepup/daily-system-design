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

export class SubscriptionService {
  /**
   * Unsubscribe user from a subject
   */
  async unsubscribe(userId: string, subjectId: number) {
    const subscription = await this.ensureSubscriptionExists(userId, subjectId);
    if (!this.canUnsubscribe(subscription)) {
      console.log(`User ${userId} already unsubscribed from subject ${subjectId}`);
      return subscription;
    }
    const updatedSubscription = await this.updateSubscriptionStatus(
      subscription,
      "cancelled",
      "user_unsubscribe",
    );
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
