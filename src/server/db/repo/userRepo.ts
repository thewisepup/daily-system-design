import { eq, desc, count, sql, gte } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";
import { invalidateCache, CACHE_KEYS } from "~/server/redis";

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
    invalidateCache(CACHE_KEYS.SUBSCRIBER_COUNT);
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
   * Get daily signup statistics for the last N days (PST timezone)
   */
  async getDailySignupStats(days = 7) {
    // Use PostgreSQL to handle timezone conversion directly
    const result = await db
      .select({
        date: sql<string>`DATE(${users.createdAt} AT TIME ZONE 'America/Los_Angeles')`.as(
          "date",
        ),
        count: count().as("count"),
      })
      .from(users)
      .where(
        sql`${users.createdAt} >= NOW() - INTERVAL '${sql.raw(days.toString())} days'`,
      )
      .groupBy(sql`DATE(${users.createdAt} AT TIME ZONE 'America/Los_Angeles')`)
      .orderBy(
        sql`DATE(${users.createdAt} AT TIME ZONE 'America/Los_Angeles')`,
      );

    // Fill in missing dates with 0 count (using PST dates)
    const statsMap = new Map(result.map((r) => [r.date, r.count]));
    const dailyStats = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // Get date string in PST timezone
      const dateStr = date.toLocaleDateString("en-CA", {
        timeZone: "America/Los_Angeles",
      }); // en-CA gives YYYY-MM-DD format
      dailyStats.push({
        date: dateStr,
        count: statsMap.get(dateStr) ?? 0,
      });
    }

    return dailyStats;
  },

  /**
   * Get users in batches for newsletter delivery processing
   * @param batchSize Number of users to fetch (default: 500)
   * @param offset Number of users to skip
   * @returns Array of users for this batch
   */
  async findAllInBatches(batchSize = 500, offset = 0) {
    return await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .orderBy(users.createdAt) // Consistent ordering for pagination
      .limit(batchSize)
      .offset(offset);
  },

  /**
   * Get general signup statistics
   */
  async getSignupStatistics() {
    const now = new Date();

    // Set up date ranges
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);
    monthStart.setHours(0, 0, 0, 0);

    // Execute all queries in parallel
    const [todaySignups, weekSignups, monthSignups, totalSignups] =
      await Promise.all([
        db
          .select({ count: count() })
          .from(users)
          .where(gte(users.createdAt, todayStart)),
        db
          .select({ count: count() })
          .from(users)
          .where(gte(users.createdAt, weekStart)),
        db
          .select({ count: count() })
          .from(users)
          .where(gte(users.createdAt, monthStart)),
        this.getTotalCount(),
      ]);

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
