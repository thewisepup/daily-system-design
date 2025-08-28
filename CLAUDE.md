# Daily System Design Newsletter - Claude Code Context

## Project Overview
AI-generated newsletter system for daily system design topics. This is Phase 0 MVP focused on validating the concept with a single subject (System Design) and single admin user.

## Tech Stack
- **Frontend**: Next.js 15 with React 19
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Drizzle ORM (Neon)
- **Authentication**: JWT-based authentication for admin
- **Email**: Postmark/Resend
- **LLM**: OpenAI/Claude for content generation
- **Jobs**: BullMQ with Redis for scheduling
- **Styling**: Tailwind CSS

## Key Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript checks
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Drizzle Studio

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
- `JWT_SECRET` - Secret key for JWT token signing (minimum 32 characters)
- `ADMIN_EMAIL` - Admin user email for authentication
- `ADMIN_PASSWORD` - Admin password for authentication

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
- **Migrations**: Use `pnpm db:push` for development, `db:generate` + `db:migrate` for production

### Repository Pattern for Database Operations
**ALWAYS separate database queries from business logic using repositories:**

- **Database Queries**: Live in `src/server/db/repo/` (e.g., `userRepo.ts`, `postRepo.ts`)
- **Business Logic**: Live in tRPC procedures (`src/server/api/routers/`)
- **Separation of Concerns**: Repos handle data access, tRPC handles validation & business rules
- **Reusability**: Repo methods can be used across multiple tRPC procedures
- **Testing**: Easy to mock repositories for unit testing

### Authentication (JWT-Based Custom Implementation)
**This project uses a custom JWT-based authentication system instead of NextAuth.js for admin access.**

#### Architecture Overview
- **JWT Tokens**: Secure, stateless authentication tokens with 6-hour expiration
- **Admin Only**: Single admin user authentication (MVP Phase 0)
- **Session Storage**: Client-side storage with automatic expiration
- **tRPC Integration**: Middleware-based authentication for API procedures
- **Authorization Headers**: Bearer token authentication pattern

#### Key Components
- `src/lib/jwt.ts` - JWT utilities (sign, verify, validate credentials)
- `src/lib/auth.ts` - Client-side auth utilities (session management)
- `src/server/api/trpc.ts` - JWT middleware for `adminProcedure`
- `src/server/api/routers/auth.ts` - Login/logout/verify procedures
- `src/app/_components/AdminLogin.tsx` - Login form component

#### Environment Setup
```bash
# Required environment variables
JWT_SECRET="your-very-secure-secret-minimum-32-characters"
ADMIN_EMAIL="admin@yourapp.com"
ADMIN_PASSWORD="your-secure-admin-password"
```

#### Authentication Best Practices

##### ✅ **DO - Security Best Practices**
- **Strong JWT Secret**: Use minimum 32 character secret key
- **Token Expiration**: Set reasonable expiration times (6 hours)
- **Secure Storage**: Use sessionStorage (clears on tab close)
- **Header Validation**: Always validate Authorization headers
- **Error Handling**: Provide clear but not revealing error messages
- **Environment Variables**: Store secrets in environment, never in code
- **Type Safety**: Define interfaces for JWT payloads and auth data
- **Middleware**: Use tRPC middleware for consistent auth checks
- **Output Schemas**: Define Zod schemas for API responses

##### ❌ **DON'T - Security Anti-patterns**
- **Don't** store JWT tokens in localStorage (XSS vulnerable)
- **Don't** use weak or short JWT secrets
- **Don't** expose sensitive error details in responses
- **Don't** skip token validation in middleware
- **Don't** hardcode credentials in source code
- **Don't** trust client-side auth checks for server security

#### Usage Examples

##### **Creating Protected tRPC Procedures**
```typescript
export const topicsRouter = createTRPCRouter({
  // Public procedure - no auth required
  hello: publicProcedure.query(() => ({ message: "Hello World" })),
  
  // Protected procedure - requires valid JWT
  adminHello: adminProcedure.query(({ ctx }) => ({
    message: "Hello Admin!", 
    user: ctx.user // Available from JWT middleware
  })),
  
  // Admin mutation with business logic
  generate: adminProcedure.mutation(async ({ ctx }) => {
    // ctx.user contains { email, isAdmin } from verified JWT
    await generateTopics();
    return { success: true };
  }),
});
```

