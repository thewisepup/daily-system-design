import { userRepo } from "../db/repo/userRepo";
import { sendWelcomeEmail } from "../email/transactional/welcomeEmail";
import { subscriptionService } from "./SubscriptionService";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { invalidateCache, CACHE_KEYS } from "~/server/redis";

export class UserService {
  /**
   * Find a user by their email address
   * @param email - The email address to search for
   * @returns The user object if found, undefined otherwise
   */
  async findByEmail(email: string) {
    return await userRepo.findByEmail(email);
  }

  /**
   * Find a user by their user ID
   * @param userId - The UUID of the user to find
   * @returns The user object if found, undefined otherwise
   */
  async findByUserId(userId: string) {
    return await userRepo.findById(userId);
  }

  /**
   * Create a new user and their subscription to the system design subject.
   * Also sends a welcome email and invalidates relevant caches.
   * @param email - The email address for the new user
   * @returns The newly created user object
   * @throws Error if user creation fails
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
   * Create multiple users in bulk and subscribe them to a subject.
   * Invalidates the subscriber count cache after creation.
   * @param emails - Array of email addresses to create users for
   * @param subjectId - The subject ID to subscribe all users to
   * @returns Array of newly created user objects, empty array if emails array is empty
   */
  async bulkCreateUsers(emails: string[], subjectId: number) {
    if (emails.length === 0) {
      return [];
    }
    console.log(`Creating ${emails.length} users in bulk`);
    const users = await userRepo.bulkCreate(emails.map((email) => ({ email })));
    // Wrap cache invalidation in try-catch so it doesn't prevent subscription errors from being thrown
    try {
      invalidateCache(CACHE_KEYS.SUBSCRIBER_COUNT);
    } catch (error) {
      // Log but don't throw - cache invalidation failure shouldn't prevent subscription creation
      console.error("Cache invalidation failed:", error);
    }
    await subscriptionService.bulkCreateSubscription(
      users.map((user) => user.id),
      subjectId,
    );
    console.log(`Successfully created ${users.length} users in bulk`);
    return users;
  }

  /**
   * Get paginated list of users with active subscriptions.
   * Results are ordered by creation date (newest first).
   * @param page - Page number (1-indexed), defaults to 1
   * @param size - Number of users per page, defaults to 25
   * @returns Array of user objects with id, email, and createdAt fields
   */
  async getUsersWithActiveSubscription(page = 1, size = 25) {
    return await userRepo.findUsersWithActiveSubscription(page, size);
  }

  /**
   * Get daily signup statistics for the last N days in PST timezone.
   * Returns an array with one entry per day, including days with zero signups.
   * @param days - Number of days to retrieve statistics for
   * @returns Array of objects with date (YYYY-MM-DD format) and count properties
   */
  async getDailySignupStats(days: number) {
    return await userRepo.getDailySignupStats(days);
  }

  /**
   * Get comprehensive signup statistics including unsubscribe counts.
   * Combines user signup statistics with subscription unsubscribe data.
   * @param subjectId - The subject ID to get unsubscribe statistics for
   * @param days - Number of days to include in unsubscribe statistics
   * @returns Object containing today, week, month, total signups, average daily signups, and number of unsubscribes
   */
  async getSignupStatistics(subjectId: number, days: number) {
    const [numberOfUnsubscribes, signUpStats] = await Promise.all([
      subscriptionService.getNumberOfUserUnsubscribes(subjectId, days),
      userRepo.getSignupStatistics(),
    ]);
    return { ...signUpStats, numberOfUnsubscribes: numberOfUnsubscribes };
  }

  /**
   * Get a user by their ID
   * @param id - The UUID of the user to retrieve
   * @returns The user object if found, undefined otherwise
   */
  async getUserById(id: string) {
    return await userRepo.findById(id);
  }

  /**
   * Delete a user and all related records using cascading delete.
   * Deletes related records in transactions, deliveries, subscriptions, and audit tables.
   * @param id - The UUID of the user to delete
   * @returns Object with success property indicating deletion completion
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
