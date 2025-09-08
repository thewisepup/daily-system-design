export const DB_FETCH_SIZE = 500;
export const AWS_SES_RATE_LIMIT = 14;
export const BULK_EMAIL_SIZE = 14;
export const BULK_EMAIL_DELAY = 1000; // 1 second delay between batches
export const BULK_EMAIL_MAX_RETRIES = 3; // Retry failed batches

// Standard message tag names for consistent tracking
export const STANDARD_TAG_NAMES = {
  USER_ID: "user_id",
  SUBJECT_ID: "subject_id",
  ISSUE_NUMBER: "issue_number",
} as const;
