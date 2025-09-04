import { redis } from "./client";

export async function safeRedisOperation<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error("Redis operation failed:", error);
    return await fallback();
  }
}

export function invalidateCache(key: string): void {
  redis.del(key).catch((error) => {
    console.error(`Failed to invalidate cache key ${key}:`, error);
  });
}
