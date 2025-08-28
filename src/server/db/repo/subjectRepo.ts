import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { subjects } from "~/server/db/schema/subjects";

export const subjectRepo = {
  async findById(id: number) {
    return db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1)
      .then((results) => results[0] ?? null);
  },

  async findByName(name: string) {
    return db
      .select()
      .from(subjects)
      .where(eq(subjects.name, name))
      .limit(1)
      .then((results) => results[0] ?? null);
  },

  async findAll() {
    return db.select().from(subjects).orderBy(subjects.name);
  },

  async create(data: { name: string; description?: string | null }) {
    const [subject] = await db.insert(subjects).values(data).returning();
    return subject;
  },

  async update(
    id: number,
    data: {
      name?: string;
      description?: string | null;
    },
  ) {
    const [subject] = await db
      .update(subjects)
      .set(data)
      .where(eq(subjects.id, id))
      .returning();
    return subject;
  },

  async delete(id: number) {
    await db.delete(subjects).where(eq(subjects.id, id));
  },
};
