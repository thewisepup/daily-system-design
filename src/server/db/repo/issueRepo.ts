import { eq, desc } from "drizzle-orm";
import { db } from "~/server/db";
import { issues } from "~/server/db/schema/issues";

export const issueRepo = {
  async findById(id: number) {
    return db
      .select()
      .from(issues)
      .where(eq(issues.id, id))
      .limit(1)
      .then((rows) => rows[0]);
  },

  async findByTopicId(topicId: number) {
    return db
      .select()
      .from(issues)
      .where(eq(issues.topicId, topicId))
      .orderBy(desc(issues.createdAt))
      .limit(1)
      .then((rows) => rows[0]);
  },

  async create(data: {
    topicId: number;
    title: string;
    content?: string | null;
    status?: "generating" | "draft" | "approved" | "sent";
  }) {
    const [issue] = await db.insert(issues).values(data).returning();
    return issue;
  },

  async update(
    id: number,
    data: {
      title?: string;
      content?: string | null;
      status?: "generating" | "draft" | "approved" | "sent";
      updatedAt?: Date;
      approvedAt?: Date | null;
      sentAt?: Date | null;
    },
  ) {
    const [issue] = await db
      .update(issues)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(issues.id, id))
      .returning();
    return issue;
  },

  async findByStatus(status: "generating" | "draft" | "approved" | "sent") {
    return db
      .select()
      .from(issues)
      .where(eq(issues.status, status))
      .orderBy(desc(issues.createdAt));
  },

  async deleteById(id: number) {
    await db.delete(issues).where(eq(issues.id, id));
  },
};
