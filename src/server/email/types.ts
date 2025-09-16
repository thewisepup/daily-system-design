import { z } from "zod";
import { DeliveryStatusSchema } from "~/server/db/schema/deliveries";

// Message tag for AWS SES tracking
export const MessageTagSchema = z.object({
  name: z
    .string()
    .max(256)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Tag name must only contain alphanumeric characters, underscores, and dashes",
    ),
  value: z
    .string()
    .max(256)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Tag value must only contain alphanumeric characters, underscores, and dashes",
    ),
});

export type MessageTag = z.infer<typeof MessageTagSchema>;

// Zod schemas
export const EmailSendRequestSchema = z.object({
  to: z.string().email(),
  from: z.string(),
  subject: z.string(),
  html: z.string(),
  text: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  userId: z.string(),
  deliveryConfiguration: z.string().optional(),
  tags: z.array(MessageTagSchema).optional(),
});

export const EmailSendResponseSchema = z.object({
  status: DeliveryStatusSchema,
  messageId: z.string().optional(),
  error: z.string().optional(),
  userId: z.string(),
});

export const SendNewsletterToAdminResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
});

export const SendNewsletterRequestSchema = z.object({
  entries: z.array(EmailSendRequestSchema),
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
export type SendNewsletterToAdminResponse = z.infer<
  typeof SendNewsletterToAdminResponseSchema
>;
export type SendNewsletterRequest = z.infer<typeof SendNewsletterRequestSchema>;
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
