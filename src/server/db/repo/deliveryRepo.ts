import { eq, and, desc } from "drizzle-orm";
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
};
