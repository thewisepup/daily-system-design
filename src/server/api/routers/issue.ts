import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { issueService } from "~/server/services/IssueService";
import { TRPCError } from "@trpc/server";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

export const GetIssueSummariesRequestSchema = z.object({
  subjectId: z.number().default(SYSTEM_DESIGN_SUBJECT_ID),
  numResults: z.number(),
});

export type GetIssueSummariesRequest = z.infer<
  typeof GetIssueSummariesRequestSchema
>;

export const IssueSummarySchema = z.object({
  issueId: z.number(),
  title: z.string(),
});

export type IssueSummary = z.infer<typeof IssueSummarySchema>;

export const GetIssueSummaryResponseSchema = z.object({
  issueSummaries: z.array(IssueSummarySchema),
});

export type GetIssueSummaryResponse = z.infer<
  typeof GetIssueSummaryResponseSchema
>;

export const issueRouter = createTRPCRouter({
  getIssueById: publicProcedure
    .input(z.object({ issueId: z.number() }))
    .query(async ({ input }) => {
      try {
        const issue = await issueService.getIssueById(input.issueId);
        if (!issue) {
          throw new TRPCError({
            code: "BAD_REQUEST", //TODO: update to error code for resource not found
            message: `IssueId: ${input.issueId} does not exist`,
          });
        }
        return issue;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Failed to get issueId: " + input.issueId, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `"Unable to get issueId: ${input.issueId} Please try again later.`,
        });
      }
    }),

  getIssueSummaries: publicProcedure
    .input(GetIssueSummariesRequestSchema)
    .query(async ({ input }) => {
      try {
        console.log("getIssueSummaries" + JSON.stringify(input));
        const issueSummaries = await issueService.getIssueSummaries(
          input.subjectId,
          input.numResults,
        );
        return { issueSummaries: issueSummaries ?? [] };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get issue summaries",
        });
      }
    }),
});
