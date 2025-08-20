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

## T3 Stack Development Best Practices
**ALWAYS follow these Create T3 App patterns and conventions:**

### Project Structure (App Router)
```
src/
├── app/                    # Next.js 13+ App Router
│   ├── api/trpc/[trpc]/   # tRPC API handler
│   ├── _components/       # Reusable components  
│   └── page.tsx           # Route pages
├── server/
│   ├── api/               # tRPC routers & procedures
│   │   ├── root.ts       # Main router combining all sub-routers
│   │   ├── trpc.ts       # tRPC config, context, procedures
│   │   └── routers/      # Individual feature routers
│   ├── auth.ts           # NextAuth.js config
│   └── db/               # Database client & schema
├── env.js                # Environment validation with Zod
└── styles/               # Global CSS & Tailwind
```

### tRPC Best Practices
- **Routers**: Organize by feature (e.g., `userRouter`, `postRouter`)
- **Procedures**: Use `publicProcedure` for public, `protectedProcedure` for auth-required
- **Input Validation**: Always use Zod schemas for type-safe input validation
- **Context**: Include `db` and `session` in tRPC context for all procedures
- **Error Handling**: Use `TRPCError` with proper error codes (`UNAUTHORIZED`, `BAD_REQUEST`, etc.)

### Database & Drizzle Patterns
- **Schema Location**: `src/server/db/schema/` with separate files per table
- **Client**: Instantiate once in `src/server/db/index.ts`, export globally
- **Context Integration**: Include `db` client in tRPC context
- **Migrations**: Use `npm run db:push` for development, `db:generate` + `db:migrate` for production

### Authentication (NextAuth.js)
- **Config**: Centralize in `src/server/auth.ts`
- **Session Strategy**: Use JWT for middleware compatibility
- **Module Augmentation**: Extend session types to include `user.id`
- **Protected Procedures**: Create reusable `protectedProcedure` with session validation
- **Server Helpers**: Use `auth()` helper for server-side session access

### Environment Variables
- **Validation**: Use `@t3-oss/env-nextjs` with Zod schemas in `src/env.js`
- **Server Variables**: Define in `server` object (e.g., `DATABASE_URL`)
- **Client Variables**: Define in `client` object with `NEXT_PUBLIC_` prefix
- **Runtime Mapping**: Map to `process.env` in `runtimeEnv` object

### Code Organization
- **Server-Only Code**: Keep in `src/server/` directory
- **Shared Types**: Export router types with `export type AppRouter = typeof appRouter`
- **API Client**: Create tRPC client in `src/trpc/` for frontend usage
- **Components**: Place reusable components in `src/app/_components/`

### Example Patterns
```typescript
// ✅ CORRECT - tRPC Router with proper validation
export const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.users.findFirst({
        where: eq(users.id, input.id),
      });
    }),

  update: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.update(users)
        .set({ name: input.name })
        .where(eq(users.id, ctx.session.user.id));
    }),
});

// ✅ CORRECT - Protected procedure with session validation
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

// ✅ CORRECT - Environment validation
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
```

### Development Commands
- `npm run dev` - Start dev server with hot reload
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes (development)
- `npm run db:studio` - Open Drizzle Studio
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking

### Key Principles
- **Type Safety**: End-to-end type safety from DB to frontend
- **Server Actions**: Use tRPC procedures instead of API routes
- **Validation**: Validate all inputs with Zod schemas
- **Authentication**: Protect sensitive procedures with session checks
- **Error Boundaries**: Handle errors gracefully with proper error codes
- **Performance**: Use ISR over SSR when possible for better performance

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