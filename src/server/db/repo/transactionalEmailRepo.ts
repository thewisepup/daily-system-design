import { eq, and, desc } from "drizzle-orm";
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
};
