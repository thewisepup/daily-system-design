export const BULK_EMAIL_CONSTANTS = {
  BATCH_SIZE: 14,              // Emails per batch (respects SES rate limit)
  DB_FETCH_SIZE: 500,          // Users fetched per DB query
  RATE_LIMIT_PER_SECOND: 14,   // AWS SES rate limit
  DELAY_BETWEEN_BATCHES: 1000, // 1 second delay between batches
  MAX_RETRIES: 3,              // Retry failed batches
} as const;