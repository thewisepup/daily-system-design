# Daily System Design Newsletter - Claude Code Context

## Project Overview
AI-generated newsletter system for daily system design topics. This is Phase 0 MVP focused on validating the concept with a single subject (System Design) and single admin user.

## Tech Stack
- **Frontend**: Next.js 15 with React 19
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Drizzle ORM (Neon)
- **Authentication**: Basic Auth for admin
- **Email**: Postmark/Resend
- **LLM**: OpenAI/Claude for content generation
- **Jobs**: BullMQ with Redis for scheduling
- **Styling**: Tailwind CSS

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio

## Project Structure
```
src/
├── app/                    # Next.js app router
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   └── page.tsx           # Landing page with waitlist
├── server/
│   ├── api/               # tRPC routers
│   ├── db/                # Database schema and client
│   ├── jobs/              # BullMQ workers
│   ├── llm/               # LLM integration
│   └── email/             # Email service
└── lib/                   # Shared utilities
```

## Database Schema
Core tables:
- `subjects` - Newsletter subjects (System Design, etc.)
- `topics` - Individual topics within subjects (ordered)
- `issues` - Generated newsletter content
- `users` - Waitlist and subscribers
- `subscriptions` - User subscription to subjects with progress tracking
- `deliveries` - Email delivery logs

## Core Workflows
1. **Syllabus Generation**: Generate 150+ ordered topics for a subject
2. **Newsletter Generation**: Create markdown content for each topic with validation
3. **Daily Delivery**: Cron job (9am PT) to send next newsletter in sequence
4. **Admin Dashboard**: Review, approve, regenerate, and manually send newsletters

## Environment Variables Needed
- `DATABASE_URL` - Postgres connection string
- `REDIS_URL` - Redis for job queue
- `POSTMARK_TOKEN` - Email delivery
- `OPENAI_API_KEY` - Content generation
- `ADMIN_EMAIL` - Admin user email
- `ADMIN_PASSWORD` - Basic auth password

## Development Notes
- Follow T3 stack best practices: https://create.t3.gg/
- Use existing T3 stack patterns (tRPC, Drizzle)
- Keep schema extensible for future subjects
- All newsletters go through validation pipeline
- Admin dashboard uses basic auth for MVP
- Single admin user for Phase 0

## Database Naming Conventions
**ALWAYS follow these Drizzle ORM best practices when creating database schemas:**

### Configuration Requirements
- **MUST** set `casing: "snake_case"` in `drizzle.config.ts`
- **MUST** use callback-style `pgTable("name", (t) => ({ ... }))` syntax (modern API)
- **MUST** let Drizzle auto-convert camelCase to snake_case (don't specify column names manually)

### Column Naming
- **TypeScript/Code**: Use camelCase (e.g., `createdAt`, `userId`, `isActive`)
- **Database**: Auto-converted to snake_case (e.g., `created_at`, `user_id`, `is_active`)
- **Never** manually specify snake_case column names in schema definitions

### Table Naming
- Use singular, lowercase, no underscores for table names (e.g., `users`, `issues`, `subscriptions`)
- Use descriptive compound names when needed (e.g., `newsletterissues`, `emaildeliveries`)
- No prefixes unless using `createTable` helper for multi-tenant setups

### Index Naming
- Format: `{table}_{column(s)}_idx` 
- Examples: `user_email_idx`, `issue_status_idx`, `subscription_user_subject_idx`
- Use descriptive names for complex indexes: `user_email_active_idx`

### Foreign Key & Constraint Naming
- Foreign Keys: `{table}_{referenced_table}_fk` (e.g., `subscription_user_fk`)
- Unique Constraints: `{table}_{column(s)}_unique` (e.g., `user_email_unique`)
- Check Constraints: `{table}_{constraint_desc}_check` (e.g., `user_age_check`)

### Schema Examples
```typescript
// ✅ CORRECT - Modern Drizzle ORM API with auto-conversion
export const users = pgTable("users", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  email: t.text().notNull().unique(),
  createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
  isActive: t.boolean().default(true),
  lastLoginAt: t.timestamp({ withTimezone: true }),
}), (table) => ({
  emailIdx: index("user_email_idx").on(table.email),
  activeUsersIdx: index("user_active_created_idx").on(table.isActive, table.createdAt),
}));

// ✅ CORRECT - With relationships and constraints
export const subscriptions = pgTable("subscriptions", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  userId: t.uuid().notNull().references(() => users.id),
  subjectId: t.uuid().notNull().references(() => subjects.id),
  currentOrd: t.integer().notNull().default(0),
  createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
}), (table) => ({
  userSubjectUnique: unique("subscription_user_subject_unique").on(table.userId, table.subjectId),
  userIdIdx: index("subscription_user_idx").on(table.userId),
}));

// ❌ WRONG - Manual column naming (deprecated API)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ❌ WRONG - Object-style table config (deprecated)
export const users = pgTable("users", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  email: t.text().notNull().unique(),
}), (table) => ({
  emailIdx: index("user_email_idx").on(table.email), // Should return array []
}));
```

### Required Config
```typescript
// drizzle.config.ts
export default {
  schema: "./src/server/db/schema",
  dialect: "postgresql",
  dbCredentials: { url: env.DATABASE_URL },
  casing: "snake_case", // ← REQUIRED for auto-conversion
} satisfies Config;
```

## PRD Location
Full requirements in `prd/prd_0.md`