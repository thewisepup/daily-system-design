import { eq, desc } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";

export const userRepo = {
  /**
   * Find a user by their email address
   */
  async findByEmail(email: string) {
    return await db.select().from(users).where(eq(users.email, email)).limit(1).then(rows => rows[0]);
  },

  /**
   * Find a user by their ID
   */
  async findById(id: string) {
    return await db.select().from(users).where(eq(users.id, id)).limit(1).then(rows => rows[0]);
  },

  /**
   * Create a new user with email
   */
  async create(data: { email: string }) {
    const [user] = await db.insert(users)
      .values(data)
      .returning();
    return user;
  },

  /**
   * Get all users (for admin purposes)
   */
  async findAll() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  },

  /**
   * Delete a user by ID
   */
  async delete(id: string) {
    await db.delete(users).where(eq(users.id, id));
  },
};