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
import { deliveryStatusEnum, DeliveryStatusSchema } from "./deliveries";

export const transactionalEmailTypeEnum = pgEnum("transactional_email_type", [
  "welcome",
  "marketing",
]);

// Export Zod schemas based on the pgEnum values
export const TransactionalEmailTypeSchema = z.enum(
  transactionalEmailTypeEnum.enumValues,
);
export type TransactionalEmailType = z.infer<
  typeof TransactionalEmailTypeSchema
>;

// Use DeliveryStatus from deliveries schema
export type TransactionalEmailStatus = z.infer<typeof DeliveryStatusSchema>;

// Schema for transactional email updates
export const TransactionalEmailUpdateSchema = z.object({
  status: DeliveryStatusSchema,
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
    campaignId: text(),
    status: deliveryStatusEnum().notNull().default("pending"),
    externalId: text(),
    errorMessage: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    sentAt: timestamp({ withTimezone: true }),
    deliveredAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("transactional_email_user_idx").on(table.userId),
    index("transactional_email_campaign_idx").on(table.campaignId),
    index("transactional_email_external_id_idx").on(table.externalId),
    index("transactional_email_user_type_campaign_idx").on(
      table.userId,
      table.emailType,
      table.campaignId,
    ),
  ],
);
