import { z } from "zod";

// TODO: Dive deeper into validation - add word count, content quality, and structure validation

// Zod schema for newsletter section with headline and content
const NewsletterSectionSchema = z.object({
  headline: z.string(),
  content: z.string(),
});

// Zod schema for key takeaways section
const KeyTakeawaysSectionSchema = z.object({
  headline: z.string(),
  bullets: z.array(z.string()),
  closingSentence: z.string(),
});

// Zod schema for structured newsletter response matching newsletterPrompt JSON schema
export const NewsletterResponseSchema = z.object({
  introduction: NewsletterSectionSchema,
  concept: NewsletterSectionSchema,
  tradeoffs: NewsletterSectionSchema,
  applications: NewsletterSectionSchema,
  example: NewsletterSectionSchema,
  commonPitfalls: NewsletterSectionSchema,
  keyTakeaways: KeyTakeawaysSectionSchema,
});

// Legacy schema for backwards compatibility
export const NewsletterContentSchema = z.string();

// Zod schema for advertisement object
export const AdvertisementSchema = z.object({
  title: z.string(),
  content: z.string(),
  imageUrl: z.string().url(),
  campaignId: z.string(),
  issueId: z.number().int().positive(),
});

// TypeScript types inferred from schemas
export type NewsletterResponse = z.infer<typeof NewsletterResponseSchema>;
export type NewsletterContent = z.infer<typeof NewsletterContentSchema>;
export type Advertisement = z.infer<typeof AdvertisementSchema>;
