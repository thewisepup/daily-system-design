# Vitest Testing Implementation Guide

This document provides a complete guide to implementing a robust testing setup using Vitest. Use this as a reference to replicate the testing infrastructure in similar projects.

---

## Table of Contents

1. [Quick Start for AI Agents](#quick-start-for-ai-agents)
2. [Overview](#overview)
3. [Project Structure](#project-structure)
4. [Core Configuration Files](#core-configuration-files)
5. [Test Doubles: Mocks, Stubs, and Spies](#test-doubles-mocks-stubs-and-spies)
6. [Test Pattern & Structure](#test-pattern--structure)
7. [Async Testing Patterns](#async-testing-patterns)
8. [Date & Timer Testing](#date--timer-testing)
9. [Negative Testing & Edge Cases](#negative-testing--edge-cases)
10. [React Component Testing](#react-component-testing)
11. [Test Factory Pattern](#test-factory-pattern)
12. [GitHub Actions CI Configuration](#github-actions-ci-configuration)
13. [Test Coverage Reporting](#test-coverage-reporting)
14. [Integration Testing Patterns](#integration-testing-patterns)
15. [Testing Best Practices](#testing-best-practices)
16. [Replication Checklist](#replication-checklist)
17. [Common Pitfalls](#common-pitfalls)

---

## Quick Start for AI Agents

This section provides a condensed setup guide for AI agents implementing testing in a TypeScript project.

### 5-Step Minimal Setup

```bash
# Step 1: Install dependencies
pnpm add -D vitest @vitest/coverage-v8

# Step 2: Create vitest.config.ts (see Core Configuration section)

# Step 3: Create tests/vitest.setup.ts (see Core Configuration section)

# Step 4: Create first factory in tests/factories/

# Step 5: Write first test, then verify:
pnpm exec vitest run
```

### Environment Decision Matrix

Choose the correct test environment based on what you're testing:

| What You're Testing | Environment | Key Dependencies |
|---------------------|-------------|------------------|
| Services, utilities, business logic | `node` | None additional |
| React components, hooks | `jsdom` | `@testing-library/react`, `jsdom` |
| API routes (Node.js) | `node` | `supertest` (optional) |
| Full-stack integration | `node` | Test database, test containers |

### Minimal Configuration Files

**vitest.config.ts:**
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node", // Change to "jsdom" for React components
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Match your project's path alias
    },
  },
});
```

**tests/vitest.setup.ts:**
```typescript
// Global mocks that apply to all tests
vi.mock("@/config/env", () => ({
  env: { NODE_ENV: "test" },
}));
```

### Verification Checklist

After setup, verify with:

```bash
# ✅ Should exit with code 0 (or show "no tests found" if no tests yet)
pnpm exec vitest run

# ✅ Should show coverage report
pnpm exec vitest run --coverage
```

### Quick Reference: Test File Template

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

// 1. Mock dependencies FIRST
vi.mock("@/repositories/user", () => ({
  userRepository: { findById: vi.fn(), create: vi.fn() },
}));

// 2. Import after mocks
import { userService } from "@/services/userService";
import { userRepository } from "@/repositories/user";

// 3. Get typed mocks
const mockedUserRepo = vi.mocked(userRepository);

// 4. Write tests
describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds user by id", async () => {
    mockedUserRepo.findById.mockResolvedValue({ id: "1", email: "test@example.com" });
    
    const result = await userService.findById("1");
    
    expect(result).toEqual({ id: "1", email: "test@example.com" });
  });
});
```

> **Next Steps:** Read the full sections below for detailed patterns, factories, and advanced testing techniques.

---

## Overview

This testing setup uses **Vitest** for unit testing with the following characteristics:

- **Framework**: Vitest 2.x with global test APIs
- **Environment**: Node.js environment for server-side code
- **Pattern**: AAA (Arrange/Act/Assert) with factory pattern for test data
- **Mocking Strategy**: Mock external dependencies (repos, APIs, email), test business logic
- **CI/CD**: GitHub Actions with pnpm
- **Type Safety**: Full TypeScript support with typed mocks

**Key Benefits:**
- ✅ Fast execution (no database, no external services)
- ✅ Isolated tests with mocked dependencies
- ✅ Reusable test data via factory pattern
- ✅ CI/CD friendly with proper exit codes
- ✅ Type-safe mocks and assertions

---

## Project Structure

```
project-root/
├── tests/
│   ├── vitest.setup.ts          # Global test configuration & mocks
│   ├── factories/               # Test data factories
│   │   ├── index.ts             # Central export for all factories
│   │   ├── UserFactory.ts
│   │   ├── IssueFactory.ts
│   │   ├── SubscriptionFactory.ts
│   │   └── ...                  # Additional factories as needed
│   └── unit/                    # Unit tests organized by source structure
│       ├── lib/
│       │   └── sanitize.test.ts
│       └── server/
│           ├── api/routers/
│           │   ├── newsletter.test.ts
│           │   └── topics.test.ts
│           ├── email/transactional/
│           │   └── adminNotificationEmail.test.ts
│           ├── llm/
│           │   ├── openRouterClient.test.ts
│           │   └── schemas/
│           ├── newsletter/
│           │   ├── issueStatusMachine.test.ts
│           │   └── utils/
│           └── services/        # Service layer tests (most common)
│               ├── UserService.test.ts
│               ├── IssueService.test.ts
│               └── NewsletterService.test.ts
│
├── vitest.config.ts             # Vitest configuration
├── package.json                 # Test scripts
└── .github/
    └── workflows/
        └── ci.yml               # CI/CD pipeline
```

**Organization Principles:**
- Tests mirror the `src/` directory structure
- Factories are centralized in `tests/factories/`
- Global setup in `tests/vitest.setup.ts`
- Test files use `.test.ts` extension

---

## Core Configuration Files

### 1. vitest.config.ts

**Purpose:** Main configuration for Vitest test runner.

```typescript
import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,              // Enable global test APIs (describe, it, expect, vi)
    environment: "node",        // Node environment for server-side code
    include: ["tests/**/*.test.ts"],  // Test file pattern
    setupFiles: [path.resolve(__dirname, "./tests/vitest.setup.ts")],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),  // Match project's path alias (adjust @ or ~ to match your tsconfig)
    },
  },
});
```

**Key Configuration Options:**

| Option | Value | Purpose |
|--------|-------|---------|
| `globals` | `true` | No need to import `describe`, `it`, `expect`, `vi` in every test |
| `environment` | `"node"` | Use Node.js environment (vs. jsdom for browser) |
| `include` | `["tests/**/*.test.ts"]` | Test file pattern matching |
| `setupFiles` | `["./tests/vitest.setup.ts"]` | Runs before all tests |
| `alias` | `{ "~": "./src" }` | Match your project's path alias |

### 2. tests/vitest.setup.ts

**Purpose:** Global test setup that runs before all tests. Use for mocks needed across all test files.

```typescript
/**
 * Vitest setup file for global test configuration.
 * This file runs before all tests and sets up global mocks that are used across all test files.
 */

// Global mock for env - used by all tests
vi.mock("@/config/env", () => ({
  env: {
    NODE_ENV: "test",
  },
}));

// Add other global mocks here as needed
// Example: Mock logger
// vi.mock("@/lib/logger", () => ({
//   logger: {
//     info: vi.fn(),
//     error: vi.fn(),
//     warn: vi.fn(),
//   },
// }));
```

**What to Mock Here:**
- Environment variables
- Logger utilities
- Global configuration objects
- Anything imported by every test file

**What NOT to Mock Here:**
- Service-specific dependencies (mock in individual test files)
- Database repositories (mock per test file)
- External APIs (mock per test file)

### 3. package.json - Test Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:unit:services": "vitest run tests/unit/server/services",
    "test:unit:repos": "vitest run tests/unit/server/db/repo",
    "test:coverage": "vitest run tests/unit --coverage",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "vitest run tests/e2e"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^2.1.8",
    "@vitest/ui": "^2.1.8",
    "vitest": "^2.1.8"
  }
}
```

**Test Commands Reference:**

| Command | Use Case | Exits? | Use in CI? |
|---------|----------|--------|------------|
| `pnpm test` | Watch mode for development | ❌ No | ❌ No |
| `pnpm test:unit` | Run all unit tests once | ✅ Yes | ✅ Yes |
| `pnpm test:coverage` | Run tests with coverage report | ✅ Yes | ✅ Yes |
| `pnpm test:run` | Run all tests once | ✅ Yes | ✅ Yes |
| `pnpm exec vitest run <file>` | Run specific test file | ✅ Yes | ✅ Yes |
| `pnpm test:ui` | UI mode for debugging | ❌ No | ❌ No |

**⚠️ CRITICAL for AI Agents & CI/CD:**

```bash
# ✅ CORRECT: Run all unit tests (exits after completion)
pnpm run test:unit

# ✅ CORRECT: Run specific test file
pnpm exec vitest run tests/unit/server/services/UserService.test.ts

# ❌ WRONG: Enters watch mode, hangs forever in CI
pnpm test
```

### 4. TypeScript Configuration

Add to your `tsconfig.json` to enable Vitest global types and allow imports from the `tests/` directory:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Key Options:**
- `types: ["vitest/globals"]` - Enables global `describe`, `it`, `expect`, `vi` without imports
- `baseUrl: "."` - **Required** for `tests/factories` imports to work (imports relative to project root)
- `paths: { "@/*": ["./src/*"] }` - Path alias for source code imports (adjust `@` or `~` to match your project)

Or create a separate `vitest-env.d.ts`:

```typescript
/// <reference types="vitest/globals" />
```

---

## Test Doubles: Mocks, Stubs, and Spies

Understanding the difference between test doubles helps you choose the right tool for each testing scenario.

### Terminology Reference

| Term | Purpose | Vitest API | When to Use |
|------|---------|------------|-------------|
| **Mock** | Replace an entire module with fake implementation | `vi.mock()` | External services, databases, APIs |
| **Stub** | Provide canned/predetermined responses | `vi.fn().mockReturnValue()` | Return specific test data |
| **Spy** | Observe calls without replacing implementation | `vi.spyOn()` | Verify calls on real code |

### Mock: Replace Entire Modules

Use `vi.mock()` to replace an entire module before it's imported. This is ideal for isolating code from external dependencies.

```typescript
// Replace the entire module with fake implementations
vi.mock("@/repositories/user", () => ({
  userRepository: {
    findById: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

// Now userRepository.findById is a mock function
import { userRepository } from "@/repositories/user";

const mockedRepo = vi.mocked(userRepository);
mockedRepo.findById.mockResolvedValue({ id: "1", name: "Test" });
```

**Key Characteristics:**
- Replaces the module at import time
- Must be called before importing dependent modules
- Use `vi.mocked()` for TypeScript support

### Stub: Provide Canned Responses

Stubs are mock functions configured to return specific values. Use them to control what your code-under-test receives.

```typescript
// Create a stub function
const getUserRole = vi.fn();

// Configure it to return specific values
getUserRole.mockReturnValue("admin");           // Sync return
getUserRole.mockResolvedValue("admin");         // Async return (Promise)
getUserRole.mockReturnValueOnce("guest");       // First call only

// Chain multiple return values
getUserRole
  .mockReturnValueOnce("guest")     // First call
  .mockReturnValueOnce("user")      // Second call
  .mockReturnValue("admin");        // All subsequent calls
```

**Common Stub Patterns:**

```typescript
// Stub that throws an error
mockedRepo.findById.mockRejectedValue(new Error("Database connection lost"));

// Stub with implementation logic
mockedRepo.findById.mockImplementation((id) => {
  if (id === "invalid") return Promise.resolve(undefined);
  return Promise.resolve({ id, name: "Test User" });
});
```

### Spy: Observe Without Replacing

Use `vi.spyOn()` when you want to verify that a method was called but still execute the real implementation.

```typescript
// Spy on a method - real implementation still runs
const consoleSpy = vi.spyOn(console, "log");

// Call the real function
console.log("Hello, world!");

// Verify it was called
expect(consoleSpy).toHaveBeenCalledWith("Hello, world!");

// Restore original implementation
consoleSpy.mockRestore();
```

**Spy with Mock Implementation:**

```typescript
// Spy that replaces implementation temporarily
const dateSpy = vi.spyOn(Date, "now").mockReturnValue(1704067200000);

const timestamp = Date.now(); // Returns mocked value

expect(timestamp).toBe(1704067200000);

dateSpy.mockRestore(); // Restore real Date.now()
```

### Decision Guide: Which to Use?

```
┌─────────────────────────────────────────────────────────────┐
│ Do you need to replace an entire module (database, API)?    │
│                                                             │
│   YES → Use vi.mock() (Mock)                                │
│   NO  ↓                                                     │
├─────────────────────────────────────────────────────────────┤
│ Do you need to verify calls on real implementation?         │
│                                                             │
│   YES → Use vi.spyOn() (Spy)                                │
│   NO  ↓                                                     │
├─────────────────────────────────────────────────────────────┤
│ Do you need to control return values of a function?         │
│                                                             │
│   YES → Use vi.fn().mockReturnValue() (Stub)                │
└─────────────────────────────────────────────────────────────┘
```

### Common Assertion Patterns

```typescript
// Verify function was called
expect(mockFn).toHaveBeenCalled();

// Verify specific arguments
expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");

// Verify call count
expect(mockFn).toHaveBeenCalledTimes(3);

// Verify not called
expect(mockFn).not.toHaveBeenCalled();

// Verify call order (for multiple mocks)
expect(mockA).toHaveBeenCalledBefore(mockB);

// Get all calls for inspection
const allCalls = mockFn.mock.calls;
expect(allCalls[0]).toEqual(["first", "call"]);
expect(allCalls[1]).toEqual(["second", "call"]);
```

---

## Test Pattern & Structure

> **Note:** For a complete test file template, see the [Quick Start for AI Agents](#quick-start-for-ai-agents) section.

### Test Structure Best Practices

1. **Organize with `describe` blocks:**
   ```typescript
   describe("ServiceName", () => {           // Top level: Class/Module
     describe("methodName", () => {          // Second level: Method/Function
       it("specific behavior", () => {});    // Test case: Specific scenario
     });
   });
   ```

2. **Use descriptive test names:**
   ```typescript
   // ✅ GOOD: Clear, behavior-focused
   it("successfully creates user and sends welcome email")
   it("throws error when email is already registered")
   it("returns empty array when no users match criteria")

   // ❌ BAD: Vague, implementation-focused
   it("test createUser")
   it("should work")
   it("test case 1")
   ```

3. **Follow the AAA (Arrange/Act/Assert) pattern:**

   The AAA pattern structures tests into three clear phases. Comments labeling each section are optional—use them for complex tests but omit for simple, self-explanatory tests.

   ```typescript
   // With comments (for complex tests):
   it("creates user and sends notification", async () => {
     // Arrange: Set up test data and mocks
     const mockData = Factory.createData();
     mockedRepo.findById.mockResolvedValue(mockData);
     mockedNotificationService.send.mockResolvedValue({ sent: true });

     // Act: Call the function under test
     const result = await service.createWithNotification(input);

     // Assert: Verify the behavior
     expect(mockedRepo.create).toHaveBeenCalledWith(input);
     expect(mockedNotificationService.send).toHaveBeenCalled();
     expect(result).toEqual(expectedOutput);
   });

   // Without comments (for simple, self-explanatory tests):
   it("finds user by id", async () => {
     const mockUser = UserFactory.createUser();
     mockedRepo.findById.mockResolvedValue(mockUser);

     const result = await service.findById("user-id");

     expect(result).toEqual(mockUser);
   });
   ```

4. **Test both happy paths and error cases:**
   ```typescript
   describe("methodName", () => {
     it("successfully performs operation");
     it("throws error when resource not found");
     it("throws error when validation fails");
     it("handles edge case: empty input");
     it("handles edge case: special characters");
   });
   ```

---

## Async Testing Patterns

Proper async testing prevents race conditions, false positives, and flaky tests. This section covers patterns for testing asynchronous code reliably.

### Basic Async/Await Pattern

**Always use `async/await` with proper assertions:**

```typescript
// ✅ CORRECT: Properly awaited async test
it("fetches user data successfully", async () => {
  const mockUser = UserFactory.createUser();
  mockedUserRepo.findById.mockResolvedValue(mockUser);

  const result = await userService.findById("user-id");

  expect(result).toEqual(mockUser);
});

// ❌ WRONG: Missing await - test passes before promise resolves
it("fetches user data", () => {
  const mockUser = UserFactory.createUser();
  mockedUserRepo.findById.mockResolvedValue(mockUser);

  userService.findById("user-id"); // No await! Test ends before assertion

  expect(result).toEqual(mockUser); // Never runs properly
});
```

### Testing Promise Rejections

**Use `rejects` matcher for expected errors:**

```typescript
// ✅ CORRECT: Testing rejected promises
it("throws error when user not found", async () => {
  mockedUserRepo.findById.mockResolvedValue(undefined);

  await expect(userService.getUser("invalid-id")).rejects.toThrow(
    "User not found"
  );
});

// ✅ CORRECT: Testing specific error types/properties
it("throws error with NOT_FOUND code", async () => {
  mockedUserRepo.findById.mockResolvedValue(undefined);

  await expect(userService.getUser("invalid-id")).rejects.toMatchObject({
    code: "NOT_FOUND",
    message: "User not found",
  });
});

// ❌ WRONG: try/catch without fail() - passes if no error thrown
it("throws error when user not found", async () => {
  try {
    await userService.getUser("invalid-id");
    // If we reach here, no error was thrown - test should fail!
  } catch (error) {
    expect(error.message).toBe("User not found");
  }
});

// ✅ CORRECT: If using try/catch, add explicit fail
it("throws error when user not found", async () => {
  try {
    await userService.getUser("invalid-id");
    expect.fail("Expected error to be thrown");
  } catch (error) {
    expect(error.message).toBe("User not found");
  }
});
```

### Advanced: Concurrent Operations & Side Effects

```typescript
// Testing concurrent requests
it("handles concurrent user creation requests", async () => {
  const emails = ["user1@example.com", "user2@example.com"];
  mockedUserRepo.create.mockImplementation(async ({ email }) => UserFactory.createUser({ email }));

  const results = await Promise.all(emails.map(email => userService.createUser(email)));

  expect(results).toHaveLength(2);
  expect(mockedUserRepo.create).toHaveBeenCalledTimes(2);
});

// Verifying operation order
it("sends email after user is saved", async () => {
  const callOrder: string[] = [];
  mockedUserRepo.create.mockImplementation(async () => { callOrder.push("db"); return UserFactory.createUser(); });
  mockedEmailService.send.mockImplementation(async () => { callOrder.push("email"); });

  await userService.createUser("test@example.com");

  expect(callOrder).toEqual(["db", "email"]);
});
```

### Avoiding Async Test Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Missing `await` | Test passes before promise resolves | Always await async operations |
| Floating promises | Unhandled rejections crash tests | Use `await` or `Promise.all` |
| Race conditions | Test order affects results | Use `beforeEach` to reset state |
| Timeout issues | Slow async operations | Increase timeout or mock delays |

**Configure timeout for slow operations:**

```typescript
// In vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds (default is 5000)
  },
});

// Or per-test:
it("completes slow operation", async () => {
  // ...
}, 15000); // 15 second timeout for this test only
```

---

## Date & Timer Testing

Time-dependent code is a common source of flaky tests. Use Vitest's fake timers to make tests deterministic.

### Why Fake Timers?

Real-world problems with time-dependent tests:

- **Flaky CI**: Tests pass locally but fail in CI due to timing differences
- **Slow tests**: Waiting for real timeouts wastes time
- **Non-deterministic**: `new Date()` returns different values each run
- **Race conditions**: Timing-sensitive code behaves differently under load

### Setting Up Fake Timers

**Basic fake timer setup:**

```typescript
describe("ScheduledTaskService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("schedules task for future execution", () => {
    const callback = vi.fn();
    
    scheduledTaskService.scheduleIn(5000, callback);
    
    expect(callback).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(5000);
    
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
```

### Freezing the Current Date

**Use `vi.setSystemTime()` for consistent date values:**

```typescript
describe("NewsletterService", () => {
  beforeEach(() => {
    // Freeze time to a specific date
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T09:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets correct publish date for newsletter", async () => {
    const issue = await newsletterService.createDraft("Test Newsletter");

    // Date is now deterministic
    expect(issue.createdAt).toEqual(new Date("2025-01-15T09:00:00.000Z"));
  });

  it("calculates days until deadline correctly", () => {
    const deadline = new Date("2025-01-20T09:00:00.000Z");

    const daysUntil = newsletterService.getDaysUntilDeadline(deadline);

    expect(daysUntil).toBe(5); // Always 5, regardless of when test runs
  });
});
```

### Testing setTimeout and setInterval

**Advance timers to trigger callbacks:**

```typescript
describe("RetryService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries failed operation after delay", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockResolvedValueOnce("success");

    const resultPromise = retryService.withRetry(operation, {
      retryDelay: 1000,
      maxRetries: 3,
    });

    // First attempt fails immediately
    await vi.advanceTimersByTimeAsync(0);
    expect(operation).toHaveBeenCalledTimes(1);

    // Advance past retry delay
    await vi.advanceTimersByTimeAsync(1000);
    expect(operation).toHaveBeenCalledTimes(2);

    const result = await resultPromise;
    expect(result).toBe("success");
  });

  it("respects exponential backoff", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockResolvedValueOnce("success");

    const resultPromise = retryService.withExponentialBackoff(operation, {
      baseDelay: 100,
      maxRetries: 3,
    });

    await vi.advanceTimersByTimeAsync(0);   // First attempt
    await vi.advanceTimersByTimeAsync(100); // Wait 100ms, second attempt
    await vi.advanceTimersByTimeAsync(200); // Wait 200ms (2x), third attempt

    const result = await resultPromise;
    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
```

### Testing Debounce/Throttle

```typescript
it("debounces search requests", async () => {
  vi.useFakeTimers();
  const searchApi = vi.fn().mockResolvedValue([]);

  searchService.debouncedSearch("a", searchApi);
  searchService.debouncedSearch("ab", searchApi);
  searchService.debouncedSearch("abc", searchApi);

  expect(searchApi).not.toHaveBeenCalled(); // Within debounce window
  await vi.advanceTimersByTimeAsync(300);
  expect(searchApi).toHaveBeenCalledTimes(1);
  expect(searchApi).toHaveBeenCalledWith("abc");

  vi.useRealTimers();
});
```

### Timer Testing Cheat Sheet

| Method | Purpose | Example |
|--------|---------|---------|
| `vi.useFakeTimers()` | Enable fake timers | Call in `beforeEach` |
| `vi.useRealTimers()` | Restore real timers | Call in `afterEach` |
| `vi.setSystemTime(date)` | Freeze `Date.now()` | `vi.setSystemTime(new Date("2025-01-01"))` |
| `vi.advanceTimersByTime(ms)` | Fast-forward time | `vi.advanceTimersByTime(5000)` |
| `vi.advanceTimersByTimeAsync(ms)` | Fast-forward with async | For async callbacks |
| `vi.advanceTimersToNextTimer()` | Jump to next timer | When exact timing unknown |
| `vi.runAllTimers()` | Execute all pending timers | Clear all scheduled work |
| `vi.clearAllTimers()` | Cancel all pending timers | Clean up without executing |

---

## Negative Testing & Edge Cases

Robust tests verify not just happy paths, but also error handling, boundary conditions, and invalid inputs. This section covers techniques for thorough negative testing.

### Error Path Testing

**Test every way an operation can fail:**

```typescript
describe("UserService.createUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // HAPPY PATH
  // =========================================================================
  
  it("successfully creates user with valid email", async () => {
    mockedUserRepo.create.mockResolvedValue(UserFactory.createUser());
    
    const result = await userService.createUser("valid@example.com");
    
    expect(result).toBeDefined();
  });

  // =========================================================================
  // ERROR PATHS - Test each failure mode
  // =========================================================================

  it("throws error when database insert fails", async () => {
    mockedUserRepo.create.mockRejectedValue(new Error("DB connection lost"));

    await expect(userService.createUser("test@example.com")).rejects.toThrow(
      "Failed to create user"
    );
  });

  it("throws CONFLICT error when email already exists", async () => {
    mockedUserRepo.findByEmail.mockResolvedValue(UserFactory.createUser());

    await expect(userService.createUser("existing@example.com")).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Email already registered",
    });
  });

  it("throws BAD_REQUEST error when email format is invalid", async () => {
    await expect(userService.createUser("not-an-email")).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Invalid email format",
    });
  });

  it("throws error when subscription creation fails after user created", async () => {
    mockedUserRepo.create.mockResolvedValue(UserFactory.createUser());
    mockedSubscriptionService.create.mockRejectedValue(new Error("Subscription failed"));

    await expect(userService.createUser("test@example.com")).rejects.toThrow();
    
    // Verify cleanup/rollback occurred
    expect(mockedUserRepo.delete).toHaveBeenCalled();
  });

  it("continues successfully when welcome email fails", async () => {
    mockedUserRepo.create.mockResolvedValue(UserFactory.createUser());
    mockedSendWelcomeEmail.mockRejectedValue(new Error("Email service down"));

    // Email failure is non-critical - user creation still succeeds
    const result = await userService.createUser("test@example.com");

    expect(result).toBeDefined();
    // Verify error was logged
    expect(mockedLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to send welcome email")
    );
  });
});
```

### Boundary Value & Invalid Input Testing

**Use `it.each` for parameterized testing:**

```typescript
describe("Input Validation", () => {
  // Test invalid inputs with parameterized tests
  const invalidEmails = [
    { input: "", desc: "empty" },
    { input: "noatsign", desc: "missing @" },
    { input: "<script>@xss.com", desc: "XSS attempt" },
  ];

  it.each(invalidEmails)("rejects invalid email: $desc", async ({ input }) => {
    await expect(userService.createUser(input)).rejects.toThrow();
  });

  // Test boundary values
  it("accepts page = 1 (minimum)", async () => {
    const result = await paginationService.getPage({ page: 1, limit: 10 });
    expect(result.page).toBe(1);
  });

  it("rejects page = 0 (below minimum)", async () => {
    await expect(paginationService.getPage({ page: 0, limit: 10 })).rejects.toThrow();
  });

  // Test empty/null states
  it("returns empty array when no data exists", async () => {
    mockedRepo.findAll.mockResolvedValue([]);
    expect(await service.getAll()).toEqual([]);
  });

  it("returns null when not found", async () => {
    mockedRepo.findById.mockResolvedValue(null);
    expect(await service.findById("invalid")).toBeNull();
  });
});
```

### Negative Testing Checklist

Use this checklist when writing tests for any new feature:

| Category | Test Cases |
|----------|------------|
| **Required Fields** | Missing, null, undefined, empty string |
| **String Fields** | Too short, too long, special characters, SQL injection, XSS |
| **Numeric Fields** | Zero, negative, NaN, Infinity, floating point, out of range |
| **Arrays** | Empty, single item, max items exceeded, duplicate items |
| **Dates** | Past dates, future dates, invalid format, timezone handling |
| **IDs/References** | Invalid format, non-existent, already deleted |
| **State Transitions** | Invalid from-state, already in to-state, concurrent changes |
| **Permissions** | Unauthenticated, wrong role, accessing other user's data |
| **Rate Limits** | Exceeded limits, concurrent requests |
| **External Services** | Timeout, 500 error, invalid response, network failure |

---

## React Component Testing

This section covers testing React components, custom hooks, and context providers using Vitest with React Testing Library.

### Setup for React Testing

**1. Install dependencies:**

```bash
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**2. Configure Vitest for React (jsdom environment):**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom", // Required for React component testing
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**3. Update setup file for React Testing Library:**

```typescript
// tests/vitest.setup.ts
import "@testing-library/jest-dom"; // Adds custom matchers like toBeInTheDocument()

// Mock global environment
vi.mock("@/config/env", () => ({
  env: { NODE_ENV: "test" },
}));
```

### Component Testing Patterns

#### Basic Component Test

```typescript
import { render, screen } from "@testing-library/react";
import { UserCard } from "@/components/UserCard";

describe("UserCard", () => {
  it("renders user name and email", () => {
    render(<UserCard name="John Doe" email="john@example.com" />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("renders avatar when imageUrl is provided", () => {
    render(
      <UserCard 
        name="John Doe" 
        email="john@example.com" 
        imageUrl="/avatar.png" 
      />
    );

    const avatar = screen.getByRole("img", { name: /john doe/i });
    expect(avatar).toHaveAttribute("src", "/avatar.png");
  });

  it("renders fallback when imageUrl is not provided", () => {
    render(<UserCard name="John Doe" email="john@example.com" />);

    expect(screen.getByText("JD")).toBeInTheDocument(); // Initials fallback
  });
});
```

#### Testing User Interactions

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Counter } from "@/components/Counter";

describe("Counter", () => {
  it("increments count when button is clicked", async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={0} />);

    expect(screen.getByText("Count: 0")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /increment/i }));

    expect(screen.getByText("Count: 1")).toBeInTheDocument();
  });

  it("calls onChange callback when count changes", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Counter initialCount={0} onChange={handleChange} />);

    await user.click(screen.getByRole("button", { name: /increment/i }));

    expect(handleChange).toHaveBeenCalledWith(1);
  });
});
```

### Custom Hook Testing

Use `renderHook` from React Testing Library to test custom hooks in isolation.

```typescript
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "@/hooks/useCounter";

describe("useCounter", () => {
  it("initializes with provided value", () => {
    const { result } = renderHook(() => useCounter(10));

    expect(result.current.count).toBe(10);
  });

  it("increments count", () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it("resets to initial value", () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(5);
  });
});
```

#### Testing Async Hooks

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useUser } from "@/hooks/useUser";
import { userRepository } from "@/repositories/user";

vi.mock("@/repositories/user", () => ({
  userRepository: {
    findById: vi.fn(),
  },
}));

const mockedUserRepo = vi.mocked(userRepository);

describe("useUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches user data on mount", async () => {
    mockedUserRepo.findById.mockResolvedValue({ id: "1", name: "John" });

    const { result } = renderHook(() => useUser("1"));

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeUndefined();

    // Wait for async operation
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual({ id: "1", name: "John" });
    expect(result.current.error).toBeUndefined();
  });

  it("handles fetch error", async () => {
    mockedUserRepo.findById.mockRejectedValue(new Error("User not found"));

    const { result } = renderHook(() => useUser("invalid-id"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error("User not found"));
    expect(result.current.user).toBeUndefined();
  });
});
```

### Context Provider Testing

```typescript
// Create reusable wrapper for tests needing providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light">{ui}</ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// Mock specific context values
const renderWithAuth = (authValue: Partial<AuthContextType>) => {
  return render(
    <AuthContext.Provider value={{ user: null, isAuthenticated: false, login: vi.fn(), ...authValue }}>
      <ProtectedComponent />
    </AuthContext.Provider>
  );
};

describe("ProtectedComponent", () => {
  it("shows login prompt when not authenticated", () => {
    renderWithAuth({ isAuthenticated: false });
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });

  it("shows content when authenticated", () => {
    renderWithAuth({ isAuthenticated: true, user: { id: "1", name: "John" } });
    expect(screen.getByText(/welcome, john/i)).toBeInTheDocument();
  });
});
```

### Testing Async Components (Loading States)

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { UserProfile } from "@/components/UserProfile";
import { userRepository } from "@/repositories/user";

vi.mock("@/repositories/user");
const mockedUserRepo = vi.mocked(userRepository);

describe("UserProfile", () => {
  it("shows loading state then renders data", async () => {
    mockedUserRepo.findById.mockResolvedValue({ id: "1", name: "John" });

    render(<UserProfile userId="1" />);

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("John")).toBeInTheDocument();
  });

  it("shows error state on fetch failure", async () => {
    mockedUserRepo.findById.mockRejectedValue(new Error("Failed to fetch"));

    render(<UserProfile userId="invalid" />);

    await waitFor(() => {
      expect(screen.getByText(/error loading profile/i)).toBeInTheDocument();
    });
  });
});
```

### Query Selectors Reference

| Method | Use When |
|--------|----------|
| `getByRole` | Accessible elements (buttons, links, inputs) - **preferred** |
| `getByLabelText` | Form inputs with labels |
| `getByText` | Non-interactive text content |
| `getByTestId` | Last resort when other queries don't work |
| `queryBy*` | Asserting element does NOT exist |
| `findBy*` | Async waiting for element to appear |

```typescript
// ✅ PREFERRED: Query by role
screen.getByRole("button", { name: /submit/i });
screen.getByRole("textbox", { name: /email/i });
screen.getByRole("link", { name: /home/i });

