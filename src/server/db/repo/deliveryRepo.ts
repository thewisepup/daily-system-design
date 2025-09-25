import { eq, and, desc, sql, inArray, count } from "drizzle-orm";
import { db } from "~/server/db";
import {
  deliveries,
  DeliveryUpdateSchema,
  type DeliveryStatus,
} from "~/server/db/schema/deliveries";
import { issues } from "~/server/db/schema/issues";
import { topics } from "~/server/db/schema/topics";
import { subscriptions } from "~/server/db/schema/subscriptions";
import { users } from "~/server/db/schema/users";

export const deliveryRepo = {
  async create(data: {
    issueId: number;
    userId: string;
    status?: DeliveryStatus;
  }) {
    const [delivery] = await db
      .insert(deliveries)
      .values({
        ...data,
        status: data.status ?? "pending",
      })
      .returning();
    return delivery;
  },

  async findById(id: string) {
    return db
      .select()
      .from(deliveries)
      .where(eq(deliveries.id, id))
      .limit(1)
      .then((rows) => rows[0]);
  },

  async findByIssueAndUser(issueId: number, userId: string) {
    return db
      .select()
      .from(deliveries)
      .where(
        and(eq(deliveries.issueId, issueId), eq(deliveries.userId, userId)),
      )
      .orderBy(desc(deliveries.createdAt))
      .limit(1)
      .then((rows) => rows[0]);
  },

  async findByIssueId(issueId: number) {
    return db
      .select()
      .from(deliveries)
      .where(eq(deliveries.issueId, issueId))
      .orderBy(desc(deliveries.createdAt));
  },

  async findByUserId(userId: string) {
    return db
      .select()
      .from(deliveries)
      .where(eq(deliveries.userId, userId))
      .orderBy(desc(deliveries.createdAt));
  },

  async updateStatus(
    id: string,
    status: DeliveryStatus,
    updates?: {
      externalId?: string;
      errorMessage?: string;
      sentAt?: Date;
      deliveredAt?: Date;
    },
  ) {
    // Use Zod schema for type-safe update data
    const updateData = DeliveryUpdateSchema.parse({
      status,
      ...updates,
    });

    const [delivery] = await db
      .update(deliveries)
      .set(updateData)
      .where(eq(deliveries.id, id))
      .returning();
    return delivery;
  },

  async findByStatus(status: DeliveryStatus) {
    return db
      .select()
      .from(deliveries)
      .where(eq(deliveries.status, status))
      .orderBy(desc(deliveries.createdAt));
  },

  async deleteById(id: string) {
    await db.delete(deliveries).where(eq(deliveries.id, id));
  },

  /**
   * Bulk create pending delivery records for newsletter cron job
   * Only creates records if (userId, issueId) combination doesn't already exist
   * @param userIds Array of user IDs to create delivery records for
   * @param issueId Newsletter issue ID
   * @returns Array of created delivery records
   */
  async bulkCreatePending(userIds: string[], issueId: number) {
    if (userIds.length === 0) return [];

    const existingDeliveries = await db
      .select({ userId: deliveries.userId })
      .from(deliveries)
      .where(
        and(
          eq(deliveries.issueId, issueId),
          inArray(deliveries.userId, userIds),
        ),
      );

    const existingUserIds = new Set(existingDeliveries.map((d) => d.userId));

    const newUserIds = userIds.filter((userId) => !existingUserIds.has(userId));

    if (newUserIds.length === 0) {
      console.log(
        `[${new Date().toISOString()}] [INFO] No new delivery records to create - all users already have records for issue ${issueId}`,
      );
      return [];
    }

    const deliveryRecords = newUserIds.map((userId) => ({
      issueId,
      userId,
      status: "pending" as DeliveryStatus,
    }));

    console.log(
      `[${new Date().toISOString()}] [INFO] Creating ${newUserIds.length} new delivery records for issue ${issueId}`,
      {
        totalRequested: userIds.length,
        alreadyExisting: existingUserIds.size,
        newRecords: newUserIds.length,
      },
    );

    return db.insert(deliveries).values(deliveryRecords).returning();
  },

  /**
   * Bulk update delivery statuses after email sending using efficient SQL CASE statements
   * @param issueId Newsletter issue ID
   * @param updates Array of status updates with user correlation
   */
  async bulkUpdateStatuses(
    issueId: number,
    updates: Array<{
      userId: string;
      status: DeliveryStatus;
      externalId?: string;
      errorMessage?: string;
      sentAt?: Date;
    }>,
  ) {
    if (updates.length === 0) return;

    const userIds = updates.map((u) => u.userId);

    // Build SQL CASE statements for each field
    const statusCases = updates.map(
      (u) =>
        sql`WHEN ${deliveries.userId} = ${u.userId} THEN ${u.status}::delivery_status`,
    );

    const externalIdCases = updates.map((u) =>
      u.externalId
        ? sql`WHEN ${deliveries.userId} = ${u.userId} THEN ${u.externalId}`
        : sql`WHEN ${deliveries.userId} = ${u.userId} THEN ${deliveries.externalId}`,
    );

    const errorMessageCases = updates.map((u) =>
      u.errorMessage
        ? sql`WHEN ${deliveries.userId} = ${u.userId} THEN ${u.errorMessage}`
        : sql`WHEN ${deliveries.userId} = ${u.userId} THEN ${deliveries.errorMessage}`,
    );

    const sentAtCases = updates.map((u) =>
      u.sentAt
        ? sql`WHEN ${deliveries.userId} = ${u.userId} THEN ${u.sentAt.toISOString()}::timestamp`
        : sql`WHEN ${deliveries.userId} = ${u.userId} THEN ${deliveries.sentAt}`,
    );

    // Execute bulk update with CASE statements
    await db
      .update(deliveries)
      .set({
        status: sql`CASE ${sql.join(statusCases, sql` `)} END`,
        externalId: sql`CASE ${sql.join(externalIdCases, sql` `)} END`,
        errorMessage: sql`CASE ${sql.join(errorMessageCases, sql` `)} END`,
        sentAt: sql`CASE ${sql.join(sentAtCases, sql` `)} END`,
      })
      .where(
        and(
          eq(deliveries.issueId, issueId),
          inArray(deliveries.userId, userIds),
        ),
      );
  },

  /**
   * Update delivery record status after email send attempt
   */
  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    externalId?: string,
    errorMessage?: string,
  ) {
    const updateData: Record<string, unknown> = {
      status,
    };

    if (externalId) {
      updateData.externalId = externalId;
    }

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    if (status === "sent") {
      updateData.sentAt = new Date();
    }

    const [delivery] = await db
      .update(deliveries)
      .set(updateData)
      .where(eq(deliveries.id, deliveryId))
      .returning();

    return delivery;
  },

  /**
   * Get aggregated metrics for recent newsletter issues
   * @param limit Number of recent issues to retrieve (default: 5)
   * @returns Array of newsletter metrics with delivery stats
   */
  async findRecentIssueMetrics(limit = 5) {
    const result = await db
      .select({
        issueId: issues.id,
        issueTitle: issues.title,
        sentAt: issues.sentAt,
        total: count(),
        sent: sql<number>`COUNT(CASE WHEN ${deliveries.status} IN ('sent', 'delivered') THEN 1 END)`,
        pending: sql<number>`COUNT(CASE WHEN ${deliveries.status} = 'pending' THEN 1 END)`,
        failed: sql<number>`COUNT(CASE WHEN ${deliveries.status} IN ('failed', 'bounced') THEN 1 END)`,
      })
      .from(issues)
      .leftJoin(deliveries, eq(issues.id, deliveries.issueId))
      .where(eq(issues.status, "sent"))
      .groupBy(issues.id, issues.title, issues.sentAt)
      .orderBy(desc(issues.sentAt))
      .limit(limit);

    return result.map((row) => ({
      issueId: row.issueId,
      issueTitle: row.issueTitle,
      sentAt: row.sentAt,
      total: Number(row.total),
      sent: Number(row.sent),
      pending: Number(row.pending),
      failed: Number(row.failed),
      successRate: row.total > 0 ? Number(row.sent) / Number(row.total) : 0,
    }));
  },

  /**
   * Get users with failed or pending deliveries for a specific issue that have active subscriptions
   * @param issueId Newsletter issue ID
   * @returns Array of User objects with active subscriptions that need to be resent
   */
  async findActiveSubscribersWithFailedDeliveries(issueId: number) {
    // First get the subjectId from the issue
    const issueWithSubject = await db
      .select({
        subjectId: topics.subjectId,
      })
      .from(issues)
      .innerJoin(topics, eq(issues.topicId, topics.id))
      .where(eq(issues.id, issueId))
      .limit(1);

    if (issueWithSubject.length === 0) {
      return [];
    }

    const subjectId = issueWithSubject[0]!.subjectId;

    // Then query deliveries with active subscriptions
    return await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(deliveries)
      .innerJoin(users, eq(deliveries.userId, users.id))
      .innerJoin(
        subscriptions,
        and(
          eq(subscriptions.userId, users.id),
          eq(subscriptions.subjectId, subjectId),
          eq(subscriptions.status, "active"),
        ),
      )
      .where(
        and(
          eq(deliveries.issueId, issueId),
          inArray(deliveries.status, ["pending", "failed", "bounced"]),
        ),
      );
  },
};
