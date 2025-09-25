import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { generateNewsletterForTopic } from "~/server/newsletter/generateNewsletter";
import { sendNewsletterToAdmin } from "~/server/newsletter/sendNewsletter";
import { resendNewsletterToFailedUsers } from "~/server/newsletter/resendNewsletter";
import {
  canApprove,
  canUnapprove,
  validateStatusTransition,
} from "~/server/newsletter/issueStatusMachine";
import { SendNewsletterToAdminResponseSchema } from "~/server/email/types";
import { IssueStatusSchema, type IssueStatus } from "~/server/db/schema/issues";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { topicRepo } from "~/server/db/repo/topicRepo";
import { deliveryRepo } from "~/server/db/repo/deliveryRepo";

export const newsletterRouter = createTRPCRouter({
  getByTopicId: adminProcedure
    .input(
      z.object({
        topicId: z.number().int().positive(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const issue = await issueRepo.findByTopicId(input.topicId);
        if (!issue) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No newsletter found for this topic",
          });
        }
        return issue;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error fetching newsletter:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch newsletter",
        });
      }
    }),

  generate: adminProcedure
    .input(
      z.object({
        topicId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await generateNewsletterForTopic(input.topicId);
        return { success: true };
      } catch (error) {
        console.error("Error generating newsletter:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate newsletter",
        });
      }
    }),

  sendToAdmin: adminProcedure
    .input(
      z.object({
        topicId: z.number().int().positive(),
      }),
    )
    .output(SendNewsletterToAdminResponseSchema)
    .mutation(async ({ input }) => {
      try {
        const topic = await topicRepo.findById(input.topicId);
        if (!topic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Topic not found",
          });
        }
        const sequenceNumber = topic.sequenceOrder;
        const result = await sendNewsletterToAdmin({
          topicId: input.topicId,
          sequenceNumber,
        });
        return result;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error sending newsletter to admin:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to send newsletter",
        });
      }
    }),

  approve: adminProcedure
    .input(
      z.object({
        topicId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const issue = await issueRepo.findByTopicId(input.topicId);

        if (!issue) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No newsletter found for this topic",
          });
        }

        // Check if approval is allowed
        if (!canApprove(issue.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot approve newsletter with status: ${issue.status}. Only draft newsletters can be approved.`,
          });
        }

        // Update status to approved
        const updatedIssue = await issueRepo.update(issue.id, {
          status: "approved",
          approvedAt: new Date(),
        });

        return {
          success: true,
          status: updatedIssue?.status ?? "approved",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error approving newsletter:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to approve newsletter",
        });
      }
    }),

  unapprove: adminProcedure
    .input(
      z.object({
        topicId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const issue = await issueRepo.findByTopicId(input.topicId);

        if (!issue) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No newsletter found for this topic",
          });
        }

        // Check if unapproval is allowed
        if (!canUnapprove(issue.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot unapprove newsletter with status: ${issue.status}. Only approved newsletters can be moved back to draft.`,
          });
        }

        // Update status back to draft
        const updatedIssue = await issueRepo.update(issue.id, {
          status: "draft",
          approvedAt: null, // Clear approval timestamp
        });

        return {
          success: true,
          status: updatedIssue?.status ?? "draft",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error unapproving newsletter:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to unapprove newsletter",
        });
      }
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        topicId: z.number().int().positive(),
        newStatus: IssueStatusSchema,
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const issue = await issueRepo.findByTopicId(input.topicId);

        if (!issue) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No newsletter found for this topic",
          });
        }

        // Validate state transition using the state machine
        validateStatusTransition(issue.status, input.newStatus);

        // Prepare update data with proper typing
        const updateData: {
          status: IssueStatus;
          approvedAt?: Date | null;
          sentAt?: Date;
        } = { status: input.newStatus };

        // Set/clear timestamps based on new status
        if (input.newStatus === "approved") {
          updateData.approvedAt = new Date();
        } else if (input.newStatus === "draft" && issue.status === "approved") {
          updateData.approvedAt = null; // Clear approval when moving back to draft
        } else if (input.newStatus === "sent") {
          updateData.sentAt = new Date();
        }

        const updatedIssue = await issueRepo.update(issue.id, updateData);

        return {
          success: true,
          status: updatedIssue?.status ?? input.newStatus,
          approvedAt: updatedIssue?.approvedAt,
          sentAt: updatedIssue?.sentAt,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error updating newsletter status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update newsletter status",
        });
      }
    }),

  generateBulk: adminProcedure
    .input(
      z.object({
        subjectId: z.number().int().positive().default(1), // System Design
        count: z.number().int().min(1).max(50).default(5),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Find topics without issues
        const topicsWithoutIssues = await topicRepo.findTopicsWithoutIssues(
          input.subjectId,
          input.count,
        );

        if (topicsWithoutIssues.length === 0) {
          return {
            totalRequested: input.count,
            successful: 0,
            failed: 0,
            results: [],
            message: "No topics found without existing newsletters",
          };
        }

        // Process topics in parallel for faster generation
        const promises = topicsWithoutIssues.map(async (topic) => {
          try {
            await generateNewsletterForTopic(topic.id);
            return {
              topicId: topic.id,
              title: topic.title,
              sequenceOrder: topic.sequenceOrder,
              success: true,
            };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            console.error(
              `Failed to generate newsletter for topic ${topic.id}:`,
              error,
            );
            return {
              topicId: topic.id,
              title: topic.title,
              sequenceOrder: topic.sequenceOrder,
              success: false,
              error: errorMessage,
            };
          }
        });

        const results = await Promise.all(promises);
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        return {
          totalRequested: input.count,
          successful,
          failed,
          results,
          message: `Successfully generated ${successful}/${topicsWithoutIssues.length} newsletters`,
        };
      } catch (error) {
        console.error("Error in bulk newsletter generation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate newsletters in bulk",
        });
      }
    }),

  delete: adminProcedure
    .input(
      z.object({
        topicId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const issue = await issueRepo.findByTopicId(input.topicId);

        if (!issue) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No newsletter found for this topic",
          });
        }

        // Attempt to delete the issue with cascading deletes and status validation
        const result = await issueRepo.deleteWithCascade(issue.id);

        return {
          success: true,
          message: `Successfully deleted newsletter for topic ${input.topicId}`,
          deletedIssue: {
            id: result.deletedIssue.id,
            status: result.deletedIssue.status,
            title: result.deletedIssue.title,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error deleting newsletter:", error);

        // Handle specific error cases
        if (error instanceof Error) {
          if (error.message.includes("Cannot delete issue with status")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }
          if (error.message === "Issue not found") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Newsletter issue not found",
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete newsletter",
        });
      }
    }),

  // Newsletter metrics and resend procedures
  getRecentMetrics: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(20).optional().default(5),
      }),
    )
    .query(async ({ input }) => {
      try {
        const data = await deliveryRepo.findRecentIssueMetrics(input.limit);
        console.log(data);
        return data;
      } catch (error) {
        console.error("Error fetching newsletter metrics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch newsletter metrics",
        });
      }
    }),

  getFailedDeliveryUsers: adminProcedure
    .input(
      z.object({
        issueId: z.number().int().positive(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const users =
          await deliveryRepo.findActiveSubscribersWithFailedDeliveries(
            input.issueId,
          );
        return {
          issueId: input.issueId,
          failedUsers: users,
          count: users.length,
        };
      } catch (error) {
        console.error("Error fetching failed delivery users:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch failed delivery users",
        });
      }
    }),

  resendToFailedUsers: adminProcedure
    .input(
      z.object({
        issueId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const result = await resendNewsletterToFailedUsers(input.issueId);
        return result;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error resending newsletter to failed users:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to resend newsletter to failed users",
        });
      }
    }),
});
