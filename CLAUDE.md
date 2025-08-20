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
│   └── db/               # Database client, schema & repositories
│       ├── index.ts      # Database client instance
│       ├── schema/       # Table schemas (users.ts, posts.ts, etc.)
│       └── repo/         # Repository layer (userRepo.ts, postRepo.ts, etc.)
├── env.js                # Environment validation with Zod
└── styles/               # Global CSS & Tailwind
```

### tRPC Best Practices
**ALWAYS follow these T3 stack tRPC patterns from https://create.t3.gg/en/usage/trpc:**

- **Routers**: Organize by feature (e.g., `userRouter`, `postRouter`) using `createTRPCRouter`
- **Procedures**: Use `publicProcedure` for public, `protectedProcedure` for auth-required endpoints
- **Input Validation**: Always use Zod schemas for type-safe input validation and error handling
- **Context**: Include `db` and `session` in tRPC context for all procedures
- **Error Handling**: Use `TRPCError` with proper error codes (`UNAUTHORIZED`, `BAD_REQUEST`, `CONFLICT`, etc.)
- **Data Transformer**: Use `superjson` to preserve TypeScript types across client-server boundary
- **Type Safety**: Export router types with `export type AppRouter = typeof appRouter` for client inference
- **Client Usage**: Leverage React Query hooks (`useQuery`, `useMutation`) with tRPC client
- **Optimistic Updates**: Use for responsive UX in mutations
- **Middleware**: Create reusable middleware for common logic (auth, logging, etc.)

### Database & Drizzle Patterns
- **Schema Location**: `src/server/db/schema/` with separate files per table
- **Repository Pattern**: Database queries in `src/server/db/repo/` directory
- **Client**: Instantiate once in `src/server/db/index.ts`, export globally
- **Context Integration**: Include `db` client in tRPC context
- **Migrations**: Use `npm run db:push` for development, `db:generate` + `db:migrate` for production

### Repository Pattern for Database Operations
**ALWAYS separate database queries from business logic using repositories:**

- **Database Queries**: Live in `src/server/db/repo/` (e.g., `userRepo.ts`, `postRepo.ts`)
- **Business Logic**: Live in tRPC procedures (`src/server/api/routers/`)
- **Separation of Concerns**: Repos handle data access, tRPC handles validation & business rules
- **Reusability**: Repo methods can be used across multiple tRPC procedures
- **Testing**: Easy to mock repositories for unit testing

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

### Repository Pattern Examples
```typescript
// ✅ CORRECT - Repository Layer (src/server/db/repo/userRepo.ts)
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";

export const userRepo = {
  async findById(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  },

  async findByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  },

  async create(data: { email: string }) {
    const [user] = await db.insert(users)
      .values(data)
      .returning();
    return user;
  },

  async updateName(id: string, name: string) {
    const [user] = await db.update(users)
      .set({ name })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async delete(id: string) {
    await db.delete(users).where(eq(users.id, id));
  },
};

// ✅ CORRECT - tRPC Router with Repository Pattern
import { userRepo } from "~/server/db/repo/userRepo";

export const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const user = await userRepo.findById(input.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      return user;
    }),

  create: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      // Business logic: Check if user already exists
      const existingUser = await userRepo.findByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "User already exists" });
      }
      
      // Create user via repository
      return userRepo.create(input);
    }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Business logic: Only allow users to update their own profile
      return userRepo.updateName(ctx.session.user.id, input.name);
    }),
});

// ❌ WRONG - Database queries mixed with business logic
export const userRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      // Don't mix database queries with tRPC procedures
      const existingUser = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });
      
      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT" });
      }
      
      return ctx.db.insert(users).values(input).returning();
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

## Database Schema Declaration Best Practices
**ALWAYS follow these Drizzle ORM patterns from https://orm.drizzle.team/docs/sql-schema-declaration:**

### Schema Organization
- **Single File**: Simple projects can use one `schema.ts` file
- **Multiple Files**: Organize by domain/feature (e.g., `users.ts`, `posts.ts`, `orders.ts`)
- **Exports**: Always export all table definitions for Drizzle Kit migrations
- **Grouping**: Place related tables in the same file for logical organization

### pgTable Declaration Syntax
```typescript
// ✅ CORRECT - Modern pgTable syntax
import { pgTable, index, timestamp, text, uuid } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",                    // Table name
  {                           // Column definitions (object syntax)
    id: uuid().primaryKey().defaultRandom(),
    email: text().notNull().unique(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [               // Table-level constraints (array return)
    index("user_email_idx").on(table.email),
  ]
);
```

### Column Definition Best Practices
- **Import Types**: Import specific column types from `drizzle-orm/pg-core`
- **Types**: Use PostgreSQL-specific types (`uuid()`, `text()`, `timestamp()`, `integer()`)
- **Constraints**: Chain methods like `.notNull()`, `.primaryKey()`, `.unique()`
- **Defaults**: Use `.default()` for static values, `.$default()` for dynamic values
- **References**: Use `.references(() => otherTable.id)` for foreign keys
- **Syntax**: Use object syntax for column definitions, array return for constraints

### Configuration Requirements
- **MUST** set `casing: "snake_case"` in database client or `drizzle.config.ts`
- **MUST** let Drizzle auto-convert camelCase to snake_case (don't specify column names manually)
- **MUST** export all table definitions for migrations

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

### Advanced Schema Patterns
```typescript
import { pgTable, pgEnum, index, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";

// ✅ CORRECT - Enum definitions
export const rolesEnum = pgEnum("roles", ["guest", "user", "admin"]);

// ✅ CORRECT - Complete table with all features
export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    email: text().notNull().unique(),
    role: rolesEnum().default("guest"),
    firstName: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("user_email_idx").on(table.email),
    index("user_role_idx").on(table.role),
    index("user_name_idx").on(table.firstName),
  ]
);

// ✅ CORRECT - With relationships and foreign keys
export const posts = pgTable(
  "posts",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    content: text(),
    authorId: uuid().references(() => users.id).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("post_author_idx").on(table.authorId),
    index("post_title_idx").on(table.title),
  ]
);
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