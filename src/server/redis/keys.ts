import { env } from "~/env";

// Redis cache keys with environment prefix
export const CACHE_KEYS = {
  SUBSCRIBER_COUNT: `${env.VERCEL_ENV}:daily-system-design:subscriber-count`,
  SENT_ISSUE: (issueId: number): string =>
    `${env.VERCEL_ENV}:daily-system-design:sent-issue:${issueId}`,
  LATEST_SENT_ISSUE: (subjectId: number): string =>
    `${env.VERCEL_ENV}:daily-system-design:latest-sent-issue:${subjectId}`,
};

// Cache TTL in seconds
export const CACHE_TTL = {
  SUBSCRIBER_COUNT: 6 * 60 * 60, // 6 hours
  SENT_ISSUE: 12 * 60 * 60, // 12 hours
} as const;
