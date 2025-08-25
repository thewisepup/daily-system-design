import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { topics } from "~/server/db/schema/topics";
import { issues } from "~/server/db/schema/issues";

export const topicRepo = {
  async findById(id: number) {
    return db
      .select()
      .from(topics)
      .where(eq(topics.id, id))
      .limit(1)
      .then((rows) => rows[0] ?? null);
  },

  async findBySubjectId(subjectId: number) {
    return db
      .select()
      .from(topics)
      .where(eq(topics.subjectId, subjectId))
      .orderBy(topics.sequenceOrder);
  },

  async create(data: {
    title: string;
    description: string | null;
    subjectId: number;
    sequenceOrder: number;
  }) {
    const [topic] = await db.insert(topics).values(data).returning();
    return topic;
  },

  async createMany(
    topicsData: Array<{
      title: string;
      description: string | null;
      subjectId: number;
      sequenceOrder: number;
    }>,
  ) {
    return db.insert(topics).values(topicsData).returning();
  },

  async deleteBySubjectId(subjectId: number) {
    await db.delete(topics).where(eq(topics.subjectId, subjectId));
  },

  async countBySubjectId(subjectId: number) {
    const result = await db
      .select({ count: topics.id })
      .from(topics)
      .where(eq(topics.subjectId, subjectId));
    return result.length;
  },

  async getTopicsWithIssueStatus(subjectId: number) {
    return db
      .select({
        id: topics.id,
        title: topics.title,
        description: topics.description,
        sequenceOrder: topics.sequenceOrder,
        issueStatus: issues.status,
        issueId: issues.id,
      })
      .from(topics)
      .leftJoin(issues, eq(topics.id, issues.topicId))
      .where(eq(topics.subjectId, subjectId))
      .orderBy(topics.sequenceOrder);
  },
};