// ✅ GOOD: Query by label for form inputs
screen.getByLabelText(/email address/i);

// ⚠️ ACCEPTABLE: Query by text for non-interactive content
screen.getByText(/welcome to our app/i);

// ❌ LAST RESORT: Query by test ID
screen.getByTestId("user-avatar");
```

---

## Test Factory Pattern

### Why Use Factories?

Factories provide consistent, reusable test data with the following benefits:

- ✅ **DRY**: Define test data once, use everywhere
- ✅ **Consistency**: All tests use the same default structure
- ✅ **Flexibility**: Easy to override specific properties
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Maintainability**: Update data structure in one place

### Factory Structure

**Location:** `tests/factories/`

**File: UserFactory.ts**

```typescript
import type { User } from "@/types/user"; // Adjust path to your type definitions

/**
 * Factory for creating User-related test data.
 */
export class UserFactory {
  private static defaultUser(): User {
    const now = new Date();
    return {
      id: "00000000-0000-0000-0000-000000000001",
      email: "test@example.com",
      createdAt: now,
    };
  }

  /**
   * Creates a mock User with Date objects.
   * Used for database responses.
   */
  static createUser(overrides?: Partial<User>): User {
    return {
      ...this.defaultUser(),
      ...overrides,
    };
  }

  /**
   * Creates a mock User with string dates (ISO format).
   * Used to simulate Redis cached responses where dates are serialized as strings.
   */
  static createUserWithStringDates(
    overrides?: Partial<User>,
  ): Record<string, unknown> {
    const user = this.createUser(overrides);
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * Creates an array of mock User objects.
   */
  static createUsers(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, (_, index) =>
      this.createUser({
        id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
        email: `test${index + 1}@example.com`,
        ...overrides,
      }),
    );
  }
}
```

**File: index.ts (Central Export)**

```typescript
export { UserFactory } from "./UserFactory";
export { IssueFactory } from "./IssueFactory";
export { SubscriptionFactory } from "./SubscriptionFactory";
export { TopicFactory } from "./TopicFactory";
// ... export all other factories
```

### Factory Usage Examples

```typescript
import { UserFactory, IssueFactory } from "tests/factories";

