import { z } from "zod";

// TODO: Dive deeper into validation - add word count, content quality, and structure validation

// Zod schema for FAQ items
const FAQItemSchema = z.object({
  q: z.string(),
  a: z.string(),
});

// Zod schema for newsletter section with headline and content
const NewsletterSectionSchema = z.object({
  headline: z.string(),
  content: z.string(),
});

// Zod schema for FAQ section
const FAQSectionSchema = z.object({
  headline: z.string(),
  items: z.array(FAQItemSchema),
});

// Zod schema for key takeaways section
const KeyTakeawaysSectionSchema = z.object({
  headline: z.string(),
  bullets: z.array(z.string()),
});

// Zod schema for structured newsletter response matching newsletterPrompt JSON schema
export const NewsletterResponseSchema = z.object({
  introduction: NewsletterSectionSchema,
  overview: NewsletterSectionSchema,
  concept: NewsletterSectionSchema,
  tradeoffs: NewsletterSectionSchema,
  applications: NewsletterSectionSchema,
  example: NewsletterSectionSchema,
  commonPitfalls: NewsletterSectionSchema,
  faq: FAQSectionSchema,
  keyTakeaways: KeyTakeawaysSectionSchema,
});

// Legacy schema for backwards compatibility
export const NewsletterContentSchema = z.string();

// TypeScript types inferred from schemas
export type NewsletterResponse = z.infer<typeof NewsletterResponseSchema>;
export type NewsletterContent = z.infer<typeof NewsletterContentSchema>;
export type FAQItem = z.infer<typeof FAQItemSchema>;
