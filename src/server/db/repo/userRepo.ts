import { eq, desc, count } from "drizzle-orm";
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
   * Get users with pagination (for admin purposes)
   */
  async findWithPagination(page = 1, limit = 25) {
    const offset = (page - 1) * limit;
    return await db.select().from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  },

  /**
   * Get total count of users
   */
  async getTotalCount() {
    const result = await db.select({ count: count() }).from(users);
    return result[0]?.count ?? 0;
  },

  /**
   * Delete a user by ID
   */
  async delete(id: string) {
    await db.delete(users).where(eq(users.id, id));
  },
};