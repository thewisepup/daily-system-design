import { eq, desc, and } from "drizzle-orm";
import { db } from "~/server/db";
import { issues, type IssueStatus } from "~/server/db/schema/issues";
import { deliveries } from "~/server/db/schema/deliveries";
import { topics } from "../schema/topics";

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
    contentJson?: unknown;
    rawHtml?: string;
    status?: IssueStatus;
  }) {
    const [issue] = await db.insert(issues).values(data).returning();
    return issue;
  },

  async update(
    id: number,
    data: {
      title?: string;
      contentJson?: unknown;
      rawHtml?: string;
      status?: IssueStatus;
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

  async findByStatus(status: IssueStatus) {
    return db
      .select()
      .from(issues)
      .where(eq(issues.status, status))
      .orderBy(desc(issues.createdAt));
  },

  async deleteById(id: number) {
    await db.delete(issues).where(eq(issues.id, id));
  },

  /**
   * Delete an issue with cascading deletes and status validation
   * Only allows deletion of issues with status: draft, failed, or generating
   */
  async deleteWithCascade(id: number) {
    return db.transaction(async (tx) => {
      // First, get the issue to check its status
      const issue = await tx
        .select()
        .from(issues)
        .where(eq(issues.id, id))
        .limit(1)
        .then((rows) => rows[0]);

      if (!issue) {
        throw new Error("Issue not found");
      }

      // Validate that the issue can be deleted
      const deletableStatuses: IssueStatus[] = [
        "draft",
        "failed",
        "generating",
      ];
      if (!deletableStatuses.includes(issue.status)) {
        throw new Error(
          `Cannot delete issue with status '${issue.status}'. Only issues with status 'draft', 'failed', or 'generating' can be deleted.`,
        );
      }

      // Delete related delivery records first (foreign key constraint)
      await tx.delete(deliveries).where(eq(deliveries.issueId, id));

      // Delete the issue itself
      await tx.delete(issues).where(eq(issues.id, id));

      return { success: true, deletedIssue: issue };
    });
  },

  async getIssueSummaries(subjectId: number, numResults = 10) {
    return db
      .select({ issueId: issues.id, title: issues.title })
      .from(issues)
      .fullJoin(topics, eq(issues.topicId, topics.id))
      .where(and(eq(topics.subjectId, subjectId), eq(issues.status, "sent")))
      .orderBy(desc(topics.sequenceOrder))
      .limit(numResults);
  },
};
