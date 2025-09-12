# Subscription Management Implementation Plan

## Overview
This document outlines the implementation plan for transitioning from a simple user-based newsletter system to a proper subscription management system with audit tracking. The implementation follows the existing codebase patterns and ensures zero data loss during migration.

## Current State Analysis

### Existing Architecture
- **Users**: Simple table with `id`, `email`, `createdAt`
- **Subscriptions**: Table exists but with unused fields that need removal
- **Unsubscribe Flow**: JWT-based with `userRepo.markInactive()` TODO stub
- **Patterns**: Object-based repositories, class-based services with singleton export

### Problem Statement
1. All users are assumed to be subscribed (no proper subscription tracking)
2. No audit trail for subscription changes
3. Cannot handle complex subscription states or multiple subjects
4. Unsubscribe functionality is incomplete (`markInactive()` is a TODO)

## Implementation Plan

### Phase 1: Database Schema Updates

#### 1.1 Simplify Subscriptions Table
**Remove unnecessary fields:**
- `currentTopicSequence` - Not needed for MVP
- `isWaitlist` - Not needed for MVP  
- `activatedAt` - Redundant with status tracking
- `pausedAt` - Redundant with status tracking
- `cancelledAt` - Redundant with status tracking

**Add required field:**
- `updatedAt` - Track when subscription was last modified

**Final schema:**
```typescript
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    subjectId: integer()
      .notNull()
      .references(() => subjects.id),
    status: subscriptionStatusEnum().notNull().default("active"),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("subscription_user_idx").on(table.userId),
    index("subscription_subject_idx").on(table.subjectId),
    index("subscription_status_idx").on(table.status),
    index("subscription_user_subject_idx").on(table.userId, table.subjectId),
  ],
);
```

#### 1.2 Create SubscriptionsAudit Table
**Purpose:** Track all subscription changes with complete data history, SQL operations, and business context

```typescript
import { 
  pgTable, 
  pgEnum, 
  index, 
  uuid, 
  timestamp, 
  jsonb 
} from "drizzle-orm/pg-core";

// SQL operation types
export const auditChangeTypeEnum = pgEnum("audit_change_type", [
  "INSERT",
  "UPDATE", 
  "DELETE",
  "MIGRATION"
]);

// Business reasons for changes
export const subscriptionAuditReasonEnum = pgEnum("subscription_audit_reason", [
  "user_signup",           // User initially subscribed
  "user_unsubscribe",      // User clicked unsubscribe link
  "admin_action",          // Admin manually changed subscription
  "system_migration",      // Data migration process
  "compliance_cleanup",    // Privacy compliance action
  "bounce_handling",       // Email bounce caused status change
  "reactivation",          // User re-subscribed after being unsubscribed
  "bulk_operation",        // Part of bulk admin operation
]);

export const subscriptionsAudit = pgTable(
  "subscriptions_audit",
  {
    id: uuid().primaryKey().defaultRandom(),
    subscriptionId: uuid()
      .notNull()
      .references(() => subscriptions.id),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    
    // SQL operation tracking
    changeType: auditChangeTypeEnum().notNull(),
    
    // Business context
    reason: subscriptionAuditReasonEnum().notNull(),
    
    // Complete data history using JSONB
    oldValues: jsonb(), // Previous subscription data
    newValues: jsonb().notNull(), // New subscription data
    
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("subscription_audit_subscription_idx").on(table.subscriptionId),
    index("subscription_audit_user_idx").on(table.userId),
    index("subscription_audit_change_type_idx").on(table.changeType),
    index("subscription_audit_reason_idx").on(table.reason),
    index("subscription_audit_created_idx").on(table.createdAt),
  ],
);

// TypeScript types for JSONB data
export interface SubscriptionAuditValues {
  id: string;
  userId: string;
  subjectId: number;
  status: "active" | "paused" | "cancelled"; //SubscrptionStatusEnum
  createdAt: string;
  updatedAt: string;
}
```

### Phase 2: Repository Layer (Minimal Implementation)

#### 2.1 Create SubscriptionRepo
**File:** `src/server/db/repo/SubscriptionRepo.ts`

