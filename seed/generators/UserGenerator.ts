import { db } from "../../src/server/db";
import { users } from "../../src/server/db/schema/users";
import { inArray } from "drizzle-orm";
import { BaseGenerator } from "./BaseGenerator";

export interface UserGenerationOptions {
  baseEmail: string;
  count: number;
  skipExisting: boolean;
}

export interface UserGenerationResult {
  created: number;
  skipped: number;
  failed: number;
  users: Array<{ id: string; email: string; createdAt: Date }>;
  existing: string[];
}

export class UserGenerator extends BaseGenerator<
  UserGenerationOptions,
  UserGenerationResult
> {
  async generate(
    options: UserGenerationOptions,
  ): Promise<UserGenerationResult> {
    const { baseEmail, count, skipExisting } = options;

    this.log(`Generating ${count} users with base email: ${baseEmail}`);

    // Generate email addresses
    const emailAddresses = this.generateEmailAddresses(baseEmail, count);

    this.log(`Generated ${emailAddresses.length} email addresses`);

    if (skipExisting) {
      return await this.createNewUsersOnly(emailAddresses);
    } else {
      return await this.createAllUsers(emailAddresses);
    }
  }

  private generateEmailAddresses(baseEmail: string, count: number): string[] {
    const [localPart, domain] = baseEmail.split("@");

    const emailAddresses = [];
    for (let i = 1; i <= count; i++) {
      const generatedEmail = `${localPart}+${this.environment}-${i}@${domain}`;
      emailAddresses.push(generatedEmail);
    }
    return emailAddresses;
  }

  private async createNewUsersOnly(
    emailAddresses: string[],
  ): Promise<UserGenerationResult> {
    this.log("Checking for existing users...");

    // Check for existing users
    const existingUsers = await db
      .select({ email: users.email })
      .from(users)
      .where(inArray(users.email, emailAddresses));

    const existingEmails = new Set(existingUsers.map((user) => user.email));
    const newEmails = emailAddresses.filter(
      (email) => !existingEmails.has(email),
    );

    if (existingUsers.length > 0) {
      this.log(`Found ${existingUsers.length} existing users, will skip them`);
    }

    if (newEmails.length === 0) {
      this.log("All users already exist. Nothing to create.");
      return {
        created: 0,
        skipped: existingUsers.length,
        failed: 0,
        users: [],
        existing: existingUsers.map((u) => u.email),
      };
    }

    return await this.createUsers(newEmails, existingUsers.length);
  }

  private async createAllUsers(
    emailAddresses: string[],
  ): Promise<UserGenerationResult> {
    return await this.createUsers(emailAddresses, 0);
  }

  private async createUsers(
    emailAddresses: string[],
    skippedCount: number,
  ): Promise<UserGenerationResult> {
    try {
      this.log(`Creating ${emailAddresses.length} users...`);

      const userData = emailAddresses.map((email) => ({ email }));
      const createdUsers = await db.insert(users).values(userData).returning();

      this.logSuccess(`Successfully created ${createdUsers.length} users`);

      return {
        created: createdUsers.length,
        skipped: skippedCount,
        failed: emailAddresses.length - createdUsers.length,
        users: createdUsers,
        existing: [],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logError(`Failed to create users: ${message}`);
      throw new Error(`Failed to create users: ${message}`);
    }
  }
}
