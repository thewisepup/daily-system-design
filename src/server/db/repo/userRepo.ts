import { eq, desc, count, sql, gte } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";
import { subscriptions } from "~/server/db/schema/subscriptions";
import { deliveries } from "~/server/db/schema/deliveries";
import { subscriptionsAudit } from "~/server/db/schema/subscriptionsAudit";
import { transactionalEmails } from "~/server/db/schema/transactionalEmails";

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
   * Create multiple users in bulk
   */
  async bulkCreate(data: Array<{ email: string }>) {
    if (data.length === 0) {
      return [];
    }
    return await db.insert(users).values(data).returning();
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
   * Delete a user and all related records (cascading delete)
   * Deletes records in correct order to respect foreign key constraints
   */
  async deleteUserCascading(id: string) {
    console.log(
      `UserRepo: Starting transaction for cascading delete of user ${id}`,
    );
    return await db.transaction(async (tx) => {
      // Delete in correct order to respect foreign key constraints
      await tx.delete(deliveries).where(eq(deliveries.userId, id));
      await tx
        .delete(transactionalEmails)
        .where(eq(transactionalEmails.userId, id));
      await tx
        .delete(subscriptionsAudit)
        .where(eq(subscriptionsAudit.userId, id));
      await tx.delete(subscriptions).where(eq(subscriptions.userId, id));
      await tx.delete(users).where(eq(users.id, id));
      console.log(
        `UserRepo: Transaction completed successfully for cascading delete of user ${id}`,
      );
      return { success: true };
    });
  },

  /**
   * Get daily signup statistics for the last N days (PST timezone)
   */
  async getDailySignupStats(days = 7) {
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
   * Get paginated users with active subscriptions
   */
  async findUsersWithActiveSubscription(page = 1, limit = 25) {
    const offset = (page - 1) * limit;

    // Get users with active subscriptions
    const usersWithActiveSubscriptions = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
      .where(eq(subscriptions.status, "active"))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return usersWithActiveSubscriptions;
  },

  /**
   * Get total count of users with active subscriptions
   */
  async countUsersWithActiveSubscription() {
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
      .where(eq(subscriptions.status, "active"));

    return result?.count ?? 0;
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

  //TODO: remove user from newsletter. Either add to subscriptions table or add field to users
  async markInactive(_userId: string) {
    return;
  },
};
