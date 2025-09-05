import { z } from "zod";

// Zod schemas
export const EmailSendRequestSchema = z.object({
  to: z.string().email(),
  from: z.string(),
  subject: z.string(),
  html: z.string(),
  text: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
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

// Bulk email schemas
export const BulkEmailEntrySchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  text: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  userId: z.string(), // For tracking purposes
});

export const BulkEmailSendRequestSchema = z.object({
  entries: z.array(BulkEmailEntrySchema),
  from: z.string(),
});

export const BulkEmailSendResponseSchema = z.object({
  success: z.boolean(),
  totalSent: z.number(),
  totalFailed: z.number(),
  failedUserIds: z.array(z.string()),
  results: z.array(z.object({
    userId: z.string(),
    success: z.boolean(),
    messageId: z.string().optional(),
    error: z.string().optional(),
  })),
});

// TypeScript types derived from schemas
export type EmailSendRequest = z.infer<typeof EmailSendRequestSchema>;
export type EmailSendResponse = z.infer<typeof EmailSendResponseSchema>;
export type SendNewsletterResponse = z.infer<
  typeof SendNewsletterResponseSchema
>;
export type BulkEmailEntry = z.infer<typeof BulkEmailEntrySchema>;
export type BulkEmailSendRequest = z.infer<typeof BulkEmailSendRequestSchema>;
export type BulkEmailSendResponse = z.infer<typeof BulkEmailSendResponseSchema>;

export interface EmailProvider {
  sendEmail(request: EmailSendRequest): Promise<EmailSendResponse>;
  sendBulkEmail?(request: BulkEmailSendRequest): Promise<BulkEmailSendResponse>;
}
