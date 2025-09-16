import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
} from "@aws-sdk/client-ses";
import { env } from "~/env";
import type {
  EmailProvider,
  EmailSendRequest,
  EmailSendResponse,
} from "../types";
import type { DeliveryStatus } from "~/server/db/schema/deliveries";

class AwsSesProvider implements EmailProvider {
  private sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async sendEmail(request: EmailSendRequest): Promise<EmailSendResponse> {
    try {
      // If headers are present, use SendRawEmailCommand for custom headers
      if (request.headers && Object.keys(request.headers).length > 0) {
        return this.sendRawEmail(request);
      }

      // Otherwise use the simpler SendEmailCommand
      const command = new SendEmailCommand({
        Source: request.from,
        Destination: {
          ToAddresses: [request.to],
        },
        Message: {
          Subject: {
            Data: request.subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: request.html,
              Charset: "UTF-8",
            },
            Text: request.text
              ? {
                  Data: request.text,
                  Charset: "UTF-8",
                }
              : undefined,
          },
        },
        ConfigurationSetName: request.deliveryConfiguration,
        Tags: request.tags?.map((tag) => ({
          Name: tag.name,
          Value: tag.value,
        })),
      });
      console.log(command);
      console.log(
        request.tags?.map((tag) => ({
          Name: tag.name,
          Value: tag.value,
        })),
      );
      const response = await this.sesClient.send(command);
      //TODO: IMPORTANT, we need to update status based on response status from send
      return {
        status: "sent" as DeliveryStatus,
        messageId: response.MessageId,
        userId: request.userId,
      };
    } catch (error) {
      console.error("AWS SES error:", error);
      return {
        status: "failed" as DeliveryStatus,
        error: error instanceof Error ? error.message : "AWS SES send failed",
        userId: request.userId,
      };
    }
  }

  private async sendRawEmail(
    request: EmailSendRequest,
  ): Promise<EmailSendResponse> {
    // Build raw email with custom headers
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    let rawEmail = `From: ${request.from}\r\n`;
    rawEmail += `To: ${request.to}\r\n`;
    rawEmail += `Subject: ${request.subject}\r\n`;

    // Add custom headers
    if (request.headers) {
      for (const [key, value] of Object.entries(request.headers)) {
        rawEmail += `${key}: ${value}\r\n`;
      }
    }

    rawEmail += `MIME-Version: 1.0\r\n`;
    rawEmail += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;

    // Add text part if present
    if (request.text) {
      rawEmail += `--${boundary}\r\n`;
      rawEmail += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
      rawEmail += `${request.text}\r\n\r\n`;
    }

    // Add HTML part
    rawEmail += `--${boundary}\r\n`;
    rawEmail += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
    rawEmail += `${request.html}\r\n\r\n`;
    rawEmail += `--${boundary}--\r\n`;

    const command = new SendRawEmailCommand({
      Source: request.from,
      Destinations: [request.to],
      RawMessage: {
        Data: Buffer.from(rawEmail),
      },
      ConfigurationSetName: request.deliveryConfiguration,
      Tags: request.tags?.map((tag) => ({
        Name: tag.name,
        Value: tag.value,
      })),
    });
    console.log(command);
    console.log(
      request.tags?.map((tag) => ({
        Name: tag.name,
        Value: tag.value,
      })),
    );
    const response = await this.sesClient.send(command);

    return {
      status: "sent" as DeliveryStatus,
      messageId: response.MessageId,
      userId: request.userId,
    };
  }
}

export const awsSesProvider = new AwsSesProvider();
