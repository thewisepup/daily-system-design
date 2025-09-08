import type {
  EmailProvider,
  EmailSendRequest,
  EmailSendResponse,
  BulkEmailSendRequest,
  BulkEmailSendResponse,
  BulkEmailEntry,
} from "./types";
import { awsSesProvider } from "./providers/awsSes";
import {
  AWS_SES_RATE_LIMIT,
  BULK_EMAIL_SIZE,
} from "./constants/bulkEmailConstants";
import { deliveryRepo } from "../db/repo/deliveryRepo";
import type { DeliveryStatus } from "../db/schema/deliveries";

class EmailService {
  private provider: EmailProvider;

  constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  async sendEmail(request: EmailSendRequest): Promise<EmailSendResponse> {
    try {
      //TODO: create delivery status
      return await this.provider.sendEmail(request);
      //TODO: update delivery status
    } catch (error) {
      //TODO: update delivery status to failed if exists
      console.error("Email service error:", error);
      return {
        status: "failed" as DeliveryStatus,
        error: error instanceof Error ? error.message : "Unknown email error",
        userId: request.userId,
      };
    }
  }

  async sendBulkEmail(
    request: BulkEmailSendRequest,
  ): Promise<BulkEmailSendResponse> {
    console.log("Sending Bulk Email...");
    try {
      const allResults: BulkEmailSendResponse = {
        success: true,
        totalSent: 0,
        totalFailed: 0,
        failedUserIds: [],
      };

      for (let i = 0; i < request.entries.length; i += BULK_EMAIL_SIZE) {
        const batch = request.entries.slice(i, i + BULK_EMAIL_SIZE);
        const batchResult = await this.processBatch(batch, request);
        this.aggregateBatchResults(allResults, batchResult);
        await this.delay(AWS_SES_RATE_LIMIT);
      }

      console.log(`\n=== BULK EMAIL SUMMARY ===`);
      console.log(`Total Sent: ${allResults.totalSent}`);
      console.log(`Total Failed: ${allResults.totalFailed}`);
      console.log(`Failed User IDs: [${allResults.failedUserIds.join(", ")}]`);

      return allResults;
    } catch (error) {
      console.error("Bulk email service error:", error);

      return {
        success: false,
        totalSent: 0,
        totalFailed: request.entries.length,
        failedUserIds: request.entries.map((entry) => entry.userId),
      };
    }
  }

  private async processBatch(
    batch: BulkEmailEntry[],
    request: BulkEmailSendRequest,
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
      await deliveryRepo.bulkCreatePending(userIds, request.issue_id);

      const emailPromises = batch.map((entry) =>
        this.provider.sendEmail({
          to: entry.to,
          from: request.from,
          subject: entry.subject,
          html: entry.html,
          text: entry.text,
          headers: entry.headers,
          userId: entry.userId,
          deliveryConfiguration: request.deliveryConfiguration,
          tags: request.defaultTags,
        }),
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
            console.error(
              `Failed to send to ${entry.to} (userId: ${entry.userId}):`,
              result.error,
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
            `Promise rejected for ${entry.to} (userId: ${entry.userId}):`,
            promiseResult.reason,
          );
        }
      });

      // Bulk update delivery records with results
      if (deliveryUpdates.length > 0) {
        try {
          await deliveryRepo.bulkUpdateStatuses(
            request.issue_id,
            deliveryUpdates,
          );
          console.log(
            `Updated ${deliveryUpdates.length} delivery records for issue ${request.issue_id}`,
          );
        } catch (deliveryError) {
          console.error(
            `Failed to update delivery records for issue ${request.issue_id}:`,
            deliveryError,
          );
          // Don't affect the email sending results - just log the delivery update error
        }
      }
    } catch (error) {
      console.error(
        `Batch failed for userIds: ${batch.map((b) => b.userId).join(", ")}`,
        error,
      );
      batchResult.totalFailed += batch.length;
      batchResult.success = false;

      // Add failed userIds for this batch
      batch.forEach((entry) => {
        batchResult.failedUserIds.push(entry.userId);
      });

      // Update delivery record statuses to "failed" for this batch
      const failedDeliveryUpdates = batch.map((entry) => ({
        userId: entry.userId,
        status: "failed" as DeliveryStatus,
        errorMessage: error instanceof Error ? error.message : String(error),
      }));

      if (failedDeliveryUpdates.length > 0) {
        await deliveryRepo.bulkUpdateStatuses(
          request.issue_id,
          failedDeliveryUpdates,
        );
        console.log(
          `Updated ${failedDeliveryUpdates.length} delivery records to failed status for issue ${request.issue_id}`,
        );
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

  setProvider(provider: EmailProvider) {
    this.provider = provider;
  }
}

// Create singleton instance with AWS SES as default provider
export const emailService = new EmailService(awsSesProvider);
