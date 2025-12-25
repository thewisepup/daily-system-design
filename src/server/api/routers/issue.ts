import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { issueService } from "~/server/services/IssueService";
import { TRPCError } from "@trpc/server";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

export const GetIssueSummariesRequestSchema = z.object({
  subjectId: z.number().default(SYSTEM_DESIGN_SUBJECT_ID),
  page: z.number().default(1),
  resultsPerPage: z.number().default(10),
});

export type GetIssueSummariesRequest = z.infer<
  typeof GetIssueSummariesRequestSchema
>;

export const IssueSummary = z.object({
  issueId: z.number(),
  title: z.string(),
  issueNumber: z.number().min(1),
});

export type IssueSummary = z.infer<typeof IssueSummary>;

export const issueRouter = createTRPCRouter({
  getSentIssueById: publicProcedure
    .input(z.object({ issueId: z.number() }))
    .query(async ({ input }) => {
      try {
        const issue = await issueService.getSentIssueById(input.issueId);
        if (!issue) {
          throw new TRPCError({
            code: "BAD_REQUEST", //TODO: update to error code for resource not found
            message: `IssueId: ${input.issueId} does not exist`,
          });
        }
        console.log(issue);
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

  getLatestSentIssue: publicProcedure
    .input(
      z.object({ subjectId: z.number().default(SYSTEM_DESIGN_SUBJECT_ID) }),
    )
    .query(async ({ input }) => {
      try {
        const issue = await issueService.getLatestSentIssue(input.subjectId);
        if (!issue) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `No sent issues found for subject ${input.subjectId}`,
          });
        }
        return issue;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error(
          "Failed to get latest sent issue for subject: " + input.subjectId,
          error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to get latest issue. Please try again later.",
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
          input.page,
          input.resultsPerPage,
        );
        return issueSummaries;
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

  getIssueSummariesInfinite: publicProcedure
    .input(
      z.object({
        subjectId: z.number().default(SYSTEM_DESIGN_SUBJECT_ID),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { subjectId, limit, cursor } = input;
        const page = cursor ?? 1;

        const issueSummaries = await issueService.getIssueSummaries(
          subjectId,
          page,
          limit,
        );

        return {
          items: issueSummaries,
          nextCursor: issueSummaries.length === limit ? page + 1 : undefined,
        };
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