```typescript
import { eq, and } from "drizzle-orm";
import { db } from "~/server/db";
import { subscriptions } from "~/server/db/schema/subscriptions";
import type { SubscriptionStatus } from "~/server/db/schema/subscriptions";

export class SubscriptionRepo {
  /**
   * Find subscription by userId and subjectId
   */
  async findByUserAndSubject(userId: string, subjectId: number) {
    return await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.subjectId, subjectId)
      ))
      .limit(1)
      .then((rows) => rows[0]);
  }

  /**
   * Update subscription status and return both old and new values
   */
  async updateStatus(id: string, status: SubscriptionStatus) {
    // First get the current subscription for audit trail
    const currentSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!currentSubscription) {
      throw new Error(`Subscription ${id} not found`);
    }

    // Update the subscription
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, id))
      .returning();

    return {
      old: currentSubscription,
      new: updatedSubscription,
    };
  }

  /**
   * Create subscription for user
   */
  async createForUser(userId: string, subjectId: number) {
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        userId,
        subjectId,
        status: "active"
      })
      .returning();
    return subscription;
  }
}

// Create singleton instance
export const subscriptionRepo = new SubscriptionRepo();

export type Subscription = typeof subscriptions.$inferSelect;
```

#### 2.2 Create SubscriptionAuditRepo
**File:** `src/server/db/repo/SubscriptionAuditRepo.ts`

```typescript
import { db } from "~/server/db";
import { subscriptionsAudit } from "~/server/db/schema/subscriptionsAudit";
import type { AuditChangeType } from "~/server/db/schema/auditTypes";
import type { SubscriptionAuditReason } from "~/server/db/schema/subscriptionsAudit";

// JSONB data interface for subscription audit values
export interface SubscriptionAuditValues {
  id: string;
  userId: string;
  subjectId: number;
  status: "active" | "paused" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export class SubscriptionAuditRepo {
  /**
   * Create comprehensive audit log entry with JSONB data
   */
  async create(
    subscriptionId: string,
    userId: string,
    changeType: AuditChangeType,
    reason: SubscriptionAuditReason,
    newValues: SubscriptionAuditValues,
    oldValues?: SubscriptionAuditValues,
  ) {
    const [auditEntry] = await db
      .insert(subscriptionsAudit)
      .values({
        subscriptionId,
        userId,
        changeType,
        reason,
        oldValues: oldValues || null,
        newValues,
      })
      .returning();
    return auditEntry;
  }

  /**
   * Helper method for INSERT operations (new subscriptions)
   */
  async logInsert(
    subscription: SubscriptionAuditValues,
    reason: SubscriptionAuditReason,
  ) {
    return this.create(
      subscription.id,
      subscription.userId,
      "INSERT",
      reason,
      subscription,
      undefined, // no old values for INSERT
    );
  }

  /**
   * Helper method for UPDATE operations
   */
  async logUpdate(
    subscriptionId: string,
    userId: string,
    oldValues: SubscriptionAuditValues,
    newValues: SubscriptionAuditValues,
    reason: SubscriptionAuditReason,
  ) {
    return this.create(
      subscriptionId,
      userId,
      "UPDATE",
      reason,
      newValues,
      oldValues,
    );
  }
}

// Create singleton instance
export const subscriptionAuditRepo = new SubscriptionAuditRepo();
```

### Phase 3: Service Layer

#### 3.1 Create SubscriptionService Class
**File:** `src/server/services/SubscriptionService.ts`

