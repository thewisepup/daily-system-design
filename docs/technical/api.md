# API Architecture

## Overview
The application uses tRPC for end-to-end type-safe API development, providing seamless integration between the Next.js frontend and backend. The API follows REST-like patterns while maintaining full TypeScript type safety from server to client.

## tRPC Architecture

### Core Setup
```
src/server/api/
├── root.ts              # Main router combining all sub-routers
├── trpc.ts             # tRPC configuration and middleware
└── routers/            # Feature-specific routers
    ├── auth.ts         # Authentication endpoints
    ├── topics.ts       # Topic management
    ├── newsletter.ts   # Newsletter operations
    ├── user.ts         # User management
    └── post.ts         # Future blog functionality
```

### tRPC Configuration (`trpc.ts`)
```typescript
import { TRPCError, initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { ZodError } from "zod";
import superjson from "superjson";

import { db } from "~/server/db";
import { verifyToken } from "~/lib/jwt";

// Create context for all requests
export const createTRPCContext = (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  return {
    db,
    req,
    res,
  };
};

// Initialize tRPC
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson, // Preserve Date objects and other complex types
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Base procedures
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Admin authentication middleware
const enforceUserIsAdmin = t.middleware(async ({ ctx, next }) => {
  const authHeader = ctx.req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No authorization token provided",
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: {
        email: payload.email,
        isAdmin: payload.isAdmin,
      },
    },
  });
});

export const adminProcedure = publicProcedure.use(enforceUserIsAdmin);
```

## API Routers

### Authentication Router (`routers/auth.ts`)
**Purpose**: Handle admin authentication with JWT tokens

```typescript
export const authRouter = createTRPCRouter({
  // Login endpoint
  login: publicProcedure
    .input(z.object({
      email: z.string().email("Please enter a valid email address"),
      password: z.string().min(1, "Password is required"),
    }))
    .output(loginResponseSchema)
    .mutation(async ({ input }) => {
      const isValidAdmin = await validateAdminCredentials(input.email, input.password);

      if (!isValidAdmin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const token = generateToken({
        email: input.email,
        isAdmin: true,
      });

      return {
        success: true,
        token,
        user: { email: input.email, isAdmin: true },
        message: "Login successful",
      };
    }),

  // Token verification
  verify: publicProcedure
    .input(z.object({
      token: z.string().min(1, "Token is required"),
    }))
    .output(verifyResponseSchema)
    .query(async ({ input }) => {
      const payload = verifyToken(input.token);

      if (!payload) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired token",
        });
      }

      return {
        valid: true,
        user: {
          email: payload.email,
          isAdmin: payload.isAdmin,
        },
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      };
    }),

  // Logout (client-side token removal)
  logout: publicProcedure
    .output(logoutResponseSchema)
    .mutation(async () => ({
      success: true,
      message: "Logout successful",
    })),
});
```

### Topics Router (`routers/topics.ts`)
**Purpose**: Manage topic generation and retrieval

```typescript
export const topicsRouter = createTRPCRouter({
  // Get all topics (public)
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      return topicRepo.findAll();
    }),

  // Get topics by subject
  getBySubject: publicProcedure
    .input(z.object({
      subjectId: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      return topicRepo.findBySubjectId(input.subjectId);
    }),

  // Generate new topics (admin only)
  generate: adminProcedure
    .input(z.object({
      subjectId: z.number().int().positive(),
      regenerate: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log(`Admin ${ctx.user.email} generating topics for subject ${input.subjectId}`);

      if (input.regenerate) {
        await topicRepo.deleteBySubjectId(input.subjectId);
      }

      const existingTopics = await topicRepo.findBySubjectId(input.subjectId);
      if (existingTopics.length > 0 && !input.regenerate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Topics already exist for this subject. Use regenerate flag to replace.",
        });
      }

      // Generate topics using LLM
      const topics = await generateTopicsForSubject(input.subjectId);
      
      return {
        success: true,
        count: topics.length,
        topics,
      };
    }),

  // Delete all topics (admin only)
  deleteAll: adminProcedure
    .input(z.object({
      subjectId: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log(`Admin ${ctx.user.email} deleting all topics for subject ${input.subjectId}`);

      const deletedCount = await topicRepo.deleteBySubjectId(input.subjectId);
      
      return {
        success: true,
        deletedCount,
      };
    }),
});
```

### Newsletter Router (`routers/newsletter.ts`)
**Purpose**: Handle newsletter generation and delivery

