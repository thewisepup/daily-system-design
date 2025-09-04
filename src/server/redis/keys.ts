// Redis cache keys
export const CACHE_KEYS = {
  SUBSCRIBER_COUNT: "daily-system-design:subscriber-count",
} as const;

// Cache TTL in seconds
export const CACHE_TTL = {
  SUBSCRIBER_COUNT: 300, // 5 minutes
} as const;
