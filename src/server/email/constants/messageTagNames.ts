import { TransactionalEmailType } from "../types";

// Message tag names for AWS SES tracking
export const MESSAGE_TAG_NAMES = {
  EMAIL_TYPE: "email-type",
} as const;

// Email type values using the TransactionalEmailType enum
export const EMAIL_TYPE_TAGS = {
  NEWSLETTER: "newsletter",
  WELCOME: TransactionalEmailType.WELCOME,
} as const;

export type EmailTypeTag = typeof EMAIL_TYPE_TAGS[keyof typeof EMAIL_TYPE_TAGS];