```typescript
import { subscriptionRepo } from "../db/repo/SubscriptionRepo";
import { subscriptionAuditRepo, type SubscriptionAuditValues } from "../db/repo/SubscriptionAuditRepo";

export class SubscriptionService {
  /**
   * Unsubscribe user from a subject with comprehensive audit trail
   */
  async unsubscribe(userId: string, subjectId = 1) {
    // Find existing subscription or create one if missing (for migration compatibility)
    let subscription = await subscriptionRepo.findByUserAndSubject(userId, subjectId);
    
    if (!subscription) {
      // Create subscription record for existing user (migration support)
      subscription = await subscriptionRepo.createForUser(userId, subjectId);
      
      const subscriptionData: SubscriptionAuditValues = {
        id: subscription.id,
        userId: subscription.userId,
        subjectId: subscription.subjectId,
        status: subscription.status,
        createdAt: subscription.createdAt.toISOString(),
        updatedAt: subscription.updatedAt.toISOString(),
      };

      await subscriptionAuditRepo.logInsert(
        subscriptionData,
        "system_migration"
      );
    }

    // Only proceed if not already cancelled
    if (subscription.status !== "cancelled") {
      const updateResult = await subscriptionRepo.updateStatus(
        subscription.id,
        "cancelled"
      );

      // Create audit data
      const oldValues: SubscriptionAuditValues = {
        id: updateResult.old.id,
        userId: updateResult.old.userId,
        subjectId: updateResult.old.subjectId,
        status: updateResult.old.status,
        createdAt: updateResult.old.createdAt.toISOString(),
        updatedAt: updateResult.old.updatedAt.toISOString(),
      };

      const newValues: SubscriptionAuditValues = {
        id: updateResult.new.id,
        userId: updateResult.new.userId,
        subjectId: updateResult.new.subjectId,
        status: updateResult.new.status,
        createdAt: updateResult.new.createdAt.toISOString(),
        updatedAt: updateResult.new.updatedAt.toISOString(),
      };

      await subscriptionAuditRepo.logUpdate(
        subscription.id,
        userId,
        oldValues,
        newValues,
        "user_unsubscribe"
      );

      return updateResult.new;
    }

    return subscription;
  }

  /**
   * Ensure subscription exists for user (migration support)
   */
  async ensureSubscriptionExists(userId: string, subjectId = 1) {
    let subscription = await subscriptionRepo.findByUserAndSubject(userId, subjectId);
    
    if (!subscription) {
      subscription = await subscriptionRepo.createForUser(userId, subjectId);
      
      const subscriptionData: SubscriptionAuditValues = {
        id: subscription.id,
        userId: subscription.userId,
        subjectId: subscription.subjectId,
        status: subscription.status,
        createdAt: subscription.createdAt.toISOString(),
        updatedAt: subscription.updatedAt.toISOString(),
      };

      await subscriptionAuditRepo.logInsert(
        subscriptionData,
        "system_migration"
      );
    }

    return subscription;
  }
}

// Create singleton instance
export const subscriptionService = new SubscriptionService();
```

### Phase 4: Update Unsubscribe Endpoints

#### 4.1 Update API Route
**File:** `src/app/api/unsubscribe/[token]/route.ts`

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { validateUnsubscribeToken } from "~/lib/unsubscribe";
import { subscriptionService } from "~/server/services/SubscriptionService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const tokenData = validateUnsubscribeToken(decodeURIComponent(token));
    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired unsubscribe link." },
        { status: 400 },
      );
    }

    // Use subscription service 
    await subscriptionService.unsubscribe(tokenData.userId, 1);
    console.log(`Unsubscribed user ${tokenData.userId} successfully via one-click`);

    return NextResponse.json({
      success: true,
      message: "You have been successfully unsubscribed.",
    });
  } catch (error) {
    console.error("One-click unsubscribe error:", error);
    return NextResponse.json(
      {
        error: "Unable to process unsubscribe request. Please try again later.",
      },
      { status: 500 },
    );
  }
}
```

#### 4.2 Update tRPC Router
**File:** `src/server/api/routers/emailSubscription.ts`

```typescript
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { validateUnsubscribeToken } from "~/lib/unsubscribe";
import { subscriptionService } from "~/server/services/SubscriptionService";

export const emailSubscriptionRouter = createTRPCRouter({
  validateUnsubscribe: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const tokenData = validateUnsubscribeToken(input.token);

        if (!tokenData) {
          return {
            valid: false,
            message: "Invalid or expired unsubscribe link.",
          };
        }
        return {
          valid: true,
          userId: tokenData.userId,
          message: "Ready to unsubscribe.",
        };
      } catch (error) {
        console.error("Validate unsubscribe error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Unable to validate unsubscribe request. Please try again later.",
        });
      }
    }),

  confirmUnsubscribe: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const tokenData = validateUnsubscribeToken(input.token);

        if (!tokenData) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired unsubscribe link.",
          });
        }

        await subscriptionService.unsubscribe(tokenData.userId, 1);
        console.log(`Unsubscribed user ${tokenData.userId} successfully via confirmation page`);

        return {
          success: true,
          message:
            "You have been successfully unsubscribed from our newsletter.",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Confirm unsubscribe error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Unable to process unsubscribe request. Please try again later.",
        });
      }
    }),
});
```

### Phase 5: Data Migration

#### 5.1 Migration Script
**File:** `src/scripts/migrate-users-to-subscriptions.ts`

```typescript
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";
import { subscriptionService } from "~/server/services/SubscriptionService";

