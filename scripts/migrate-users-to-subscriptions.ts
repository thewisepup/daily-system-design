import "dotenv/config";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";
import { subscriptions } from "~/server/db/schema/subscriptions";
import { subscriptionsAudit } from "~/server/db/schema/subscriptionsAudit";
import { notExists, eq } from "drizzle-orm";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

const BATCH_SIZE = 50;

async function migrateUsersToSubscriptions() {
  console.log("Starting migration of users to subscriptions...");

  // Get users who don't have subscription entries
  const usersWithoutSubscriptions = await db
    .select()
    .from(users)
    .where(
      notExists(
        db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, users.id)),
      ),
    );

  console.log(
    `Found ${usersWithoutSubscriptions.length} users without subscriptions to migrate`,
  );

  if (usersWithoutSubscriptions.length === 0) {
    console.log("No users to migrate. Exiting...");
    return;
  }

  let totalMigrated = 0;
  let totalFailed = 0;

  // Process in batches of 50
  for (let i = 0; i < usersWithoutSubscriptions.length; i += BATCH_SIZE) {
    const batch = usersWithoutSubscriptions.slice(i, i + BATCH_SIZE);
    console.log(
      `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: users ${i + 1}-${Math.min(i + BATCH_SIZE, usersWithoutSubscriptions.length)}`,
    );

    try {
      // Bulk create subscription entries
      const subscriptionData = batch.map((user) => ({
        userId: user.id,
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
        status: "active" as const,
      }));

      const createdSubscriptions = await db
        .insert(subscriptions)
        .values(subscriptionData)
        .returning();

      console.log(
        `  ✓ Created ${createdSubscriptions.length} subscription entries`,
      );

      // Bulk create audit entries
      const auditData = createdSubscriptions.map((subscription) => ({
        subscriptionId: subscription.id,
        userId: subscription.userId,
        changeType: "INSERT" as const,
        reason: "system_migration" as const,
        oldValues: null,
        newValues: {
          id: subscription.id,
          userId: subscription.userId,
          subjectId: subscription.subjectId,
          status: subscription.status,
          createdAt: subscription.createdAt.toISOString(),
          updatedAt: subscription.updatedAt.toISOString(),
        },
      }));

      await db.insert(subscriptionsAudit).values(auditData);

      console.log(`  ✓ Created ${auditData.length} audit entries`);

      totalMigrated += createdSubscriptions.length;
    } catch (error) {
      console.error(`  ✗ Failed to process batch:`, error);
      totalFailed += batch.length;
    }
  }

  console.log(`\nMigration completed:`);
  console.log(`- Successfully migrated: ${totalMigrated} users`);
  console.log(`- Failed to migrate: ${totalFailed} users`);
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
