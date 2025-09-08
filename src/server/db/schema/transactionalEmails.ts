import {
  pgTable,
  pgEnum,
  index,
  timestamp,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { users } from "./users";

export const transactionalEmailTypeEnum = pgEnum("transactional_email_type", [
  "welcome",
]);

export const transactionalEmailStatusEnum = pgEnum("transactional_email_status", [
  "pending",
  "sent",
  "delivered",
  "failed",
  "bounced",
]);

// Export Zod schemas based on the pgEnum values
export const TransactionalEmailTypeSchema = z.enum(transactionalEmailTypeEnum.enumValues);
export type TransactionalEmailType = z.infer<typeof TransactionalEmailTypeSchema>;

export const TransactionalEmailStatusSchema = z.enum(transactionalEmailStatusEnum.enumValues);
export type TransactionalEmailStatus = z.infer<typeof TransactionalEmailStatusSchema>;

// Schema for transactional email updates
export const TransactionalEmailUpdateSchema = z.object({
  status: TransactionalEmailStatusSchema,
  externalId: z.string().optional(),
  errorMessage: z.string().optional(),
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
});

export const transactionalEmails = pgTable(
  "transactional_emails",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    emailType: transactionalEmailTypeEnum().notNull(),
    status: transactionalEmailStatusEnum().notNull().default("pending"),
    externalId: text(),
    errorMessage: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    sentAt: timestamp({ withTimezone: true }),
    deliveredAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("transactional_email_user_idx").on(table.userId),
    index("transactional_email_type_idx").on(table.emailType),
    index("transactional_email_external_id_idx").on(table.externalId),
    index("transactional_email_user_type_idx").on(table.userId, table.emailType),
  ],
);