##### **Client-Side Authentication Flow**
```typescript
// Login component with tRPC mutation
const loginMutation = api.auth.login.useMutation({
  onSuccess: (data) => {
    setAdminAuth(data.user.email, data.token); // Store JWT
    onLogin(); // Redirect to admin interface
  },
  onError: (error) => {
    setError(error.message); // Display error
  },
});

// Admin page with authentication guard
const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    setIsAuthenticated(isAdmin()); // Check stored JWT validity
  }, []);
  
  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }
  
  return <AdminInterface />;
};
```

##### **API Testing with curl**
```bash
# 1. Login to get JWT token
curl -X POST http://localhost:3000/api/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"json":{"email":"admin@example.com","password":"password"}}'

# 2. Use token for protected endpoints
curl -X GET "http://localhost:3000/api/trpc/topics.adminHello" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Implementation Notes
- **Migration from Basic Auth**: Replaced username:password encoding with secure JWT tokens
- **Enhanced Security**: Stateless tokens, automatic expiration, proper headers
- **Better UX**: Integrated login form, session persistence, graceful logout
- **Full Type Safety**: TypeScript support for auth data and protected procedures
- **Admin Interface**: Seamless login/logout flow with AdminLogin component

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

### Component Architecture Best Practices
**ALWAYS break up page components into focused sub-components for maintainability:**

- **Page Components**: Should be layout containers focused on authentication, routing, and composition
- **Feature Components**: Extract distinct functionality into self-contained components
- **Single Responsibility**: Each component should handle one specific feature or concern
- **Self-Contained**: Components should manage their own state, API calls, and error handling
- **Reusable**: Design components to be reusable across different pages when possible
- **Nullish Coalescing**: Prefer using nullish coalescing operator (`??`) instead of a logical or (`||`), as it is a safer operator.

#### Component Extraction Pattern
```typescript
// ❌ BAD - Monolithic page component
export default function AdminPage() {
  // Authentication logic
  // Topics generation logic + state + UI
  // Newsletter generation logic + state + UI
  // All error/success states mixed together
  return (
    <div>
      {/* All UI mixed together */}
    </div>
  );
}

