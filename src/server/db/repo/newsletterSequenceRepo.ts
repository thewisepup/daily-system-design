import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { newsletterSequence } from "~/server/db/schema/newsletterSequence";

export const newsletterSequenceRepo = {
  async findBySubjectId(subjectId: number) {
    return db
      .select()
      .from(newsletterSequence)
      .where(eq(newsletterSequence.subjectId, subjectId))
      .limit(1)
      .then((rows) => rows[0]);
  },

  async create(data: { subjectId: number; currentSequence?: number }) {
    const [record] = await db
      .insert(newsletterSequence)
      .values({
        subjectId: data.subjectId,
        currentSequence: data.currentSequence ?? 1,
      })
      .returning();
    return record;
  },

  async update(
    subjectId: number,
    data: {
      currentSequence?: number;
      lastSentAt?: Date;
      updatedAt?: Date;
    },
  ) {
    const [record] = await db
      .update(newsletterSequence)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(newsletterSequence.subjectId, subjectId))
      .returning();
    return record;
  },

  async incrementSequence(subjectId: number) {
    const [record] = await db
      .update(newsletterSequence)
      .set({
        currentSequence: sql`${newsletterSequence.currentSequence} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(newsletterSequence.subjectId, subjectId))
      .returning();
    return record;
  },

  async getOrCreate(subjectId: number, startingSequence = 1) {
    let record = await this.findBySubjectId(subjectId);

    record ??= await this.create({
      subjectId,
      currentSequence: startingSequence,
    });

    return record;
  },
};