// Create single entity with defaults
const user = UserFactory.createUser();

// Override specific properties
const customUser = UserFactory.createUser({ email: "custom@example.com" });

// Create multiple entities
const users = UserFactory.createUsers(5);

// Combine factories for related data
const user = UserFactory.createUser();
const issue = IssueFactory.createIssue({ userId: user.id });
```

---

## GitHub Actions CI Configuration

### Complete CI Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.15.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test:unit
```

### Configuration Breakdown

| Step | Purpose | Key Options |
|------|---------|-------------|
| `actions/checkout@v4` | Clone repository | Standard checkout |
| `pnpm/action-setup@v4` | Install pnpm | Specify exact version |
| `actions/setup-node@v4` | Install Node.js | Enable pnpm cache |
| `pnpm install` | Install dependencies | `--frozen-lockfile` for reproducibility |
| `pnpm test:unit` | Run tests | Uses `vitest run` (exits properly) |

### Key CI/CD Considerations

1. **Use `--frozen-lockfile`:**
   ```yaml
   - run: pnpm install --frozen-lockfile
   ```
   Ensures exact dependency versions from lockfile (prevents surprises).

2. **Cache pnpm dependencies:**
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: "pnpm"
   ```
   Dramatically speeds up CI runs.

3. **Use exit-friendly test command:**
   ```yaml
   - run: pnpm test:unit  # ✅ Exits after completion
   # NOT: pnpm test       # ❌ Hangs in watch mode
   ```

4. **Minimal permissions:**
   ```yaml
   permissions:
     contents: read  # Only read access needed for tests
   ```

### Alternative: npm/yarn Setup

For npm:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: "npm"
- run: npm ci
- run: npm run test:unit
```

