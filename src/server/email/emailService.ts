import type {
  EmailProvider,
  EmailSendRequest,
  EmailSendResponse,
  SendNewsletterRequest,
  BulkEmailSendResponse,
} from "./types";
import { EmailSendRequestSchema } from "./types";
import {
  AWS_SES_RATE_LIMIT,
  BULK_EMAIL_DELAY,
  BULK_EMAIL_SIZE,
} from "./constants/bulkEmailConstants";
import { awsSesProvider } from "./providers/awsSes";
import { deliveryRepo } from "../db/repo/deliveryRepo";
import { transactionalEmailRepo } from "../db/repo/transactionalEmailRepo";
import type { DeliveryStatus } from "../db/schema/deliveries";
import type { TransactionalEmailType } from "../db/schema/transactionalEmails";
import { TransactionalEmailTypeSchema } from "../db/schema/transactionalEmails";
import { MESSAGE_TAG_NAMES } from "./constants/messageTagNames";

class EmailService {
  private provider: EmailProvider;

  constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  setProvider(provider: EmailProvider) {
    this.provider = provider;
  }

  /**
   * Send newsletter email - creates entry in deliveries table
   */
  async sendNewsletterEmail(
    request: EmailSendRequest,
    issueId: number,
  ): Promise<EmailSendResponse> {
    try {
      this.validateSendNewsletterEmailRequest(request, issueId);
      const delivery = await deliveryRepo.create({
        issueId: issueId,
        userId: request.userId,
        status: "pending",
      });
      const result = await this.sendEmailViaProvider(request);
      if (delivery) {
        await deliveryRepo.updateDeliveryStatus(
          delivery.id,
          result.status,
          result.messageId,
          result.error,
        );
      }
      return result;
    } catch (error) {
      console.error("Newsletter email service error:", error);
      return {
        status: "failed" as DeliveryStatus,
        error:
          error instanceof Error
            ? error.message
            : "Unknown newsletter email error",
        userId: request.userId,
      };
    }
  }

  async sendTransactionalEmail(
    request: EmailSendRequest,
    emailType: TransactionalEmailType,
  ): Promise<EmailSendResponse> {
    try {
      const requestWithTags = this.addMessageTag(
        request,
        MESSAGE_TAG_NAMES.EMAIL_TYPE,
        emailType,
      );
      this.validateSendTransactionalEmailRequest(requestWithTags);

      const transactionalEmail = await transactionalEmailRepo.create({
        userId: request.userId,
        emailType,
        status: "pending",
      });

      const result = await this.sendEmailViaProvider(requestWithTags);

      if (transactionalEmail) {
        await transactionalEmailRepo.updateStatus(
          transactionalEmail.id,
          result.status === "sent" ? "sent" : "failed",
          {
            externalId: result.messageId,
            errorMessage: result.error,
            sentAt: result.status === "sent" ? new Date() : undefined,
          },
        );
      }

      return result;
    } catch (error) {
      console.error("Transactional email service error:", error);
      return {
        status: "failed" as DeliveryStatus,
        error:
          error instanceof Error
            ? error.message
            : "Unknown transactional email error",
        userId: request.userId,
      };
    }
  }

