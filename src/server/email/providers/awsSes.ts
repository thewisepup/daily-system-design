import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { env } from "~/env";
import type {
  EmailProvider,
  EmailSendRequest,
  EmailSendResponse,
} from "../types";

class AwsSesProvider implements EmailProvider {
  private sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: env.AWS_REGION as string,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }

  async sendEmail(request: EmailSendRequest): Promise<EmailSendResponse> {
    try {
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
      });

      const response = await this.sesClient.send(command);

      return {
        success: true,
        messageId: response.MessageId,
      };
    } catch (error) {
      console.error("AWS SES error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "AWS SES send failed",
      };
    }
  }
}

export const awsSesProvider = new AwsSesProvider();