For yarn:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: "yarn"
- run: yarn install --frozen-lockfile
- run: yarn test:unit
```

---

## Test Coverage Reporting

Coverage reporting helps identify untested code paths. This section covers how to configure coverage collection and view reports in CI.

### What Coverage Measures

| Metric | Description | What It Catches |
|--------|-------------|-----------------|
| **Line Coverage** | % of code lines executed | Dead code, unused branches |
| **Branch Coverage** | % of if/else/switch paths taken | Untested conditional logic |
| **Function Coverage** | % of functions called | Unused functions |
| **Statement Coverage** | % of statements executed | Granular line-level gaps |

### Configuration

**1. Install coverage dependency:**

```bash
pnpm add -D @vitest/coverage-v8
```

**2. Update `vitest.config.ts`:**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/vitest.setup.ts"],
    
    // Coverage configuration
    coverage: {
      provider: "v8",                    // Fast, built into Node.js
      reporter: ["text", "html", "json"], // Multiple output formats
      reportsDirectory: "./coverage",    // Output directory
      
      // What to measure
      include: ["src/**/*.ts"],
      
      // What to exclude
      exclude: [
        "**/*.test.ts",
        "**/*.d.ts",
        "**/types/**",
        "src/env.js",                    // Environment config
        "src/app/**/*.tsx",              // React components (if unit testing backend only)
      ],
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
```

