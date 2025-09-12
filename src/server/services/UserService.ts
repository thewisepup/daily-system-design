import { userRepo } from "../db/repo/userRepo";
import { subscriptionService } from "./SubscriptionService";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

export class UserService {
  /**
   * Create a new user and their subscription
   */
  async createUser(email: string) {
    const user = await userRepo.create({ email });
    if (!user) {
      throw new Error(`Failed to create user with email: ${email}`);
    }
    await subscriptionService.ensureSubscriptionExists(
      user.id,
      SYSTEM_DESIGN_SUBJECT_ID,
    );

    console.log(`Created user ${user.id} with email ${email}`);
    return user;
  }
}

// Create singleton instance
export const userService = new UserService();
