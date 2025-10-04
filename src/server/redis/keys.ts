import { env } from "~/env";

// Redis cache keys with environment prefix
export const CACHE_KEYS = {
  SUBSCRIBER_COUNT: `${env.VERCEL_ENV}:daily-system-design:subscriber-count`,
} as const;

// Cache TTL in seconds
export const CACHE_TTL = {
  SUBSCRIBER_COUNT: 6 * 60 * 60, // 6 hours
} as const;
