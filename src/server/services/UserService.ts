import { userRepo } from "../db/repo/userRepo";
import { sendWelcomeEmail } from "../email/transactional/welcomeEmail";
import { subscriptionService } from "./SubscriptionService";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { invalidateCache, CACHE_KEYS } from "~/server/redis";

export class UserService {
  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return await userRepo.findByEmail(email);
  }

  /**
   * Find user by userId
   */
  async findByUserId(userId: string) {
    return await userRepo.findById(userId);
  }

  /**
   * Create a new user and their subscription
   */
  async createUser(email: string) {
    const user = await userRepo.create({ email });
    if (!user) {
      throw new Error(`Failed to create user with email: ${email}`);
    }
    //TODO: we need a different method because this it as system_migration in audit table
    await subscriptionService.ensureSubscriptionExists(
      user.id,
      SYSTEM_DESIGN_SUBJECT_ID,
    );
    invalidateCache(CACHE_KEYS.SUBSCRIBER_COUNT);

    await sendWelcomeEmail(user.id);
    void subscriptionService.setActiveUsersCountCache(SYSTEM_DESIGN_SUBJECT_ID);
    console.log(`Created user ${user.id} with email ${email}`);
    return user;
  }

  /**
   * Create multiple users in bulk
   */
  async bulkCreateUsers(emails: string[], subjectId: number) {
    if (emails.length === 0) {
      return [];
    }
    console.log(`Creating ${emails.length} users in bulk`);
    const users = await userRepo.bulkCreate(emails.map((email) => ({ email })));
    invalidateCache(CACHE_KEYS.SUBSCRIBER_COUNT);
    await subscriptionService.bulkCreateSubscription(
      users.map((user) => user.id),
      subjectId,
    );
    console.log(`Successfully created ${users.length} users in bulk`);
    return users;
  }

  /**
   * Get paginated users with active subscriptions
   */
  async getUsersWithActiveSubscription(page = 1, size = 25) {
    return await userRepo.findUsersWithActiveSubscription(page, size);
  }

  /**
   * Get daily signup statistics
   */
  async getDailySignupStats(days: number) {
    return await userRepo.getDailySignupStats(days);
  }

  /**
   * Get signup statistics
   */
  async getSignupStatistics(subjectId: number, days: number) {
    const [numberOfUnsubscribes, signUpStats] = await Promise.all([
      subscriptionService.getNumberOfUserUnsubscribes(subjectId, days),
      userRepo.getSignupStatistics(),
    ]);
    return { ...signUpStats, numberOfUnsubscribes: numberOfUnsubscribes };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    return await userRepo.findById(id);
  }

  /**
   * Delete user and all related records (cascading delete)
   */
  async deleteUser(id: string) {
    console.log(`UserService: Starting cascading delete for user ${id}`);
    const result = await userRepo.deleteUserCascading(id);
    console.log(
      `UserService: Successfully completed cascading delete for user ${id}`,
    );
    return result;
  }
}

export const userService = new UserService();
