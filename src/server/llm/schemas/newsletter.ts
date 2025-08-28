import { z } from "zod";

// Zod schema for newsletter content validation
export const NewsletterResponseSchema = z.object({
  content: z
    .string()
    .min(1000, "Newsletter content must be at least 1000 characters")
    .max(15000, "Newsletter content must be less than 15000 characters")
    .refine(
      (content) => !content.includes("TODO") && !content.includes("TBD"),
      "Newsletter content must not contain placeholder text like TODO or TBD",
    )
    .refine(
      (content) => content.includes("Introduction") || content.includes("# "),
      "Newsletter content must include proper section headers",
    ),
});

// For simpler use cases where we just need the content string
export const NewsletterContentSchema = z
  .string()
  .min(1000, "Newsletter content must be at least 1000 characters")
  .max(15000, "Newsletter content must be less than 15000 characters")
  .refine(
    (content) => !content.includes("TODO") && !content.includes("TBD"),
    "Newsletter content must not contain placeholder text like TODO or TBD",
  );

// TypeScript types inferred from schemas
export type NewsletterResponse = z.infer<typeof NewsletterResponseSchema>;
export type NewsletterContent = z.infer<typeof NewsletterContentSchema>;
