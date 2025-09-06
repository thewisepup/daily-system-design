import { z } from "zod";
import { DeliveryStatusSchema } from "~/server/db/schema/deliveries";

// Zod schemas
export const EmailSendRequestSchema = z.object({
  to: z.string().email(),
  from: z.string(),
  subject: z.string(),
  html: z.string(),
  text: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  userId: z.string(),
});

export const EmailSendResponseSchema = z.object({
  status: DeliveryStatusSchema,
  messageId: z.string().optional(),
  error: z.string().optional(),
  userId: z.string(),
});

export const SendNewsletterResponseSchema = z.object({
  success: z.boolean(),
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
  issue_id: z.number(),
});

// Provider-level response (without userId - just raw results)
export const ProviderBulkEmailResultSchema = z.object({
  status: DeliveryStatusSchema, // Maps AWS SES status to delivery status
  messageId: z.string().optional(),
  error: z.string().optional(), // Format: "<Status>: <Error>"
});

export const ProviderBulkEmailResponseSchema = z.object({
  success: z.boolean(),
  results: z.array(ProviderBulkEmailResultSchema),
});

// Service-level response (just stats, no individual results)
export const BulkEmailSendResponseSchema = z.object({
  success: z.boolean(),
  totalSent: z.number(),
  totalFailed: z.number(),
  failedUserIds: z.array(z.string()),
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
export type ProviderBulkEmailResult = z.infer<
  typeof ProviderBulkEmailResultSchema
>;
export type ProviderBulkEmailResponse = z.infer<
  typeof ProviderBulkEmailResponseSchema
>;

export interface EmailProvider {
  sendEmail(request: EmailSendRequest): Promise<EmailSendResponse>;
}
