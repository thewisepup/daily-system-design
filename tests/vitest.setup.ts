/**
 * Vitest setup file for global test configuration.
 * This file runs before all tests and sets up global mocks that are used across all test files.
 */

// Global mock for env - used by all tests
vi.mock("~/env", () => ({
  env: {
    VERCEL_ENV: "test",
  },
}));
