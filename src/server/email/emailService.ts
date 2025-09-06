import type {
  EmailProvider,
  EmailSendRequest,
  EmailSendResponse,
  BulkEmailSendRequest,
  BulkEmailSendResponse,
} from "./types";
import { awsSesProvider } from "./providers/awsSes";
import { BULK_EMAIL_CONSTANTS } from "./constants/bulkEmailConstants";
import { deliveryRepo } from "~/server/db/repo/deliveryRepo";

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
      console.error("Email service error:", error);
      return {
        status: "failed",
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
          // TODO: Create delivery records for this batch (status: "pending")

          // Create individual promises for each email send
          const emailPromises = batch.map((entry) => 
            this.provider.sendEmail({
              to: entry.to,
              from: request.from,
              subject: entry.subject,
              html: entry.html,
              text: entry.text,
              headers: entry.headers,
              userId: entry.userId,
            })
          );

          const emailResults = await Promise.allSettled(emailPromises);

          // Process results and collect delivery updates
          const deliveryUpdates: Array<{
            userId: string;
            messageId?: string;
            status: string;
            errorMessage?: string;
          }> = [];

          emailResults.forEach((promiseResult, index) => {
            const entry = batch[index];
            if (!entry) return;

            if (promiseResult.status === "fulfilled") {
              const result = promiseResult.value;
              
              // Add to delivery updates
              deliveryUpdates.push({
                userId: result.userId,
                messageId: result.messageId,
                status: result.status,
                errorMessage: result.error,
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
              
              const errorMessage = promiseResult.reason instanceof Error 
                ? promiseResult.reason.message 
                : String(promiseResult.reason);
              
              // Add failed delivery update
              deliveryUpdates.push({
                userId: entry.userId,
                status: "failed",
                errorMessage,
              });
              
              console.error(
                `Promise rejected for ${entry.to} (userId: ${entry.userId}):`,
                promiseResult.reason,
              );
            }
          });

          // TODO: Use deliveryUpdates to batch update delivery records
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

          // TODO: Update delivery record statuses to "failed" for this batch
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
