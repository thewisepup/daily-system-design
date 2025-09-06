import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "~/server/db";
import {
  deliveries,
  DeliveryUpdateSchema,
  type DeliveryStatus,
} from "~/server/db/schema/deliveries";

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
   * @param userIds Array of user IDs to create delivery records for
   * @param issueId Newsletter issue ID
   * @returns Array of created delivery records
   */
  async bulkCreatePending(userIds: string[], issueId: number) {
    if (userIds.length === 0) return [];

    const deliveryRecords = userIds.map((userId) => ({
      issueId,
      userId,
      status: "pending" as DeliveryStatus,
    }));

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
};
