# Daily System Design Newsletter

A Next.js application for AI-generated system design lessons, subscriber email delivery, a public newsletter archive, and an admin dashboard. The database supports multiple subjects; the scheduled delivery route currently targets System Design (`subjectId = 1`).

## How the newsletter works

1. **Generate topics.** Admins generate ordered topic batches (10 by default). `TopicService` passes existing titles and the next sequence number to Claude Sonnet 4.5 through OpenRouter, then stores the structured topic data.
2. **Generate an issue.** `NewsletterService` uses Claude Opus 4.5 through OpenRouter with high reasoning effort. It validates structured JSON with Zod, renders HTML, and saves a draft. Content includes an introduction, concept, tradeoffs, applications, example, pitfalls, and key takeaways; it is not stored as Markdown.
3. **Select and prepare today's issue.** `getTodaysNewsletter` uses the subject's shared `newsletter_sequence` to find a topic. A missing topic stops delivery; it does not generate more topics. `AutoNewsletterService` generates and approves a missing issue, approves an existing draft with content, or deletes and regenerates a failed/generating issue. An already-sent issue is rejected. Human approval is therefore not required by the scheduled send path.
4. **Hand off to SES.** The sender paginates users with active subscriptions and sends the same current issue in batches through AWS SES, with personalized unsubscribe and feedback links. It records delivery and send results, advances the subject sequence, and marks the issue sent after batch processing, even when individual recipients failed. A successful run or `sent` status does not prove inbox delivery; inspect failure counts and SES events. Auto-generation/approval triggers an admin notification after the send.

The sequence is shared by subject, not an individual catch-up sequence for each subscriber. Recipient selection currently checks active subscriptions without filtering by the subject passed to the sender.

### Scheduling and admin actions

[`vercel.json`](vercel.json) schedules `GET /api/cron/send-daily-newsletter` at `0 11 * * *`: **11:00 UTC daily** (03:00 PST / 04:00 PDT). It requires `Authorization: Bearer <CRON_SECRET>`.

`/api/cron/daily-newsletter-admin` also exists but is not scheduled in `vercel.json`. It prepares the current issue, sends to the admin, and advances the shared subject sequence, so it is not a side-effect-free preview. The admin dashboard separately supports generating, approving/unapproving, deleting/regenerating, previewing, and sending issues. Generation, approval, rendering, and SES delivery are distinct steps; saving a draft alone does not send it.

## Tech stack

- Next.js 15, React 19, Tailwind CSS, and tRPC
- PostgreSQL (Neon serverless driver) and Drizzle ORM
- JWT-based admin authentication; Upstash Redis for rate limiting
- OpenRouter SDK and Claude for active content generation
- AWS SES for email; SNS bounce handling and Terraform-managed AWS resources
- Vitest unit tests; GitHub Actions installs with pnpm and runs `test:unit`

## Local setup

Use Node.js 20 (the CI version), pnpm 10.15.0 (pinned in `package.json`), and a development PostgreSQL database. AI, email, and rate-limited flows also need their respective service credentials.

```bash
git clone https://github.com/thewisepup/daily-system-design.git
cd daily-system-design
pnpm install --frozen-lockfile
```

Create `.env` using [`src/env.js`](src/env.js) as the authoritative schema:

| Purpose     | Variables                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Database    | `DATABASE_URL`                                                                                                                         |
| AI          | `OPEN_ROUTER_API_KEY`, `OPENAI_API_KEY` (currently validated even though the active client uses OpenRouter)                            |
| Admin       | `JWT_SECRET` (32+ characters), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (8+ characters)                                                         |
| Cron        | `CRON_SECRET` (16+ characters)                                                                                                         |
| AWS         | `AWS_REGION` (defaults to `us-west-2`), `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`                                                   |
| Email       | `TO_ADMIN_EMAIL`, `AWS_SES_FROM_EMAIL`, `AWS_SES_CONFIGURATION_SET`, `AWS_SES_TRANSACTIONAL_CONFIG_SET`, `SNS_SES_BOUNCES_TOPIC_ARN`   |
| Redis       | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`                                                                                   |
| Application | `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`), `NODE_ENV` (defaults to `development`), `VERCEL_ENV` (defaults to `development`) |

Migrate the development database, then start the app:

```bash
pnpm db:migrate
pnpm dev
```

Migrations create the schema; subject/topic data must also exist before generating or sending issues. Visit `/` for signup, `/newsletter` for the public archive, and `/admin` for administration. Use development services and test recipients when exercising email flows.

## Database

Schemas are in [`src/server/db/schema`](src/server/db/schema), with SQL migrations in [`drizzle`](drizzle). Core tables include `subjects`, `topics`, `issues`, `users`, `subscriptions`, `subscriptions_audit`, `newsletter_sequence`, `deliveries`, `newsletter_send_results`, `transactional_emails`, `feedback`, and `company`.

```bash
pnpm db:generate  # Generate migrations from schema changes
pnpm db:migrate   # Apply migrations to DATABASE_URL
pnpm db:push      # Push schema directly (development)
pnpm db:studio    # Open Drizzle Studio
```

## Development and verification

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm check           # Lint and TypeScript checks
pnpm test:unit       # Same test scope as CI; exits after running
pnpm test:run        # All configured tests; may need additional integration setup
pnpm format:check
pnpm build           # Runs database migrations BEFORE next build
pnpm start
```

`pnpm test` starts watch mode. `pnpm build` mutates the configured database through `drizzle-kit migrate`; use an appropriate development database. For a build without migrations, run `pnpm exec next build` directly. See [`TESTING_SETUP_GUIDE.md`](TESTING_SETUP_GUIDE.md) for additional testing context; package scripts and the CI workflow define the executable commands.

## Infrastructure

Terraform lives in the root [`infra`](infra) directory. It manages S3, SES identities/configuration sets, SNS bounce notifications, IAM permissions, and email analytics resources. The AWS provider uses `region` and `aws_profile`; configuration requires an `env` matching the selected Terraform workspace.

```bash
cd infra
terraform init
terraform workspace new dev  # Or select an existing workspace
terraform plan -var-file=/path/to/dev.tfvars
```

Supply your own variable file matching [`infra/variables.tf`](infra/variables.tf); environment `.tfvars` files are not checked in. Review a plan before applying it. Application scheduling is configured separately in `vercel.json`.

## Project structure

```text
src/
├── app/                  # Public pages, admin dashboard, API/cron/webhook routes
├── server/
│   ├── api/              # tRPC routers and authentication middleware
│   ├── db/               # Drizzle schemas and repositories
│   ├── services/         # Topic, issue, subscriber, and generation workflows
│   ├── llm/              # OpenRouter client, prompts, and response schemas
│   ├── newsletter/       # Sequence selection and batch delivery orchestration
│   └── email/            # SES provider, templates, and transactional messages
├── lib/                  # Shared utilities
└── env.js                # Validated environment configuration
infra/                    # Terraform
drizzle/                  # SQL migrations
tests/                    # Vitest suites and fixtures
```