```typescript
export const newsletterRouter = createTRPCRouter({
  // Generate newsletter for a topic (admin only)
  generate: adminProcedure
    .input(z.object({
      topicId: z.number().int().positive(),
      regenerate: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log(`Admin ${ctx.user.email} generating newsletter for topic ${input.topicId}`);

      // Check if newsletter already exists
      const existingIssue = await issueRepo.findByTopicId(input.topicId);
      if (existingIssue && !input.regenerate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Newsletter already exists for this topic. Use regenerate flag to replace.",
        });
      }

      // Get topic details
      const topic = await topicRepo.findById(input.topicId);
      if (!topic) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Topic not found",
        });
      }

      // Generate newsletter content using LLM
      const content = await generateNewsletterContent(topic);

      // Save or update issue
      const issue = existingIssue 
        ? await issueRepo.update(existingIssue.id, {
            content,
            status: 'draft',
            updatedAt: new Date(),
          })
        : await issueRepo.create({
            topicId: input.topicId,
            title: topic.title,
            content,
            status: 'draft',
          });

      return {
        success: true,
        issueId: issue.id,
        content,
      };
    }),

  // Send newsletter to admin for preview (admin only)
  sendToAdmin: adminProcedure
    .input(z.object({
      topicId: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log(`Admin ${ctx.user.email} sending newsletter preview for topic ${input.topicId}`);

      const result = await sendNewsletterToAdmin({ topicId: input.topicId });

      return result;
    }),

  // Get newsletter by topic ID
  getByTopicId: publicProcedure
    .input(z.object({
      topicId: z.number().int().positive(),
    }))
    .query(async ({ input }) => {
      const issue = await issueRepo.findByTopicId(input.topicId);
      
      if (!issue) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Newsletter not found for this topic",
        });
      }

      return issue;
    }),

  // Approve newsletter (admin only)
  approve: adminProcedure
    .input(z.object({
      issueId: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log(`Admin ${ctx.user.email} approving issue ${input.issueId}`);

      const issue = await issueRepo.findById(input.issueId);
      if (!issue) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Issue not found",
        });
      }

      if (issue.status !== 'draft') {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot approve issue with status: ${issue.status}`,
        });
      }

      const updatedIssue = await issueRepo.update(input.issueId, {
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        issue: updatedIssue,
      };
    }),
});
```

### User Router (`routers/user.ts`)
**Purpose**: Manage user accounts and subscriptions

```typescript
export const userRouter = createTRPCRouter({
  // Create user from waitlist signup (public)
  create: publicProcedure
    .input(z.object({
      email: z.string().email("Please enter a valid email address"),
    }))
    .mutation(async ({ input }) => {
      // Check if user already exists
      const existingUser = await userRepo.findByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      const user = await userRepo.create({ email: input.email });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
      };
    }),

  // Get all users (admin only)
  getAll: adminProcedure
    .input(z.object({
      page: z.number().int().positive().default(1),
      limit: z.number().int().positive().max(100).default(50),
    }))
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      
      const users = await userRepo.findMany({
        limit: input.limit,
        offset,
        orderBy: 'createdAt',
        direction: 'desc',
      });

      const totalCount = await userRepo.count();

      return {
        users,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / input.limit),
        },
      };
    }),

  // Get user statistics (admin only)
  getStats: adminProcedure
    .query(async () => {
      const totalUsers = await userRepo.count();
      const todaySignups = await userRepo.countByDateRange({
        from: new Date(new Date().setHours(0, 0, 0, 0)),
        to: new Date(new Date().setHours(23, 59, 59, 999)),
      });
      const weeklySignups = await userRepo.countByDateRange({
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      });

      return {
        totalUsers,
        todaySignups,
        weeklySignups,
      };
    }),

  // Delete user (admin only)
  delete: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log(`Admin ${ctx.user.email} deleting user ${input.userId}`);

      const user = await userRepo.findById(input.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      await userRepo.delete(input.userId);

      return {
        success: true,
        deletedUser: user,
      };
    }),
});
```

## API Client Setup

### Frontend tRPC Client (`trpc/react.tsx`)
```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";