  /**
   * Send mass marketing campaign to list of users
   * Uses shared batch processing infrastructure
   */
  async sendMarketingCampaign(
    emailRequests: EmailSendRequest[],
    emailType: TransactionalEmailType,
    campaignId: string,
  ): Promise<BulkEmailSendResponse> {
    const startTime = Date.now();
    const totalEntries = emailRequests.length;
    const totalBatches = Math.ceil(totalEntries / BULK_EMAIL_SIZE);

    console.log(
      `[${new Date().toISOString()}] [INFO] Starting marketing campaign send`,
      {
        campaignId,
        emailType,
        totalRecipients: totalEntries,
        batchSize: BULK_EMAIL_SIZE,
        totalBatches,
      },
    );

    try {
      const allResults: BulkEmailSendResponse = {
        success: true,
        totalSent: 0,
        totalFailed: 0,
        failedUserIds: [],
      };

      // Process emails in batches (similar to newsletter sending)
      for (let i = 0; i < emailRequests.length; i += BULK_EMAIL_SIZE) {
        const batchNumber = Math.floor(i / BULK_EMAIL_SIZE) + 1;
        const batch = emailRequests.slice(i, i + BULK_EMAIL_SIZE);

        console.log(
          `[${new Date().toISOString()}] [INFO] Processing campaign batch ${batchNumber}/${totalBatches} (${batch.length} emails)`,
        );

        const batchResult = await this.processBatch(batch, {
          type: "transactional",
          emailType,
          campaignId,
        });
        this.aggregateBatchResults(allResults, batchResult);

        const progressPercent = Math.round(
          ((allResults.totalSent + allResults.totalFailed) / totalEntries) *
            100,
        );
        console.log(
          `[${new Date().toISOString()}] [INFO] Campaign batch ${batchNumber} complete - Progress: ${progressPercent}% (${allResults.totalSent + allResults.totalFailed}/${totalEntries})`,
        );

        await this.delay(AWS_SES_RATE_LIMIT);
      }

      const duration = Date.now() - startTime;
      const avgTimePerEmail =
        totalEntries > 0 ? Math.round(duration / totalEntries) : 0;

      console.log(
        `[${new Date().toISOString()}] [INFO] Marketing campaign send completed`,
        {
          campaignId,
          emailType,
          totalSent: allResults.totalSent,
          totalFailed: allResults.totalFailed,
          successRate:
            totalEntries > 0
              ? `${Math.round((allResults.totalSent / totalEntries) * 100)}%`
              : "0%",
          duration: `${duration}ms`,
          avgTimePerEmail: `${avgTimePerEmail}ms`,
          failedCount: allResults.failedUserIds.length,
        },
      );

      return allResults;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ERROR] Marketing campaign send failed`,
        {
          campaignId,
          emailType,
          totalRecipients: emailRequests.length,
          error: error instanceof Error ? error.message : String(error),
          duration: `${Date.now() - startTime}ms`,
        },
      );

      return {
        success: false,
        totalSent: 0,
        totalFailed: emailRequests.length,
        failedUserIds: emailRequests.map((request) => request.userId),
      };
    }
  }

  //TODO: we need another method to sendMassTransactionalEmail
  async sendNewsletterIssue(
    request: SendNewsletterRequest,
  ): Promise<BulkEmailSendResponse> {
    const startTime = Date.now();
    const totalEntries = request.entries.length;
    const totalBatches = Math.ceil(totalEntries / BULK_EMAIL_SIZE);

    console.log(
      `[${new Date().toISOString()}] [INFO] Starting bulk email send`,
      {
        issueId: request.issue_id,
        totalRecipients: totalEntries,
        batchSize: BULK_EMAIL_SIZE,
        totalBatches,
      },
    );

    //TODO: Add validation that all newsletter MessageTags are present.
    try {
      const allResults: BulkEmailSendResponse = {
        success: true,
        totalSent: 0,
        totalFailed: 0,
        failedUserIds: [],
      };

      for (let i = 0; i < request.entries.length; i += BULK_EMAIL_SIZE) {
        const batchNumber = Math.floor(i / BULK_EMAIL_SIZE) + 1;
        const batch = request.entries.slice(i, i + BULK_EMAIL_SIZE);

        console.log(
          `[${new Date().toISOString()}] [INFO] Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`,
        );

        const batchResult = await this.processBatch(batch, {
          type: "newsletter",
          issueId: request.issue_id,
        });
        this.aggregateBatchResults(allResults, batchResult);

        const progressPercent = Math.round(
          ((allResults.totalSent + allResults.totalFailed) / totalEntries) *
            100,
        );
        console.log(
          `[${new Date().toISOString()}] [INFO] Batch ${batchNumber} complete - Progress: ${progressPercent}% (${allResults.totalSent + allResults.totalFailed}/${totalEntries})`,
        );

        await this.delay(BULK_EMAIL_DELAY);
      }

      const duration = Date.now() - startTime;
      const avgTimePerEmail =
        totalEntries > 0 ? Math.round(duration / totalEntries) : 0;

      console.log(
        `[${new Date().toISOString()}] [INFO] Bulk email send completed`,
        {
          issueId: request.issue_id,
          totalSent: allResults.totalSent,
          totalFailed: allResults.totalFailed,
          successRate:
            totalEntries > 0
              ? `${Math.round((allResults.totalSent / totalEntries) * 100)}%`
              : "0%",
          duration: `${duration}ms`,
          avgTimePerEmail: `${avgTimePerEmail}ms`,
          failedCount: allResults.failedUserIds.length,
        },
      );

      return allResults;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ERROR] Bulk email send failed`,
        {
          issueId: request.issue_id,
          totalRecipients: request.entries.length,
          error: error instanceof Error ? error.message : String(error),
          duration: `${Date.now() - startTime}ms`,
        },
      );

