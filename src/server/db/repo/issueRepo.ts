import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { issues, issueStatusEnum } from "~/server/db/schema/issues";

export const issueRepo = {
  async findById(id: number) {
    return db.query.issues.findFirst({
      where: eq(issues.id, id),
    });
  },

  async findByTopicId(topicId: number) {
    return db.query.issues.findFirst({
      where: eq(issues.topicId, topicId),
    });
  },

  async create(data: {
    topicId: number;
    title: string;
    content?: string | null;
    status?: "generating" | "draft" | "approved" | "sent";
  }) {
    const [issue] = await db.insert(issues)
      .values(data)
      .returning();
    return issue;
  },

  async update(id: number, data: {
    title?: string;
    content?: string | null;
    status?: "generating" | "draft" | "approved" | "sent";
    updatedAt?: Date;
    approvedAt?: Date | null;
    sentAt?: Date | null;
  }) {
    const [issue] = await db.update(issues)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(issues.id, id))
      .returning();
    return issue;
  },

  async findByStatus(status: "generating" | "draft" | "approved" | "sent") {
    return db.select().from(issues)
      .where(eq(issues.status, status))
      .orderBy(issues.createdAt);
  },

  async findByTopicIdWithStatus(topicId: number, status: "generating" | "draft" | "approved" | "sent") {
    return db.query.issues.findFirst({
      where: eq(issues.topicId, topicId) && eq(issues.status, status),
    });
  },

  async deleteById(id: number) {
    await db.delete(issues).where(eq(issues.id, id));
  },
};