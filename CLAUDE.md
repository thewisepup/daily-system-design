# Daily System Design Newsletter - Claude Code Context

## Project Overview
AI-generated newsletter system for daily system design topics. Phase 0 MVP focused on validating the concept with a single subject (System Design) and single admin user.

## Tech Stack
- **Frontend**: Next.js 15 with React 19
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Drizzle ORM (Neon)
- **Authentication**: JWT-based authentication for admin
- **Email**: AWS SES (Postmark/Resend as fallback)
- **LLM**: OpenAI/Claude for content generation
- **Jobs**: BullMQ with Redis for scheduling
- **Styling**: Tailwind CSS

## Architecture Principles

### T3 Stack Best Practices
- **ALWAYS** follow Create T3 App patterns and conventions
- **ALWAYS** use tRPC procedures instead of API routes for business logic
- **ALWAYS** separate database queries from business logic using repository pattern
- **ALWAYS** validate inputs with Zod schemas
- **ALWAYS** use proper TypeScript types throughout

### Component Architecture
- **ALWAYS** break up page components into focused sub-components
- **ALWAYS** make components self-contained with their own state and error handling
- **ALWAYS** use descriptive component names indicating purpose
- **ALWAYS** place reusable components in `src/app/_components/`
- **ALWAYS** prefer nullish coalescing (`??`) over logical or (`||`)

### Database & Drizzle Patterns
- **ALWAYS** use modern pgTable syntax with object column definitions
- **ALWAYS** set `casing: "snake_case"` in drizzle.config.ts
- **ALWAYS** use camelCase in TypeScript, let Drizzle auto-convert to snake_case
- **ALWAYS** place database queries in `src/server/db/repo/` directory
- **ALWAYS** export all table definitions for migrations

### Authentication (JWT-Based)
- **ALWAYS** use JWT tokens for admin authentication (not NextAuth.js)
- **ALWAYS** validate JWT tokens in tRPC middleware
- **ALWAYS** use sessionStorage for client-side token storage
- **ALWAYS** include proper error handling for auth failures
- **ALWAYS** use `adminProcedure` for protected endpoints

## Code Organization

### File Structure
```
src/
├── app/                    # Next.js app router
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes (cron jobs only)
│   ├── _components/       # Reusable components
│   └── page.tsx           # Landing page with waitlist
├── server/
│   ├── api/               # tRPC routers & procedures
│   │   ├── root.ts       # Main router combining all sub-routers
│   │   ├── trpc.ts       # tRPC config, context, procedures
│   │   └── routers/      # Individual feature routers
│   ├── db/                # Database client, schema & repositories
│   │   ├── index.ts      # Database client instance
│   │   ├── schema/       # Table schemas (users.ts, posts.ts, etc.)
│   │   └── repo/         # Repository layer (userRepo.ts, postRepo.ts, etc.)
│   ├── email/             # Email service
│   ├── llm/               # LLM integration
│   └── newsletter/        # Newsletter generation logic
├── lib/                   # Shared utilities
└── styles/               # Global CSS & Tailwind
```

### Repository Pattern
- **ALWAYS** separate database queries from business logic
- **ALWAYS** place database queries in `src/server/db/repo/` files
- **ALWAYS** place business logic in tRPC procedures
- **ALWAYS** make repository methods reusable across procedures

### tRPC Best Practices
- **ALWAYS** use `createTRPCRouter` for organizing procedures
- **ALWAYS** use `publicProcedure` for public, `adminProcedure` for auth-required endpoints
- **ALWAYS** use Zod schemas for input validation
- **ALWAYS** use `TRPCError` with proper error codes
- **ALWAYS** include `db` and `user` in tRPC context
- **ALWAYS** export router types with `export type AppRouter = typeof appRouter`

## Code Formatting

### Prettier Configuration
- **ALWAYS** format code according to Prettier rules in `prettier.config.js`
- **ALWAYS** use Tailwind CSS class sorting via prettier-plugin-tailwindcss
- **ALWAYS** run `pnpm format` before committing
- **NEVER** manually format code - let Prettier handle all formatting

### Code Style
- **ALWAYS** use TypeScript strict mode
- **ALWAYS** use proper error handling with try/catch
- **ALWAYS** use descriptive variable and function names
- **ALWAYS** add JSDoc comments for complex functions
- **ALWAYS** use const assertions where appropriate

## Security Best Practices

### JWT Authentication
- **ALWAYS** use minimum 32 character JWT secret
- **ALWAYS** set reasonable token expiration (6 hours)
- **ALWAYS** validate Authorization headers
- **ALWAYS** use sessionStorage (not localStorage) for token storage
- **NEVER** expose sensitive error details in responses
- **NEVER** skip token validation in middleware

### Environment Variables
- **ALWAYS** validate environment variables with Zod schemas in `src/env.js`
- **ALWAYS** use `server` object for server-only variables
- **ALWAYS** use `client` object with `NEXT_PUBLIC_` prefix for client variables
- **NEVER** hardcode secrets in source code

### Email & Unsubscribe Best Practices
- **ALWAYS** add `ses:no-track` to unsubscribe links to prevent SES from tampering with redirects
- **ALWAYS** use only `userId` in unsubscribe tokens (never include email to avoid exposure)
- **ALWAYS** generate separate URLs for one-click (List-Unsubscribe header) vs two-step (footer) unsubscribe flows
- **ALWAYS** use JWT tokens with reasonable expiration (90 days) for unsubscribe links
- **ALWAYS** validate unsubscribe tokens server-side before processing
- **NEVER** expose user email addresses in unsubscribe confirmation UI
- **NEVER** include sensitive user data in JWT payloads that could be decoded client-side

## Database Schema Best Practices