**3. Add coverage script to `package.json`:**

```json
{
  "scripts": {
    "test:unit": "vitest run tests/unit",
    "test:coverage": "vitest run tests/unit --coverage"
  }
}
```

### Running Coverage Locally

```bash
# Run tests with coverage
pnpm test:coverage

# Output:
# ✓ tests/unit/server/services/UserService.test.ts (12 tests)
# ✓ tests/unit/server/services/IssueService.test.ts (8 tests)
#
# Coverage:
# ----------------------|---------|----------|---------|---------|
# File                  | % Stmts | % Branch | % Funcs | % Lines |
# ----------------------|---------|----------|---------|---------|
# All files             |   78.32 |    65.21 |   82.14 |   78.32 |
#  services/            |   85.71 |    72.00 |   90.00 |   85.71 |
#   UserService.ts      |   92.30 |    80.00 |  100.00 |   92.30 |
#   IssueService.ts     |   79.12 |    64.00 |   80.00 |   79.12 |
# ----------------------|---------|----------|---------|---------|
```

**View detailed HTML report:**

```bash
# Open the HTML report in your browser
open coverage/index.html   # macOS
xdg-open coverage/index.html  # Linux
```

The HTML report provides:
- File-by-file coverage breakdown
- Line-by-line highlighting of covered/uncovered code
- Branch coverage visualization
- Sortable/filterable views