// ✅ GOOD - Modular component architecture
export default function AdminPage() {
  // Only authentication and layout logic
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  if (!isAuthenticated) return <AdminLogin onLogin={handleLogin} />;
  
  return (
    <div className="admin-layout">
      <Header onLogout={handleLogout} />
      <TopicsManagement />      {/* Self-contained feature */}
      <NewsletterGenerator />   {/* Self-contained feature */}
      <TopicsViewer />          {/* Self-contained feature */}
      <UserManagement />        {/* Self-contained feature */}
    </div>
  );
}
```

#### Component Structure Guidelines
- **Naming**: Use descriptive names that indicate the component's purpose (e.g., `TopicsManagement`, `NewsletterGenerator`)
- **Location**: Place feature components in `src/app/_components/`
- **State Management**: Each component manages its own local state and API calls
- **Error Handling**: Include error and success states within each component
- **Props**: Minimize props by making components self-sufficient
- **Composition**: Use composition over complex prop drilling

### Code Formatting Standards
**ALWAYS format all code according to Prettier rules configured in the project:**

#### Prettier Configuration
- **Config File**: `prettier.config.js` with Tailwind CSS plugin for class sorting
- **Auto-formatting**: All code must be formatted with Prettier before committing
- **IDE Integration**: Configure your editor to format on save using project's Prettier config
- **Command**: Run `pnpm format` or `npx prettier --write .` to format all files

#### Formatting Rules
- **Consistency**: All TypeScript, JavaScript, JSON, CSS, and Markdown files must follow Prettier formatting
- **Tailwind Classes**: Tailwind CSS classes are automatically sorted using `prettier-plugin-tailwindcss`
- **No Manual Formatting**: Never manually format code - let Prettier handle all spacing, indentation, and line breaks
- **ESLint Integration**: Prettier works alongside ESLint for code quality and formatting

#### Code Examples Format
```typescript
// ✅ CORRECTLY FORMATTED - Prettier + Tailwind plugin applied
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <AdminLogin onLogin={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <Header onLogout={handleLogout} />
      <div className="grid gap-6 md:grid-cols-2">
        <TopicsManagement />
        <NewsletterGenerator />
      </div>
    </div>
  );
}
```
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
- `pnpm dev` - Start dev server with hot reload
- `pnpm build` - Build for production
- `pnpm db:push` - Push schema changes (development)
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - TypeScript type checking

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

## Development Journal
**Track significant work sessions, decisions, and progress for continuity across conversations**

### 2025-08-28 (Admin Dashboard Enhancement)
- **User Management**: Added `UserManagement` component to admin dashboard for managing waitlist and subscribers
- **Layout Enhancement**: Updated admin page layout to include all four core management sections:
  - `TopicsManagement` - Generate and manage syllabus topics
  - `NewsletterGenerator` - Generate and preview newsletter content 
  - `TopicsViewer` - Browse all topics with split-pane interface and newsletter preview
  - `UserManagement` - Manage user signups, subscriptions, and delivery tracking
- **Grid Layout**: Organized main management tools in responsive 2-column grid layout
- **Component Architecture**: Maintained modular component pattern with self-contained feature components

### 2025-08-25 (Newsletter Generator & Topics Viewer Implementation)
- **Newsletter Generation**: Full implementation with `issueRepo`, `generateNewsletter` LLM request (stubbed), and `newsletterRouter` with JWT auth
- **Component Architecture**: Refactored admin UI into modular components - `NewsletterGenerator` and `TopicsManagement` extracted from `AdminPage`
- **Topics Viewer**: Complete split-pane interface for browsing all topics with newsletter preview
  - `TopicsViewer` - Main container with 50/50 split layout
  - `TopicsList` - Left pane showing sequence #, title, and color-coded status badges
  - `NewsletterPreview` - Right pane with markdown content, metadata, and proper error handling

### 2025-08-22 (JWT Authentication Implementation)
- **JWT Authentication System**: Implemented secure JWT-based authentication replacing basic auth
- **Security Enhancement**: Added jsonwebtoken and bcryptjs dependencies for secure token handling
- **Auth Router**: Created comprehensive `authRouter` with login, verify, and logout procedures
- **JWT Utilities**: Built `src/lib/jwt.ts` with token generation, verification, and credential validation
- **Middleware Update**: Enhanced tRPC `adminProcedure` middleware with JWT token validation
- **Client Integration**: Updated `AdminLogin` component to use tRPC auth.login mutation
- **Admin Interface**: Added seamless login/logout flow with session persistence
- **Type Safety**: Added proper TypeScript types and Zod schemas for auth responses
- **Testing Support**: Created test procedure (`topics.hello`) with curl examples for auth testing
- **Documentation**: Comprehensive auth best practices and usage examples in CLAUDE.md

### 2025-08-21
- **Auto-logged**: remove max tokens
- **Memory Strategy Discussion**: Established development journal pattern in CLAUDE.md for maintaining context
- **Changelog Creation**: Created comprehensive changelog.md documenting yesterday's work (2025-08-20)
- **Documentation Enhancement**: Added this development journal section for future session tracking

### 2025-08-20 (Major Development Session)
- **LLM Upgrade**: Upgraded to GPT-5 with increased reasoning effort and higher completion tokens
- **Core Features**: Implemented syllabus generation workflow with OpenAI integration
- **Database Schema**: Created complete database schema (subjects, topics, issues, users, subscriptions, deliveries)
- **Admin System**: Added basic admin authentication to routes and /admin page
- **Architecture**: Established repository pattern and T3 stack best practices
- **Code Quality**: Fixed linting issues, cleaned up components, improved state management
- **Documentation**: Enhanced CLAUDE.md with comprehensive T3 App and Drizzle ORM best practices

### Key Architectural Decisions
- **Repository Pattern**: Separation of database queries from business logic in tRPC procedures
- **T3 Stack**: Following Create T3 App conventions for type-safe full-stack development
- **Drizzle ORM**: Using modern pgTable syntax with snake_case auto-conversion
- **LLM Integration**: OpenAI API for content generation with structured prompts

### Current State
- **Phase**: MVP Phase 0 - Single subject (System Design), single admin user
- **Database**: PostgreSQL with complete schema for newsletter workflow
- **Authentication**: JWT-based secure authentication for admin, waitlist signup for users
- **Security**: Stateless JWT tokens, session management, protected tRPC procedures
- **Content Pipeline**: Syllabus → Topics → Newsletter Issues → Daily Delivery
- **Admin Interface**: Full login/logout flow with AdminLogin component

## PRD Location
Full requirements in `prd/prd_0.md`