### Table Definitions
- **ALWAYS** use modern pgTable syntax with object column definitions
- **ALWAYS** use PostgreSQL-specific types (uuid, text, timestamp, integer)
- **ALWAYS** chain constraint methods (.notNull(), .primaryKey(), .unique())
- **ALWAYS** use .default() for static values, .$default() for dynamic values
- **ALWAYS** use .references(() => otherTable.id) for foreign keys

### Naming Conventions
- **Table Names**: Singular, lowercase, no underscores (users, issues, subscriptions)
- **Column Names**: camelCase in TypeScript (createdAt, userId, isActive)
- **Index Names**: {table}_{column(s)}_idx (user_email_idx, issue_status_idx)
- **Foreign Keys**: {table}_{referenced_table}_fk (subscription_user_fk)

## Component Guidelines

### Component Structure
```typescript
// ✅ GOOD - Modular component architecture
export default function AdminPage() {
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

### Component Rules
- **ALWAYS** make components self-contained with their own state
- **ALWAYS** include error and success states within components
- **ALWAYS** minimize props by making components self-sufficient
- **ALWAYS** use composition over complex prop drilling
- **ALWAYS** handle loading states gracefully

## API Design

### tRPC Procedures
```typescript
// ✅ CORRECT - Repository pattern with tRPC
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

  create: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const existingUser = await userRepo.findByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "User already exists" });
      }
      return userRepo.create(input);
    }),
});
```

### Error Handling
- **ALWAYS** use appropriate TRPCError codes (UNAUTHORIZED, BAD_REQUEST, CONFLICT, NOT_FOUND)
- **ALWAYS** provide clear, user-friendly error messages
- **ALWAYS** log detailed errors server-side for debugging
- **NEVER** expose sensitive information in error messages

## Infrastructure (Terraform)

### Architecture Overview
- **Single Root Config + Environment Variables**: One `main.tf` with reusable modules and environment-specific `.tfvars` files
- **Workspace Isolation**: Separate Terraform workspaces for each environment with isolated state files
- **Module Reusability**: Reusable modules for common resources (S3 buckets, Redis, etc.)
- **Environment-Specific Profiles**: AWS CLI profiles following `daily-system-design-{ENV}` pattern

### Project Structure
```
src/infra/
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Variable definitions
├── provider.tf                # AWS provider configuration
├── outputs.tf                 # Root-level outputs (ALWAYS define here)
├── dev.tfvars                 # Development environment variables
├── prod.tfvars                # Production environment variables
└── modules/
    ├── s3-bucket/             # Reusable S3 bucket module
    │   ├── main.tf           # S3 bucket resource definition
    │   ├── variables.tf      # Module input variables
    │   └── outputs.tf        # Module outputs (bucket name, ARN)
    └── redis/                 # Reusable Redis module
        ├── main.tf           # Upstash Redis resource definition
        ├── variables.tf      # Module input variables
        └── outputs.tf        # Module outputs (URL, token, endpoint)
```

### Environment Configuration
| Environment | AWS Profile                    | Region      | Bucket Name                          |
|-------------|--------------------------------|-------------|--------------------------------------|
| Dev         | `daily-system-design-dev`      | `us-west-2` | `daily-system-design-bucket-dev`     |
| Prod        | `daily-system-design-prod`     | `us-west-2` | `daily-system-design-bucket-prod`    |

### Deployment Policy
- **NEVER** run `terraform apply` or any deployment commands automatically
- **NEVER** use `-auto-approve` flag under any circumstances
- **ALWAYS** run `terraform plan` first to show changes
- **ALWAYS** ask user to review plan output before deployment
- **ALWAYS** let user manually execute apply commands
- **ALWAYS** use workspace validation to prevent cross-environment deployments

### Prerequisites Setup
```bash
# Install Terraform
brew install terraform

# Configure AWS profiles for each environment
aws configure --profile daily-system-design-dev
aws configure --profile daily-system-design-prod

# Verify profile setup
aws sts get-caller-identity --profile daily-system-design-dev
aws sts get-caller-identity --profile daily-system-design-prod
```

### Initial Setup (First Time Only)
```bash
cd src/infra
terraform init
terraform workspace new dev
terraform workspace new prod
terraform workspace list
```

### Development Environment Commands
```bash
cd src/infra
terraform workspace select dev
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

### Production Environment Commands
```bash
cd src/infra
terraform workspace select prod
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

### Workspace Validation
- **Hard Error Protection**: Workspace must match environment in `.tfvars` file
- **Prevents Accidents**: Impossible to apply dev changes to prod state or vice versa
- **Clear Instructions**: Error messages tell you exactly which workspace to switch to

### Best Practices
- **Always Plan Before Apply**: Never run `terraform apply` without first running `terraform plan`
- **Environment Isolation**: Separate AWS accounts/profiles, workspaces, and variable files
- **Module Reusability**: Write once, use everywhere with different configurations
- **State File Management**: Isolated per workspace, consider remote backends for production
- **Output Management**: ALWAYS define outputs at root level in `outputs.tf`
- **Variable Management**: Environment-specific values in `.tfvars` files, never commit sensitive values

### Adding New Resources
1. Create new module in `src/infra/modules/`
2. Update `main.tf` to include the new module
3. Add required variables to `variables.tf` and environment `.tfvars` files
4. Run `terraform plan` and `terraform apply` for each environment

### Security Considerations
- Use separate AWS accounts for each environment
- Apply least privilege principle to IAM roles/policies
- Enable CloudTrail for audit logging
- Use AWS Config for compliance monitoring
- Consider Terraform Cloud or AWS Systems Manager Parameter Store for sensitive variables

## Development Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript checks
- `pnpm format` - Format code with Prettier
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Drizzle Studio

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