### CI Integration with GitHub Actions

**Update `.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.15.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests with coverage
        run: pnpm test:coverage

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 14
```

### Viewing Coverage in CI

After the workflow runs:

1. Go to the **Actions** tab in GitHub
2. Click on the workflow run
3. Scroll to **Artifacts** section
4. Download **coverage-report**
5. Extract and open `index.html`

### Coverage Output Formats

| Format | Use Case | File |
|--------|----------|------|
| `text` | Console summary during test run | stdout |
| `html` | Interactive browsable report | `coverage/index.html` |
| `json` | Machine-readable for tools | `coverage/coverage-final.json` |
| `lcov` | Integration with coverage services | `coverage/lcov.info` |

**Example with multiple formats:**

```typescript
coverage: {
  reporter: ["text", "html", "json", "lcov"],
}
```

### Interpreting Coverage Results

**What the numbers mean:**

```
File: UserService.ts
Statements: 92.30% (36/39)    <- 3 statements not executed
Branches:   80.00% (8/10)     <- 2 branch paths not taken  
Functions:  100%   (5/5)      <- All functions called
Lines:      92.30% (36/39)    <- 3 lines not covered
```

**Common uncovered patterns:**

```typescript
// Uncovered: Error handling branch
if (!user) {
  throw new Error("User not found");  // ❌ Never tested
}

// Uncovered: Early return
if (cachedResult) {
  return cachedResult;  // ❌ Cache hit path not tested
}

// Uncovered: Default case
switch (status) {
  case "active": return handleActive();
  case "inactive": return handleInactive();
  default: return handleUnknown();  // ❌ Default never reached
}
```

### Adding Thresholds (Optional)

When you're ready to enforce minimum coverage, add thresholds:

```typescript
coverage: {
  provider: "v8",
  reporter: ["text", "html"],
  
  // Fail if coverage drops below these thresholds
  thresholds: {
    statements: 80,
    branches: 70,
    functions: 80,
    lines: 80,
  },
}
```

**Start without thresholds** to establish a baseline, then gradually increase as you add tests.

### Best Practices for Coverage

1. **Don't chase 100%**: Aim for meaningful coverage of critical paths, not vanity metrics
2. **Focus on branches**: Branch coverage catches more bugs than line coverage
3. **Exclude generated code**: Don't measure auto-generated files, type definitions, etc.
4. **Review the report**: Look at which lines are uncovered, not just the percentage
5. **Add tests for uncovered error paths**: These are often the most important to test

---

## Integration Testing Patterns

Integration tests verify that multiple components work together correctly. Unlike unit tests that mock dependencies, integration tests use real implementations to test the full flow.

### When to Use Integration Tests

| Scenario | Test Type | Reasoning |
|----------|-----------|-----------|
| Service business logic | Unit test | Mock repositories, test logic in isolation |
| API endpoint behavior | Integration test | Test full request/response cycle |
| Database queries | Integration test | Verify actual SQL/ORM behavior |
| Multiple services together | Integration test | Test service interactions |
| Third-party API integration | Integration test | Verify real API contract |

### Decision Framework

