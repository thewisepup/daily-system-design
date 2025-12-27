import { eq, desc } from "drizzle-orm";
import { db } from "~/server/db";
import { newsletterSendResults } from "~/server/db/schema/newsletterSendResults";

export const newsletterSendResultRepo = {
  async create(data: {
    name: string;
    issueId: number;
    startTime: Date;
    totalSent?: number;
    totalFailed?: number;
    failedUserIds?: string[];
    completionTime?: Date;
  }) {
    const [result] = await db
      .insert(newsletterSendResults)
      .values({
        name: data.name,
        issueId: data.issueId,
        startTime: data.startTime,
        totalSent: data.totalSent ?? 0,
        totalFailed: data.totalFailed ?? 0,
        failedUserIds: data.failedUserIds ?? [],
        completionTime: data.completionTime,
      })
      .returning();
    return result;
  },

  async findById(id: number) {
    return db
      .select()
      .from(newsletterSendResults)
      .where(eq(newsletterSendResults.id, id))
      .limit(1)
      .then((rows) => rows[0]);
  },

  async findByIssueId(issueId: number) {
    return db
      .select()
      .from(newsletterSendResults)
      .where(eq(newsletterSendResults.issueId, issueId))
      .orderBy(desc(newsletterSendResults.createdAt));
  },

  async findLatest(limit = 10) {
    return db
      .select()
      .from(newsletterSendResults)
      .orderBy(desc(newsletterSendResults.createdAt))
      .limit(limit);
  },

  async updateCompletion(
    id: number,
    data: {
      totalSent: number;
      totalFailed: number;
      failedUserIds: string[];
      completionTime: Date;
    },
  ) {
    const [result] = await db
      .update(newsletterSendResults)
      .set({
        totalSent: data.totalSent,
        totalFailed: data.totalFailed,
        failedUserIds: data.failedUserIds,
        completionTime: data.completionTime,
      })
      .where(eq(newsletterSendResults.id, id))
      .returning();
    return result;
  },

  async deleteById(id: number) {
    await db
      .delete(newsletterSendResults)
      .where(eq(newsletterSendResults.id, id));
  },
};