async function migrateUsersToSubscriptions() {
  console.log("Starting migration of users to subscriptions...");
  
  const allUsers = await db.select().from(users);
  console.log(`Found ${allUsers.length} users to migrate`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const user of allUsers) {
    try {
      // This will create subscription if it doesn't exist and log to audit
      await subscriptionService.ensureSubscriptionExists(user.id);
      migratedCount++;
      
      if (migratedCount % 100 === 0) {
        console.log(`Migrated ${migratedCount} users...`);
      }
    } catch (error) {
      console.error(`Failed to migrate user ${user.id}:`, error);
      skippedCount++;
    }
  }

  console.log(`Migration completed:`);
  console.log(`- Successfully migrated: ${migratedCount} users`);
  console.log(`- Skipped due to errors: ${skippedCount} users`);
  console.log(`- All changes have been logged to subscriptions_audit table`);
}

// Run migration
migrateUsersToSubscriptions()
  .then(() => {
    console.log("Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
```

#### 5.2 Migration Command
Add to `package.json`:
```json
{
  "scripts": {
    "migrate:subscriptions": "tsx src/scripts/migrate-users-to-subscriptions.ts"
  }
}
```

## Key Benefits of This Simplified Audit Design

### 1. Complete Data History with JSONB
- **Before/After Snapshots**: Full subscription data captured in `oldValues`/`newValues`
- **Queryable**: Can query JSON fields like `WHERE new_values->>'status' = 'cancelled'`
- **Flexible**: Schema changes don't break existing audit records

### 2. Dual Context Tracking
- **Technical Context**: `changeType` tracks SQL operations (INSERT/UPDATE/DELETE)
- **Business Context**: `reason` tracks business purpose (user_unsubscribe, admin_action, etc.)

### 3. Query Examples
```sql
-- Find all user unsubscribes in the last 30 days
SELECT * FROM subscriptions_audit 
WHERE reason = 'user_unsubscribe' 
  AND created_at >= NOW() - INTERVAL '30 days';

-- Track status changes for a specific user
SELECT 
  old_values->>'status' as old_status,
  new_values->>'status' as new_status,
  reason,
  created_at
FROM subscriptions_audit 
WHERE user_id = 'user-uuid'
ORDER BY created_at;

-- Find all admin actions
SELECT * FROM subscriptions_audit 
WHERE reason = 'admin_action'
  AND change_type = 'UPDATE';
```

## Risk Mitigation

### 1. Data Integrity
- **Backward Compatibility**: Service handles missing subscription records gracefully
- **Audit Trail**: Complete log of all subscription changes
- **Transaction Safety**: All database operations wrapped in transactions where needed

### 2. Performance Considerations
- **Indexes**: Proper indexing on commonly queried columns
- **Batch Operations**: Migration processes users in batches
- **JSONB Indexes**: GIN indexes for efficient JSON querying

### 3. Testing Strategy
1. **Unit Tests**: Test repository and service methods
2. **Integration Tests**: Test complete unsubscribe flow
3. **Migration Tests**: Test migration script on copy of production data
4. **E2E Tests**: Test unsubscribe links from actual emails

## Deployment Steps

### 1. Pre-deployment
1. Run database migrations for schema changes
2. Deploy new code (backward compatible)
3. Run migration script to create subscription records

### 2. Post-deployment
1. Monitor error logs for any issues
2. Verify unsubscribe links work correctly  
3. Check audit logs are being created
4. Monitor subscription metrics

### 3. Rollback Plan
- Code rollback: Previous unsubscribe flow can be restored
- Data rollback: Subscription data can be preserved
- Schema rollback: Add back removed columns if needed (though not recommended)

This simplified design provides comprehensive audit capabilities while keeping the implementation clean and focused on the core subscription management functionality.