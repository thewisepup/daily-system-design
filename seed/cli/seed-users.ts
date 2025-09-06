// Load environment variables before importing any modules that depend on them
import "dotenv/config";

import { UserGenerator } from "../generators/UserGenerator";
import {
  getEnvironmentConfig,
  validateEnvironment,
  listEnvironments,
} from "../config/environments";

interface CreateAllUsersOptions {
  environment: string;
  baseEmail?: string;
  count?: number;
  dryRun?: boolean;
}

async function createAllUsers(options: CreateAllUsersOptions) {
  const { environment, baseEmail, count = 10, dryRun = false } = options;

  // Validate environment
  validateEnvironment(environment);
  const config = getEnvironmentConfig(environment);

  // Determine base email (custom or default from environment)
  const finalBaseEmail = baseEmail ?? config.defaultBaseEmail;

  if (!finalBaseEmail) {
    throw new Error(
      `No base email provided and no default email configured for environment: ${environment}`,
    );
  }

  console.log(`🚀 Creating ALL users for ${config.name} environment`);
  console.log(`📧 Base email: ${finalBaseEmail}`);
  console.log(`🔢 Count: ${count}`);
  console.log(`🔍 Dry run: ${dryRun ? "Yes" : "No"}`);
  console.log(`⚠️  Skip existing: No (createAllUsers mode)`);
  console.log("");

  if (dryRun) {
    console.log("🔍 DRY RUN - No users will be created");
    console.log("📧 Would generate these emails:");

    const [localPart, domain] = finalBaseEmail.split("@");

    for (let i = 1; i <= count; i++) {
      const generatedEmail = `${localPart}+${environment}-${i}@${domain}`;
      console.log(`  ${i}. ${generatedEmail}`);
    }

    console.log("\n✅ Dry run completed. No users were created.");
    return;
  }

  // Generate users using createAllUsers (skipExisting: false)
  console.log("👥 Starting user generation (CREATE ALL mode)...");
  const generator = new UserGenerator(environment);
  const result = await generator.generate({
    baseEmail: finalBaseEmail,
    count,
    skipExisting: true,
  });

  // Display results
  console.log("\n📊 Results:");
  console.log(`  ✅ Created: ${result.created}`);
  console.log(`  ⏭️  Skipped: ${result.skipped}`);
  console.log(`  ❌ Failed: ${result.failed}`);

  if (result.users.length > 0) {
    console.log("\n👥 New users created:");
    result.users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`);
    });
  }

  return result;
}

function parseArgs(): CreateAllUsersOptions {
  const args = process.argv.slice(2);
  const options: CreateAllUsersOptions = {
    environment: "dev", // default
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--environment":
      case "-e":
        const envArg = args[++i];
        if (!envArg) {
          throw new Error("--environment requires a value");
        }
        options.environment = envArg;
        break;
      case "--base-email":
      case "-b":
        const emailArg = args[++i];
        if (!emailArg) {
          throw new Error("--base-email requires a value");
        }
        options.baseEmail = emailArg;
        break;
      case "--count":
      case "-c":
        const countStr = args[++i];
        if (!countStr) {
          throw new Error("--count requires a value");
        }
        options.count = parseInt(countStr, 10);
        if (isNaN(options.count) || options.count <= 0) {
          throw new Error("Count must be a positive number");
        }
        break;
      case "--dry-run":
      case "-d":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        showHelp();
        process.exit(0);
        break;
      default:
        // For environment-specific script calls (dev, beta, gamma)
        if (arg && ["dev", "beta", "gamma"].includes(arg)) {
          options.environment = arg as "dev" | "beta" | "gamma";
        } else {
          console.error(`Unknown argument: ${arg}`);
          showHelp();
          process.exit(1);
        }
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
🚀 Create All Users CLI

Creates users in the database using the createAllUsers method (skipExisting: false).
This means it will attempt to create ALL users, even if some already exist.

Usage:
  tsx scripts/create-all-users.ts [options]

Options:
  -e, --environment <env>    Environment (dev|beta|gamma) [default: dev]
  -b, --base-email <email>   Base email address (uses env default if not provided)
  -c, --count <number>       Number of users to create [default: 10]  
  -d, --dry-run             Show what would be created without creating
  -h, --help                Show this help message

Examples:
  tsx scripts/create-all-users.ts --environment dev --count 15
  tsx scripts/create-all-users.ts -e beta -b "test@mycompany.com" -c 25
  tsx scripts/create-all-users.ts --dry-run -e dev -c 5

Available environments:
${listEnvironments()
  .map(
    (env) =>
      `  • ${env.name}: ${env.description} (default: ${env.defaultBaseEmail})`,
  )
  .join("\n")}

💡 Tip: Use --base-email to create users with your own email domain for testing!
`);
}

// Main execution
async function main() {
  try {
    const options = parseArgs();
    await createAllUsers(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`\n❌ Error: ${message}`);
    process.exit(1);
  }

  // Show helpful CLI command for dev environment
  const options = parseArgs();
  if (options.environment === "dev") {
    console.log(
      "\n💡 [Dev Environment Only] Tip: To run this again with a custom email, use:",
    );
    console.log(
      `   tsx seed/cli/seed-users.ts -e dev -b "your-email@yourdomain.com" -c 5`,
    );
  }

  process.exit();
}

// ES module equivalent of require.main === module
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}
