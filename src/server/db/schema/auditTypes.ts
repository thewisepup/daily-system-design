import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

// SQL operation types for audit tracking - reusable across different audit tables
export const auditChangeTypeEnum = pgEnum("audit_change_type", [
  "INSERT",
  "UPDATE",
  "DELETE",
]);

// Zod enum for type safety and validation
export const auditChangeTypeSchema = z.enum(auditChangeTypeEnum.enumValues);
export type AuditChangeType = z.infer<typeof auditChangeTypeSchema>;
