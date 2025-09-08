import { type TransactionalEmailType } from "~/server/db/schema/transactionalEmails";

// Message tag names for AWS SES tracking
export const MESSAGE_TAG_NAMES = {
  EMAIL_TYPE: "email-type",
} as const;

// Email type values using the database schema types
export const EMAIL_TYPE_TAGS = {
  NEWSLETTER: "newsletter",
  WELCOME: "welcome" as TransactionalEmailType,
} as const;

export type EmailTypeTag = typeof EMAIL_TYPE_TAGS[keyof typeof EMAIL_TYPE_TAGS];