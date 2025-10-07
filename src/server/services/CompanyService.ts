import z from "zod";
import { companyRepo } from "../db/repo/CompanyRepo";

const CreateCompanyInput = z.object({
  name: z.string(),
});
type CreateCompanyInput = z.infer<typeof CreateCompanyInput>;

const PatchCompanyInput = z.object({
  id: z.number(),
  name: z.string().optional(),
});
type PatchCompanyInput = z.infer<typeof PatchCompanyInput>;

class CompanyService {
  async createCompany(input: CreateCompanyInput) {
    await companyRepo.createCompany(input.name);
  }

  async patchCompany(input: PatchCompanyInput) {
    const { id, ...data } = input;
    await companyRepo.patchCompany(id, data);
  }
}
export const companyService = new CompanyService();