```
┌────────────────────────────────────────────────────────────────┐
│ Does the test need a real database or external service?        │
│                                                                │
│   NO  → Unit test (mock dependencies)                          │
│   YES ↓                                                        │
├────────────────────────────────────────────────────────────────┤
│ Does the test verify interactions between multiple layers?     │
│ (e.g., API → Service → Repository → Database)                  │
│                                                                │
│   YES → Integration test                                       │
│   NO  → Consider if mocking is simpler                         │
└────────────────────────────────────────────────────────────────┘
```

### Project Structure for Integration Tests

```
tests/
├── unit/                    # Mocked, fast tests
│   └── services/
│       └── UserService.test.ts
├── integration/             # Real dependencies, slower tests
│   ├── api/                 # API endpoint tests
│   │   └── users.test.ts
│   ├── repositories/        # Database tests
│   │   └── userRepository.test.ts
│   └── workflows/           # Multi-service tests
│       └── userRegistration.test.ts
└── vitest.setup.ts
```

### Database Testing Setup

```typescript
// tests/integration/setup.ts
import { db } from "@/db";
import { migrate } from "drizzle-orm/node-postgres/migrator";

export async function setupTestDatabase() {
  await migrate(db, { migrationsFolder: "./drizzle" });
}

export async function cleanupTestDatabase() {
  await db.delete(users);
  await db.delete(orders);
}

export async function teardownTestDatabase() {
  await db.$client.end();
}
```

```typescript
// tests/integration/repositories/userRepository.test.ts
describe("UserRepository (Integration)", () => {
  beforeAll(async () => { await setupTestDatabase(); });
  afterAll(async () => { await teardownTestDatabase(); });
  beforeEach(async () => { await cleanupTestDatabase(); });

  it("creates and retrieves a user", async () => {
    const created = await userRepository.create({ email: "test@example.com", name: "Test" });
    const found = await userRepository.findById(created.id);
    expect(found).toEqual(created);
  });
});
```

> **Alternative strategies:** [Testcontainers](https://testcontainers.com/) for Docker-based isolation, or in-memory SQLite for fast but limited testing.

### API Route Testing

```typescript
describe("Users API (Integration)", () => {
  let baseUrl: string;

  beforeAll(async () => {
    await setupTestDatabase();
    server = createServer();
    await server.listen({ port: 0 });
    baseUrl = `http://localhost:${server.address().port}`;
  });

  it("creates a new user", async () => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "newuser@example.com", name: "New User" }),
    });

    expect(response.status).toBe(201);
    const user = await response.json();
    expect(user.email).toBe("newuser@example.com");
  });
});
```

### Test Isolation Best Practices

1. **Clean database before each test:**
   ```typescript
   beforeEach(async () => {
     await cleanupTestDatabase();
   });
   ```

2. **Use transactions for rollback (alternative to cleanup):**
   ```typescript
   let transaction: Transaction;
   
   beforeEach(async () => {
     transaction = await db.transaction();
   });
   
   afterEach(async () => {
     await transaction.rollback();
   });
   ```

3. **Avoid shared state between tests:**
   ```typescript
   // ❌ BAD: Shared state
   let createdUser: User;
   
   it("creates user", async () => {
     createdUser = await userService.create(...);
   });
   
   it("updates user", async () => {
     await userService.update(createdUser.id, ...); // Depends on previous test
   });
   
   // ✅ GOOD: Independent tests
   it("updates user", async () => {
     const user = await userService.create(...);
     await userService.update(user.id, ...);
   });
   ```

### Running Integration Tests Separately

```json
// package.json
{
  "scripts": {
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:all": "vitest run"
  }
}
```

**CI/CD Consideration:** Run unit tests first (fast feedback), then integration tests:

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    steps:
      - run: pnpm test:unit          # Fast, mocked tests first
      - run: pnpm test:integration   # Slower, real dependencies
```

---

## Testing Best Practices

1. **Mock external dependencies, test business logic** — Mock repos/APIs, verify service behavior
2. **Test behavior, not implementation** — Assert outcomes, not internal method calls
3. **Test edge cases and error scenarios** — Happy path + errors + boundary conditions
4. **Use descriptive test names** — `"throws UNAUTHORIZED when token is invalid"` not `"test case 1"`
5. **Clear mocks in beforeEach** — `vi.clearAllMocks()` prevents test contamination
6. **Test one thing per test** — Single assertion focus, easier debugging
7. **Use factories for test data** — Consistent, reusable, type-safe test objects
8. **Avoid test interdependence** — Each test should run independently

