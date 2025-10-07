import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { companyService } from "~/server/services/CompanyService";

export const CreateCompanyRequest = z.object({
  companyName: z.string(),
});
type CreateCompanyRequest = z.infer<typeof CreateCompanyRequest>;

export const companyRouter = createTRPCRouter({
  createCompany: adminProcedure
    .input(CreateCompanyRequest)
    .mutation(async ({ input }) => {
      try {
        console.log(`createCompany ${input.companyName}`);
        await companyService.createCompany({ name: input.companyName });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Failed to createCompany " + input.companyName, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Unable to createCompany. Please try again later." +
            input.companyName,
        });
      }
    }),
});
