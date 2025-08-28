import type { EmailProvider, EmailSendRequest, EmailSendResponse } from "./types";
import { awsSesProvider } from "./providers/awsSes";

class EmailService {
  private provider: EmailProvider;

  constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  async sendEmail(request: EmailSendRequest): Promise<EmailSendResponse> {
    try {
      return await this.provider.sendEmail(request);
    } catch (error) {
      console.error("Email service error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown email error",
      };
    }
  }

  setProvider(provider: EmailProvider) {
    this.provider = provider;
  }
}

// Create singleton instance with AWS SES as default provider
export const emailService = new EmailService(awsSesProvider);