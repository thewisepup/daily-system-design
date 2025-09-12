import "dotenv/config";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";
import { subscriptions } from "~/server/db/schema/subscriptions";
import { subscriptionsAudit } from "~/server/db/schema/subscriptionsAudit";
import { notExists, eq, count } from "drizzle-orm";

async function verifyUserSubscriptions() {
  console.log("Starting verification of user subscriptions...");

  try {
    // Get total user count
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult?.count ?? 0;

    // Get total subscription count
    const [totalSubscriptionsResult] = await db
      .select({ count: count() })
      .from(subscriptions);
    const totalSubscriptions = totalSubscriptionsResult?.count ?? 0;

    // Get users without subscriptions
    const usersWithoutSubscriptions = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        notExists(
          db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, users.id)),
        ),
      );

    // Get subscription status breakdown
    const subscriptionStatusBreakdown = await db
      .select({
        status: subscriptions.status,
        count: count(),
      })
      .from(subscriptions)
      .groupBy(subscriptions.status);

    // Get audit log count
    const [auditCountResult] = await db
      .select({ count: count() })
      .from(subscriptionsAudit);
    const totalAuditEntries = auditCountResult?.count ?? 0;

    // Print verification results
    console.log("\n=== VERIFICATION RESULTS ===");
    console.log(`Total users: ${totalUsers}`);
    console.log(`Total subscriptions: ${totalSubscriptions}`);
    console.log(
      `Users without subscriptions: ${usersWithoutSubscriptions.length}`,
    );
    console.log(`Total audit entries: ${totalAuditEntries}`);

    console.log("\n=== SUBSCRIPTION STATUS BREAKDOWN ===");
    for (const { status, count } of subscriptionStatusBreakdown) {
      console.log(`${status}: ${count}`);
    }

    if (usersWithoutSubscriptions.length > 0) {
      console.log("\n=== USERS WITHOUT SUBSCRIPTIONS ===");
      console.log("ID | Email | Created At");
      console.log("---|-------|----------");
      for (const user of usersWithoutSubscriptions) {
        console.log(
          `${user.id} | ${user.email} | ${user.createdAt.toISOString()}`,
        );
      }
    }

    // Summary
    console.log("\n=== SUMMARY ===");
    if (usersWithoutSubscriptions.length === 0) {
      console.log("✅ SUCCESS: All users have subscription entries!");
    } else {
      console.log(
        `❌ ISSUE: ${usersWithoutSubscriptions.length} users are missing subscription entries`,
      );
      console.log("Run the migration script to fix this.");
    }

    const migrationAuditEntries = await db
      .select({ count: count() })
      .from(subscriptionsAudit)
      .where(eq(subscriptionsAudit.reason, "system_migration"));

    const migrationCount = migrationAuditEntries[0]?.count ?? 0;
    console.log(`📊 Migration audit entries: ${migrationCount}`);
  } catch (error) {
    console.error("Verification failed:", error);
    throw error;
  }
}

// Run verification
verifyUserSubscriptions()
  .then(() => {
    console.log("\nVerification script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Verification script failed:", error);
    process.exit(1);
  });