> **See [Common Pitfalls](#common-pitfalls) for detailed examples of what to avoid.**

---

## Replication Checklist

Use this checklist to replicate the testing setup in a new project:

### Phase 1: Initial Setup

- [ ] **Install dependencies:**
  ```bash
  # Core testing
  pnpm add -D vitest @vitest/ui @vitest/coverage-v8
  
  # For React component testing (if applicable)
  pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
  ```

- [ ] **Create `vitest.config.ts`:**
  ```typescript
  import { defineConfig } from "vitest/config";
  import path from "path";
  // import react from "@vitejs/plugin-react"; // Uncomment for React projects

  export default defineConfig({
    // plugins: [react()], // Uncomment for React projects
    test: {
      globals: true,
      environment: "node", // Use "jsdom" for React component tests
      include: ["tests/**/*.test.{ts,tsx}"],
      setupFiles: ["./tests/vitest.setup.ts"],
      
      // Coverage configuration
      coverage: {
        provider: "v8",
        reporter: ["text", "html", "json"],
        reportsDirectory: "./coverage",
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["**/*.test.{ts,tsx}", "**/*.d.ts", "**/types/**"],
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"), // Match your tsconfig paths
      },
    },
  });
  ```

- [ ] **Create `tests/vitest.setup.ts`:**
  ```typescript
  // For React projects, add jest-dom matchers
  // import "@testing-library/jest-dom";
  
  vi.mock("@/config/env", () => ({
    env: {
      NODE_ENV: "test",
    },
  }));
  ```

- [ ] **Add to `tsconfig.json`:**
  ```json
  {
    "compilerOptions": {
      "types": ["vitest/globals"],
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```

### Phase 2: Test Scripts

- [ ] **Add scripts to `package.json`:**
  ```json
  {
    "scripts": {
      "test:unit": "vitest run tests/unit",
      "test:coverage": "vitest run tests/unit --coverage",
      "test:run": "vitest run",
      "test:ui": "vitest --ui"
    }
  }
  ```

### Phase 3: Factory Setup

- [ ] **Create factory directory:**
  ```bash
  mkdir -p tests/factories
  ```

- [ ] **Create first factory** (e.g., `UserFactory.ts`):
  ```typescript
  export class UserFactory {
    static createUser(overrides?: Partial<User>): User {
      return {
        id: "test-id",
        email: "test@example.com",
        ...overrides,
      };
    }
  }
  ```

- [ ] **Create `tests/factories/index.ts`:**
  ```typescript
  export { UserFactory } from "./UserFactory";
  // Export other factories as you create them
  ```

### Phase 4: Test Directory Structure

- [ ] **Create test directories:**
  ```bash
  mkdir -p tests/unit/lib
  mkdir -p tests/unit/server/services
  mkdir -p tests/unit/server/api/routers
  ```

- [ ] **Create first test file** following the template in this guide

### Phase 5: CI/CD Setup

- [ ] **Create `.github/workflows/ci.yml`:**
  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
          with:
            version: 10.15.0
        - uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: "pnpm"
        - run: pnpm install --frozen-lockfile
        - run: pnpm test:coverage
        - uses: actions/upload-artifact@v4
          with:
            name: coverage-report
            path: coverage/
            retention-days: 14
  ```

- [ ] **Add `coverage/` to `.gitignore`:**
  ```
  # Test coverage
  coverage/
  ```

### Phase 6: Verification

- [ ] **Run tests locally:**
  ```bash
  pnpm test:unit
  ```

- [ ] **Verify CI pipeline:**
  - Push to GitHub
  - Check Actions tab for successful test run

- [ ] **Create additional factories** as needed for your domain models

- [ ] **Write tests** for critical business logic first

---

## Common Pitfalls

### 1. Using Watch Mode in CI

**❌ PROBLEM:**
```bash
# Hangs forever in CI
pnpm test
```

**✅ SOLUTION:**
```bash
# Exits after tests complete
pnpm test:unit
# or
pnpm exec vitest run
```

### 2. Forgetting to Clear Mocks

**❌ PROBLEM:**
```typescript
describe("ServiceName", () => {
  it("test 1", () => {
    mockedRepo.findById.mockResolvedValue(data1);
    // ...
  });

  it("test 2", () => {
    // Mock from test 1 still active! 🐛
  });
});
```

**✅ SOLUTION:**
```typescript
describe("ServiceName", () => {
  beforeEach(() => {
    vi.clearAllMocks();  // Reset all mocks
  });
  // ...
});
```

### 3. Not Using Factories

**❌ PROBLEM:**
```typescript
// Repeated in every test, inconsistent
it("test 1", () => {
  const user = { id: "1", email: "test@example.com", createdAt: new Date() };
});

it("test 2", () => {
  const user = { id: "2", email: "test2@example.com" }; // Missing createdAt!
});
```

**✅ SOLUTION:**
```typescript
it("test 1", () => {
  const user = UserFactory.createUser({ id: "1" });
});

it("test 2", () => {
  const user = UserFactory.createUser({ id: "2", email: "test2@example.com" });
});
```

### 4. Mocking After Imports

**❌ PROBLEM:**
```typescript
import { userService } from "@/services/userService";
import { userRepository } from "@/repositories/user";

// Too late! userService already imported with real userRepository
vi.mock("@/repositories/user");
```

**✅ SOLUTION:**
```typescript
import { vi } from "vitest";

// Mock FIRST, before other imports
vi.mock("@/repositories/user", () => ({
  userRepository: { findById: vi.fn() }
}));

// Then import modules that depend on mocked modules
import { userService } from "@/services/userService";
```

### 5. Testing Implementation Instead of Behavior

**❌ PROBLEM:**
```typescript
it("calls internal helper method", () => {
  service.publicMethod();
  expect(service._internalHelper).toHaveBeenCalled(); // Implementation detail
});
```

**✅ SOLUTION:**
```typescript
it("returns correct result when conditions are met", () => {
  const result = service.publicMethod();
  expect(result).toEqual(expectedOutput); // Test behavior
});
```

### 6. Missing Path Alias in Config

**❌ PROBLEM:**
```typescript
// vitest.config.ts without alias
export default defineConfig({
  test: { /* ... */ },
  // Missing: resolve.alias
});

// Tests fail with "Cannot find module '@/...'"
```

**✅ SOLUTION:**
```typescript
export default defineConfig({
  test: { /* ... */ },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Match your tsconfig paths
    },
  },
});
```

### 7. Not Using `vi.mocked()` for Type Safety

**❌ PROBLEM:**
```typescript
vi.mock("@/repositories/user");

// No type checking, easy to make mistakes
userRepository.findById.mockResolvedValue(/* ... */);  // ❌ Type error
```

**✅ SOLUTION:**
```typescript
vi.mock("@/repositories/user");

const mockedUserRepo = vi.mocked(userRepository);

// Full TypeScript support
mockedUserRepo.findById.mockResolvedValue(/* ... */);  // ✅ Type safe
```

### 8. Async Testing Mistakes

**Missing `await`:**
```typescript
// ❌ Test passes before promise resolves
it("creates user", () => {
  userService.createUser("test@example.com"); // No await!
});

// ✅ Always await async operations
it("creates user", async () => {
  await userService.createUser("test@example.com");
});
```

**Error testing without `rejects`:**
```typescript
// ❌ try/catch passes if no error thrown
// ✅ Use rejects matcher
await expect(service.method()).rejects.toThrow("Expected error");
```

### 9. Timer Testing Mistakes

```typescript
// ❌ Forgetting to restore timers (leaks to other tests)
// ❌ Using real time delays (slow and flaky)

// ✅ Always pair fake/real timers
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

// ✅ Advance time instantly
vi.advanceTimersByTime(24 * 60 * 60 * 1000);
```

### 10. Only Testing Happy Paths

```typescript
// ❌ Missing error and edge case tests
describe("UserService", () => {
  it("creates user successfully", async () => { /* ... */ });
});

// ✅ Test happy path + errors + edge cases
describe("UserService", () => {
  it("creates user successfully", async () => { /* ... */ });
  it("throws error when database fails", async () => { /* ... */ });
  it("handles email with special characters", async () => { /* ... */ });
});
```

---

## Summary

This testing setup provides:

1. **Quick Start for AI Agents:** Condensed setup guide with minimal configuration
2. **Fast, Isolated Tests:** Mock external dependencies, test business logic
3. **Type Safety:** Full TypeScript support with `vi.mocked()`
4. **Test Doubles Clarity:** Clear distinction between mocks, stubs, and spies
5. **Reusable Test Data:** Factory pattern for consistent mocks
6. **React Component Testing:** Components, hooks, and context testing patterns
7. **Integration Testing:** Database, API, and workflow testing strategies
8. **CI/CD Ready:** Proper exit codes with `vitest run`
9. **Maintainable:** Clear structure, organized by feature
10. **Developer Friendly:** Global test APIs, descriptive names, helpful factories
11. **Coverage Reporting:** Visual reports with CI artifact uploads
12. **Async Testing:** Proper patterns for promises, concurrency, and race conditions
13. **Deterministic Time:** Fake timers for reliable date/time testing
14. **Comprehensive Negative Testing:** Error paths, boundary values, and invalid inputs

**Key Commands to Remember:**
```bash
# Local development
pnpm test:unit                  # Run all unit tests once
pnpm test:coverage              # Run tests with coverage report
pnpm exec vitest run <file>     # Run specific test file

# View coverage report
open coverage/index.html        # macOS
xdg-open coverage/index.html    # Linux

# CI/CD
pnpm test:coverage              # Run with coverage in CI

# Never use in CI
pnpm test                       # ❌ Hangs in watch mode
```

**Next Steps:**
1. Follow the [Replication Checklist](#replication-checklist)
2. Create factories for your domain models
3. Write tests for critical business logic first
4. Expand coverage gradually
5. Keep tests fast and focused

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-testing-mistakes)
- [Factory Pattern](https://refactoring.guru/design-patterns/factory-method)

---

