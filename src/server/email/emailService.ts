import type {
  EmailProvider,
  EmailSendRequest,
  EmailSendResponse,
  BulkEmailSendRequest,
  BulkEmailSendResponse,
} from "./types";
import { awsSesProvider } from "./providers/awsSes";
import { BULK_EMAIL_CONSTANTS } from "./constants/bulkEmailConstants";
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
    try {
      const allResults: BulkEmailSendResponse = {
        success: true,
        totalSent: 0,
        totalFailed: 0,
        failedUserIds: [],
      };

      // Process in batches of 14
      for (
        let i = 0;
        i < request.entries.length;
        i += BULK_EMAIL_CONSTANTS.BATCH_SIZE
      ) {
        const batch = request.entries.slice(
          i,
          i + BULK_EMAIL_CONSTANTS.BATCH_SIZE,
        );

        console.log(
          `Processing batch ${Math.floor(i / BULK_EMAIL_CONSTANTS.BATCH_SIZE) + 1} of ${Math.ceil(request.entries.length / BULK_EMAIL_CONSTANTS.BATCH_SIZE)}`,
        );

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
                allResults.totalSent++;
              } else {
                allResults.totalFailed++;
                allResults.failedUserIds.push(entry.userId);
                console.error(
                  `Failed to send to ${entry.to} (userId: ${entry.userId}):`,
                  result.error,
                );
              }
            } else {
              // Promise was rejected
              allResults.totalFailed++;
              allResults.failedUserIds.push(entry.userId);
              allResults.success = false;

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
          allResults.totalFailed += batch.length;
          allResults.success = false;

          // Add failed userIds for this batch
          batch.forEach((entry) => {
            allResults.failedUserIds.push(entry.userId);
          });

          // Update delivery record statuses to "failed" for this batch
          const failedDeliveryUpdates = batch.map((entry) => ({
            userId: entry.userId,
            status: "failed" as DeliveryStatus,
            errorMessage:
              error instanceof Error ? error.message : String(error),
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

        // Rate limiting delay between batches
        if (i + BULK_EMAIL_CONSTANTS.BATCH_SIZE < request.entries.length) {
          await this.delay(BULK_EMAIL_CONSTANTS.DELAY_BETWEEN_BATCHES);
        }
      }

      // Final summary
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

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  setProvider(provider: EmailProvider) {
    this.provider = provider;
  }
}

// Create singleton instance with AWS SES as default provider
export const emailService = new EmailService(awsSesProvider);
