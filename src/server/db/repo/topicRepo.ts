import { eq, gt, asc, desc, and, isNull } from "drizzle-orm";
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

  async findBySubjectIdAndSequence(subjectId: number, sequenceOrder: number) {
    return db
      .select()
      .from(topics)
      .where(and(eq(topics.subjectId, subjectId), eq(topics.sequenceOrder, sequenceOrder)))
      .limit(1)
      .then((rows) => rows[0] ?? null);
  },

  async create(data: {
    title: string;
    topicData: object;
    subjectId: number;
    sequenceOrder: number;
  }) {
    const [topic] = await db.insert(topics).values(data).returning();
    return topic;
  },

  async createMany(
    topicsData: Array<{
      title: string;
      topicData: object;
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
        topicData: topics.topicData,
        sequenceOrder: topics.sequenceOrder,
        issueStatus: issues.status,
        issueId: issues.id,
      })
      .from(topics)
      .leftJoin(issues, eq(topics.id, issues.topicId))
      .where(eq(topics.subjectId, subjectId))
      .orderBy(asc(topics.sequenceOrder));
  },

  async getTopicsWithIssueStatusPaginated(
    subjectId: number,
    limit: number,
    cursor?: number,
  ) {
    const whereConditions = cursor
      ? and(eq(topics.subjectId, subjectId), gt(topics.sequenceOrder, cursor))
      : eq(topics.subjectId, subjectId);

    return db
      .select({
        id: topics.id,
        title: topics.title,
        topicData: topics.topicData,
        sequenceOrder: topics.sequenceOrder,
        issueStatus: issues.status,
        issueId: issues.id,
      })
      .from(topics)
      .leftJoin(issues, eq(topics.id, issues.topicId))
      .where(whereConditions)
      .orderBy(asc(topics.sequenceOrder))
      .limit(limit);
  },

  async getExistingTitles(subjectId: number) {
    const existingTopics = await db
      .select({ title: topics.title })
      .from(topics)
      .where(eq(topics.subjectId, subjectId))
      .orderBy(asc(topics.sequenceOrder));
    return existingTopics.map(topic => topic.title);
  },

  async getHighestSequenceOrder(subjectId: number): Promise<number> {
    const result = await db
      .select({ maxSequence: topics.sequenceOrder })
      .from(topics)
      .where(eq(topics.subjectId, subjectId))
      .orderBy(desc(topics.sequenceOrder))
      .limit(1);
    return result.length > 0 ? result[0]!.maxSequence : 0;
  },

  async findTopicsWithoutIssues(subjectId: number, limit: number) {
    return db
      .select({
        id: topics.id,
        title: topics.title,
        topicData: topics.topicData,
        sequenceOrder: topics.sequenceOrder,
      })
      .from(topics)
      .leftJoin(issues, eq(topics.id, issues.topicId))
      .where(and(eq(topics.subjectId, subjectId), isNull(issues.id)))
      .orderBy(asc(topics.sequenceOrder))
      .limit(limit);
  },
};
