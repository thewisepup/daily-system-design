import { z } from "zod";

// Zod schemas
export const EmailSendRequestSchema = z.object({
  to: z.string().email(),
  from: z.string(),
  subject: z.string(),
  html: z.string(),
  text: z.string().optional(),
});

export const EmailSendResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  error: z.string().optional(),
});

export const SendNewsletterResponseSchema = z.object({
  success: z.boolean(),
  deliveryId: z.string(),
  messageId: z.string().optional(),
});

// TypeScript types derived from schemas
export type EmailSendRequest = z.infer<typeof EmailSendRequestSchema>;
export type EmailSendResponse = z.infer<typeof EmailSendResponseSchema>;
export type SendNewsletterResponse = z.infer<
  typeof SendNewsletterResponseSchema
>;

export interface EmailProvider {
  sendEmail(request: EmailSendRequest): Promise<EmailSendResponse>;
}
