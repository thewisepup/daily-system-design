import {
  pgTable,
  pgEnum,
  index,
  timestamp,
  text,
  uuid,
  integer,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { issues } from "./issues";
import { users } from "./users";

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",
  "sent",
  "delivered",
  "failed",
  "bounced",
]);

export const DeliveryStatusSchema = z.enum(deliveryStatusEnum.enumValues);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

// Schema for delivery updates
export const DeliveryUpdateSchema = z.object({
  status: DeliveryStatusSchema,
  externalId: z.string().optional(),
  errorMessage: z.string().optional(),
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
});

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid().primaryKey().defaultRandom(),
    issueId: integer()
      .notNull()
      .references(() => issues.id),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    status: deliveryStatusEnum().notNull().default("pending"),
    externalId: text(),
    errorMessage: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    sentAt: timestamp({ withTimezone: true }),
    deliveredAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("delivery_issue_idx").on(table.issueId),
    index("delivery_user_idx").on(table.userId),
    index("delivery_status_idx").on(table.status),
    index("delivery_created_idx").on(table.createdAt),
    index("delivery_external_id_idx").on(table.externalId),
    index("delivery_user_issue_idx").on(table.userId, table.issueId),
  ],
);
