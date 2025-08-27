import { eq, desc, count, sql, gte } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";

export const userRepo = {
  /**
   * Find a user by their email address
   */
  async findByEmail(email: string) {
    return await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((rows) => rows[0]);
  },

  /**
   * Find a user by their ID
   */
  async findById(id: string) {
    return await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .then((rows) => rows[0]);
  },

  /**
   * Create a new user with email
   */
  async create(data: { email: string }) {
    const [user] = await db.insert(users).values(data).returning();
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
    return await db
      .select()
      .from(users)
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

  /**
   * Get daily signup statistics for the last N days
   */
  async getDailySignupStats(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const result = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})`.as("date"),
        count: count().as("count"),
      })
      .from(users)
      .where(
        sql`${users.createdAt} >= ${startDate.toISOString()} AND ${users.createdAt} <= ${endDate.toISOString()}`,
      )
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

    // Fill in missing dates with 0 count
    const statsMap = new Map(result.map((r) => [r.date, r.count]));
    const dailyStats = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0]!;
      dailyStats.push({
        date: dateStr,
        count: statsMap.get(dateStr) ?? 0,
      });
    }

    return dailyStats;
  },

  /**
   * Get general signup statistics
   */
  async getSignupStatistics() {
    const now = new Date();

    // Today's signups
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todaySignups = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, todayStart));

    // This week's signups
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekSignups = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, weekStart));

    // This month's signups
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);
    monthStart.setHours(0, 0, 0, 0);

    const monthSignups = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, monthStart));

    // Total signups
    const totalSignups = await this.getTotalCount();

    // Average daily signups (last 7 days)
    const avgDailySignups =
      Math.round(((weekSignups[0]?.count ?? 0) / 7) * 10) / 10;

    return {
      today: todaySignups[0]?.count ?? 0,
      week: weekSignups[0]?.count ?? 0,
      month: monthSignups[0]?.count ?? 0,
      total: totalSignups,
      avgDaily: avgDailySignups,
    };
  },
};