      return {
        success: false,
        totalSent: 0,
        totalFailed: request.entries.length,
        failedUserIds: request.entries.map((entry) => entry.userId),
      };
    }
  }

  private async sendEmailViaProvider(
    request: EmailSendRequest,
  ): Promise<EmailSendResponse> {
    try {
      const result = await this.provider.sendEmail(request);
      return result;
    } catch (error) {
      console.error("Email service error:", error);

      return {
        status: "failed" as DeliveryStatus,
        error: error instanceof Error ? error.message : "Unknown email error",
        userId: request.userId,
      };
    }
  }

  private async processBatch(
    batch: EmailSendRequest[],
    context: {
      type: "newsletter" | "transactional";
      issueId?: number;
      emailType?: TransactionalEmailType;
      campaignId?: string;
    },
  ): Promise<{
    success: boolean;
    totalSent: number;
    totalFailed: number;
    failedUserIds: string[];
  }> {
    const batchResult = {
      success: true,
      totalSent: 0,
      totalFailed: 0,
      failedUserIds: [] as string[],
    };

    try {
      const userIds = batch.map((entry) => entry.userId);

      // Create pending records based on context type
      if (context.type === "newsletter" && context.issueId) {
        await deliveryRepo.bulkCreatePending(userIds, context.issueId);
      } else if (
        context.type === "transactional" &&
        context.emailType &&
        context.campaignId
      ) {
        await transactionalEmailRepo.bulkCreatePending(
          userIds,
          context.emailType,
          context.campaignId,
        );
      }

      const emailPromises = batch.map((entry) =>
        this.sendEmailViaProvider(entry),
      );

      const emailResults = await Promise.allSettled(emailPromises);

      // Process results and collect delivery updates
      const deliveryUpdates: Array<{
        userId: string;
        status: DeliveryStatus;
        externalId?: string;
        errorMessage?: string;
        sentAt?: Date;
      }> = [];

      emailResults.forEach((promiseResult, index) => {
        const entry = batch[index];
        if (!entry) return;

        if (promiseResult.status === "fulfilled") {
          const result = promiseResult.value;

          // Add to delivery updates
          deliveryUpdates.push({
            userId: result.userId,
            status: result.status,
            externalId: result.messageId,
            errorMessage: result.error,
            sentAt: result.status === "sent" ? new Date() : undefined,
          });

          if (result.status === "sent") {
            batchResult.totalSent++;
          } else {
            batchResult.totalFailed++;
            batchResult.failedUserIds.push(entry.userId);
            console.warn(
              `[${new Date().toISOString()}] [WARN] Email delivery failed`,
              {
                userId: entry.userId,
                email: entry.to,
                error: result.error,
              },
            );
          }
        } else {
          // Promise was rejected
          batchResult.totalFailed++;
          batchResult.failedUserIds.push(entry.userId);
          batchResult.success = false;

          const errorMessage =
            promiseResult.reason instanceof Error
              ? promiseResult.reason.message
              : String(promiseResult.reason);

          // Add failed delivery update
          deliveryUpdates.push({
            userId: entry.userId,
            status: "failed" as DeliveryStatus,
            errorMessage,
          });

          console.error(
            `[${new Date().toISOString()}] [ERROR] Email promise rejected`,
            {
              userId: entry.userId,
              email: entry.to,
              error: errorMessage,
            },
          );
        }
      });

      // Bulk update records with results based on context type
      if (deliveryUpdates.length > 0) {
        try {
          if (context.type === "newsletter" && context.issueId) {
            await deliveryRepo.bulkUpdateStatuses(
              context.issueId,
              deliveryUpdates,
            );
          } else if (
            context.type === "transactional" &&
            context.emailType &&
            context.campaignId
          ) {
            await transactionalEmailRepo.bulkUpdateStatuses(
              context.emailType,
              context.campaignId,
              deliveryUpdates,
            );
          }
          // Removed repetitive delivery update logs - batch completion log covers this
        } catch (updateError) {
          console.error(
            `[${new Date().toISOString()}] [ERROR] Failed to update ${context.type} records`,
            {
              contextType: context.type,
              issueId: context.issueId,
              campaignId: context.campaignId,
              emailType: context.emailType,
              recordCount: deliveryUpdates.length,
              error:
                updateError instanceof Error
                  ? updateError.message
                  : String(updateError),
            },
          );
          // Don't affect the email sending results - just log the update error
        }
      }
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] [ERROR] Entire batch failed`,
        {
          batchSize: batch.length,
          userIds: batch.map((b) => b.userId),
          error: error instanceof Error ? error.message : String(error),
        },
      );
      batchResult.totalFailed += batch.length;
      batchResult.success = false;

      // Add failed userIds for this batch
      batch.forEach((entry) => {
        batchResult.failedUserIds.push(entry.userId);
      });

      // Update record statuses to "failed" for this batch based on context type
      const failedDeliveryUpdates = batch.map((entry) => ({
        userId: entry.userId,
        status: "failed" as DeliveryStatus,
        errorMessage: error instanceof Error ? error.message : String(error),
      }));

      if (failedDeliveryUpdates.length > 0) {
        if (context.type === "newsletter" && context.issueId) {
          await deliveryRepo.bulkUpdateStatuses(
            context.issueId,
            failedDeliveryUpdates,
          );
          console.log(
            `[${new Date().toISOString()}] [INFO] Updated ${failedDeliveryUpdates.length} delivery records to failed status for issue ${context.issueId}`,
          );
        } else if (
          context.type === "transactional" &&
          context.emailType &&
          context.campaignId
        ) {
          await transactionalEmailRepo.bulkUpdateStatuses(
            context.emailType,
            context.campaignId,
            failedDeliveryUpdates,
          );
          console.log(
            `[${new Date().toISOString()}] [INFO] Updated ${failedDeliveryUpdates.length} transactional email records to failed status for campaign ${context.campaignId}`,
          );
        }
      }
    }

    return batchResult;
  }

  private aggregateBatchResults(
    allResults: BulkEmailSendResponse,
    batchResult: {
      success: boolean;
      totalSent: number;
      totalFailed: number;
      failedUserIds: string[];
    },
  ): void {
    allResults.totalSent += batchResult.totalSent;
    allResults.totalFailed += batchResult.totalFailed;
    allResults.failedUserIds.push(...batchResult.failedUserIds);
    if (!batchResult.success) {
      allResults.success = false;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Helper method to add message tag if it doesn't exist
   */
  private addMessageTag(
    request: EmailSendRequest,
    tagName: string,
    tagValue: string,
  ): EmailSendRequest {
    const existingTags = request.tags ?? [];

    // Check if tag with this exact name and value already exists
    const hasExactTag = existingTags.some(
      (tag) => tag.name === tagName && tag.value === tagValue,
    );

    // Add tag if it doesn't already exist with this value
    const finalTags = hasExactTag
      ? existingTags
      : [
          ...existingTags,
          {
            name: tagName,
            value: tagValue,
          },
        ];

    return {
      ...request,
      tags: finalTags,
    };
  }

  /**
   * Helper method to validate message tags
   */
  private validateMessageTags(request: EmailSendRequest): void {
    const tags = request.tags ?? [];

    for (const tag of tags) {
      if (typeof tag.name !== "string" || tag.name.trim() === "") {
        throw new Error(
          `Invalid tag name: ${tag.name}. Must be a non-empty string.`,
        );
      }
      if (typeof tag.value !== "string" || tag.value.trim() === "") {
        throw new Error(
          `Invalid tag value: ${tag.value}. Must be a non-empty string.`,
        );
      }
    }
  }

  /**
   * Helper method to validate transactional email type tags specifically
   */
  private validateTransactionalEmailTypeTags(request: EmailSendRequest): void {
    this.validateMessageTags(request);
    const emailTypeTags = (request.tags ?? []).filter(
      (tag) => tag.name === MESSAGE_TAG_NAMES.EMAIL_TYPE,
    );

    for (const tag of emailTypeTags) {
      const parseResult = TransactionalEmailTypeSchema.safeParse(tag.value);
      if (!parseResult.success) {
        throw new Error(
          `Invalid transactional email type in tags: ${tag.value}. Must be one of: ${TransactionalEmailTypeSchema.options.join(", ")}`,
        );
      }
    }
  }

  /**
   * Helper method to validate transactional email request
   */
  private validateSendTransactionalEmailRequest(
    request: EmailSendRequest,
  ): void {
    //TODO: ADD other validation here
    this.validateTransactionalEmailTypeTags(request);
  }

  /**
   * Helper method to validate newsletter email request
   */
  private validateSendNewsletterEmailRequest(
    request: EmailSendRequest,
    issueId: number,
  ): void {
    // Validate EmailSendRequest structure
    const parseResult = EmailSendRequestSchema.safeParse(request);
    if (!parseResult.success) {
      throw new Error(
        `Invalid email request: ${parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
      );
    }

    // Validate issueId is a positive number
    if (!Number.isInteger(issueId) || issueId <= 0) {
      throw new Error(
        `Invalid issueId: ${issueId}. Must be a positive integer.`,
      );
    }

    // Validate message tags
    this.validateMessageTags(request);
  }
}

// Create singleton instance with AWS SES as default provider
export const emailService = new EmailService(awsSesProvider);