import { type AppRouter } from "~/server/api/root";
import { getAuthToken } from "~/lib/auth";

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }));

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchLink({
          url: "/api/trpc",
          headers() {
            const token = getAuthToken();
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}
```

### Usage in Components
```typescript
// Query example
export function TopicsList() {
  const [topics] = api.topics.getAll.useSuspenseQuery();

  return (
    <div>
      {topics.map((topic) => (
        <div key={topic.id}>{topic.title}</div>
      ))}
    </div>
  );
}

// Mutation example
export function NewsletterGenerator() {
  const utils = api.useUtils();
  
  const generateMutation = api.newsletter.generate.useMutation({
    onSuccess: () => {
      utils.newsletter.getByTopicId.invalidate();
    },
    onError: (error) => {
      console.error('Generation failed:', error.message);
    },
  });

  const handleGenerate = (topicId: number) => {
    generateMutation.mutate({ topicId });
  };

  return (
    <button 
      onClick={() => handleGenerate(topicId)}
      disabled={generateMutation.isLoading}
    >
      {generateMutation.isLoading ? 'Generating...' : 'Generate Newsletter'}
    </button>
  );
}
```

## Error Handling

### Server-Side Error Types
```typescript
// Standardized error responses
export const APIErrorTypes = {
  // Authentication errors
  UNAUTHORIZED: "UNAUTHORIZED",           // 401: Invalid/missing token
  FORBIDDEN: "FORBIDDEN",                // 403: Valid token, insufficient permissions
  
  // Client errors
  BAD_REQUEST: "BAD_REQUEST",           // 400: Invalid input data
  NOT_FOUND: "NOT_FOUND",               // 404: Resource not found
  CONFLICT: "CONFLICT",                  // 409: Resource already exists
  UNPROCESSABLE_CONTENT: "UNPROCESSABLE_CONTENT", // 422: Validation failed
  
  // Server errors
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR", // 500: Server error
  TIMEOUT: "TIMEOUT",                    // 408: Request timeout
} as const;

// Error response structure
interface APIError {
  code: keyof typeof APIErrorTypes;
  message: string;
  data?: {
    zodError?: ZodError; // Validation errors
    details?: string;    // Additional context
  };
}
```

### Client-Side Error Handling
```typescript
// Global error handling
export function useGlobalErrorHandler() {
  return (error: TRPCClientError<AppRouter>) => {
    switch (error.data?.code) {
      case 'UNAUTHORIZED':
        // Redirect to login
        clearAdminAuth();
        window.location.href = '/admin';
        break;
      
      case 'FORBIDDEN':
        // Show access denied
        toast.error('Access denied');
        break;
      
      case 'NOT_FOUND':
        // Show not found message
        toast.error('Resource not found');
        break;
      
      case 'CONFLICT':
        // Show conflict message
        toast.error(error.message);
        break;
      
      default:
        // Generic error
        toast.error('Something went wrong');
        console.error('API Error:', error);
    }
  };
}
```

## API Testing

### Manual Testing with curl
```bash
# 1. Login to get JWT token
curl -X POST http://localhost:3000/api/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"json":{"email":"admin@example.com","password":"password"}}'

# Response: {"result":{"data":{"success":true,"token":"jwt_token_here",...}}}

# 2. Use token for protected endpoints
curl -X GET "http://localhost:3000/api/trpc/topics.getAll" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Generate topics (POST mutation)
curl -X POST "http://localhost:3000/api/trpc/topics.generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"json":{"subjectId":1}}'
```

### Automated Testing
```typescript
// API integration tests
import { createTRPCMsw } from 'msw-trpc';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  createTRPCMsw<AppRouter>().auth.login.mutation((req, res, ctx) => {
    return res(ctx.json({
      success: true,
      token: 'mock_jwt_token',
      user: { email: 'admin@example.com', isAdmin: true },
    }));
  }),
);

test('authentication flow', async () => {
  const result = await api.auth.login.mutate({
    email: 'admin@example.com',
    password: 'password',
  });

  expect(result.success).toBe(true);
  expect(result.token).toBeTruthy();
});
```

## Performance Optimization

### Request Batching
tRPC automatically batches multiple requests into a single HTTP call:

```typescript
// These three calls will be batched into one HTTP request
const [topics, users, stats] = await Promise.all([
  api.topics.getAll.query(),
  api.user.getAll.query(),
  api.user.getStats.query(),
]);
```

### Query Caching
```typescript
// Configure React Query caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      cacheTime: 10 * 60 * 1000,    // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error.data?.code === 'UNAUTHORIZED') return false;
        return failureCount < 3;
      },
    },
  },
});
```

### Optimistic Updates
```typescript
const deleteMutation = api.user.delete.useMutation({
  onMutate: async (deletedUserId) => {
    // Cancel outgoing queries
    await utils.user.getAll.cancel();

    // Snapshot previous value
    const previousUsers = utils.user.getAll.getData();

    // Optimistically update cache
    utils.user.getAll.setData(undefined, (old) => 
      old?.filter(user => user.id !== deletedUserId)
    );

    return { previousUsers };
  },
  onError: (err, deletedUserId, context) => {
    // Rollback on error
    utils.user.getAll.setData(undefined, context?.previousUsers);
  },
  onSettled: () => {
    // Refetch to ensure sync
    utils.user.getAll.invalidate();
  },
});
```

## API Documentation

### Type Safety
All API endpoints are fully type-safe from server to client:

```typescript
// Server defines the shape
const topics = await api.topics.getAll.query();
// Client knows exact TypeScript type of `topics`

// Input validation
const result = await api.newsletter.generate.mutate({
  topicId: 123,        // Type-checked as number
  regenerate: true,    // Type-checked as boolean
  // invalidProp: "x"  // TypeScript error!
});
```

### API Schema Export
```typescript
// Generate OpenAPI schema for external consumers
import { generateOpenApiDocument } from 'trpc-openapi';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Daily System Design API',
  version: '1.0.0',
  baseUrl: 'https://api.dailysystemdesign.com',
});
```