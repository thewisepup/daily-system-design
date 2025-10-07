import z from "zod";
import { db } from "..";
import { company } from "../schema/company";
import { eq } from "drizzle-orm";

const PatchCompanyDao = z.object({
  name: z.string().optional(),
});
type PatchCompanyDao = z.infer<typeof PatchCompanyDao>;

class CompanyRepo {
  async createCompany(companyName: string) {
    return await db
      .insert(company)
      .values({
        name: companyName,
      })
      .returning();
  }

  async patchCompany(companyId: number, data: PatchCompanyDao) {
    return await db
      .update(company)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(company.id, companyId))
      .returning();
  }
}
export const companyRepo = new CompanyRepo();
