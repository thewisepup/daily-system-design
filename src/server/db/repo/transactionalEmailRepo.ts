import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  transactionalEmails,
  TransactionalEmailUpdateSchema,
  type TransactionalEmailType,
  type TransactionalEmailStatus,
} from "~/server/db/schema/transactionalEmails";

export const transactionalEmailRepo = {
  /**
   * Create a transactional email record
   */
  async create(data: {
    userId: string;
    emailType: TransactionalEmailType;
    status?: TransactionalEmailStatus;
  }) {
    const [transactionalEmail] = await db
      .insert(transactionalEmails)
      .values({
        ...data,
        status: data.status ?? "pending",
      })
      .returning();
    return transactionalEmail;
  },

  /**
   * Find transactional email by ID
   */
  async findById(id: string) {
    return db
      .select()
      .from(transactionalEmails)
      .where(eq(transactionalEmails.id, id))
      .limit(1)
      .then((rows) => rows[0]);
  },

  /**
   * Find transactional emails by user ID
   */
  async findByUserId(userId: string) {
    return db
      .select()
      .from(transactionalEmails)
      .where(eq(transactionalEmails.userId, userId))
      .orderBy(desc(transactionalEmails.createdAt));
  },

  /**
   * Find transactional emails by user and email type
   */
  async findByUserAndType(userId: string, emailType: TransactionalEmailType) {
    return db
      .select()
      .from(transactionalEmails)
      .where(
        and(
          eq(transactionalEmails.userId, userId),
          eq(transactionalEmails.emailType, emailType),
        ),
      )
      .orderBy(desc(transactionalEmails.createdAt));
  },

  /**
   * Find transactional emails by status
   */
  async findByStatus(status: TransactionalEmailStatus) {
    return db
      .select()
      .from(transactionalEmails)
      .where(eq(transactionalEmails.status, status))
      .orderBy(desc(transactionalEmails.createdAt));
  },

  /**
   * Update transactional email status and details
   */
  async updateStatus(
    id: string,
    status: TransactionalEmailStatus,
    updates?: {
      externalId?: string;
      errorMessage?: string;
      sentAt?: Date;
      deliveredAt?: Date;
    },
  ) {
    // Use Zod schema for type-safe update data
    const updateData = TransactionalEmailUpdateSchema.parse({
      status,
      ...updates,
    });

    const [transactionalEmail] = await db
      .update(transactionalEmails)
      .set(updateData)
      .where(eq(transactionalEmails.id, id))
      .returning();
    return transactionalEmail;
  },

  /**
   * Delete transactional email by ID
   */
  async deleteById(id: string) {
    await db.delete(transactionalEmails).where(eq(transactionalEmails.id, id));
  },

  /**
   * Bulk check which users already received a specific campaign
   * Returns a Set of userIds who have already received the campaign with "sent" status
   */
  async getUsersWhoReceivedCampaign(
    userIds: string[],
    emailType: TransactionalEmailType,
    campaignId: string,
  ): Promise<Set<string>> {
    if (userIds.length === 0) {
      return new Set();
    }

    const results = await db
      .select({ userId: transactionalEmails.userId })
      .from(transactionalEmails)
      .where(
        and(
          inArray(transactionalEmails.userId, userIds),
          eq(transactionalEmails.emailType, emailType),
          eq(transactionalEmails.campaignId, campaignId),
          eq(transactionalEmails.status, "sent"),
        ),
      );

    return new Set(results.map((r) => r.userId));
  },

  /**
   * Bulk create pending transactional email records for campaign
   */
  async bulkCreatePending(
    userIds: string[],
    emailType: TransactionalEmailType,
    campaignId: string,
  ): Promise<void> {
    if (userIds.length === 0) return;

    const values = userIds.map((userId) => ({
      userId,
      emailType,
      campaignId,
      status: "pending" as const,
    }));

    await db.insert(transactionalEmails).values(values);
  },

  /**
   * Bulk update transactional email statuses using efficient SQL CASE statements
   * Similar to deliveryRepo.bulkUpdateStatuses but for transactional emails
   */
  async bulkUpdateStatuses(
    emailType: TransactionalEmailType,
    campaignId: string,
    updates: Array<{
      userId: string;
      status: TransactionalEmailStatus;
      externalId?: string;
      errorMessage?: string;
      sentAt?: Date;
    }>,
  ): Promise<void> {
    if (updates.length === 0) return;

    const userIds = updates.map((u) => u.userId);

    // Build SQL CASE statements for each field
    const statusCases = updates.map(
      (u) =>
        sql`WHEN ${transactionalEmails.userId} = ${u.userId} THEN ${u.status}::delivery_status`,
    );

    const externalIdCases = updates.map((u) =>
      u.externalId
        ? sql`WHEN ${transactionalEmails.userId} = ${u.userId} THEN ${u.externalId}`
        : sql`WHEN ${transactionalEmails.userId} = ${u.userId} THEN ${transactionalEmails.externalId}`,
    );

    const errorMessageCases = updates.map((u) =>
      u.errorMessage
        ? sql`WHEN ${transactionalEmails.userId} = ${u.userId} THEN ${u.errorMessage}`
        : sql`WHEN ${transactionalEmails.userId} = ${u.userId} THEN ${transactionalEmails.errorMessage}`,
    );

    const sentAtCases = updates.map((u) =>
      u.sentAt
        ? sql`WHEN ${transactionalEmails.userId} = ${u.userId} THEN ${u.sentAt.toISOString()}::timestamp`
        : sql`WHEN ${transactionalEmails.userId} = ${u.userId} THEN ${transactionalEmails.sentAt}`,
    );

    // Execute bulk update with CASE statements
    await db
      .update(transactionalEmails)
      .set({
        status: sql`CASE ${sql.join(statusCases, sql` `)} END`,
        externalId: sql`CASE ${sql.join(externalIdCases, sql` `)} END`,
        errorMessage: sql`CASE ${sql.join(errorMessageCases, sql` `)} END`,
        sentAt: sql`CASE ${sql.join(sentAtCases, sql` `)} END`,
      })
      .where(
        and(
          eq(transactionalEmails.emailType, emailType),
          eq(transactionalEmails.campaignId, campaignId),
          inArray(transactionalEmails.userId, userIds),
        ),
      );
  },
};
