import { z } from "zod";

/**
 * Shared validation schemas for consistent input validation across the application.
 * These schemas should be used in both tRPC routers and service methods.
 */
export const ValidationSchemas = {
  /**
   * UUID validation schema for user IDs.
   * Validates that the string is a valid UUID v4 format.
   */
  userId: z.string().uuid("Invalid user ID format - must be a valid UUID"),

  /**
   * Array of user IDs validation schema.
   * Validates that all items are valid UUIDs and array is not empty.
   */
  userIds: z
    .array(z.string().uuid("Invalid user ID format - must be a valid UUID"))
    .min(1, "User IDs array cannot be empty"),

  /**
   * Subject ID validation schema.
   * Validates that the number is a positive integer.
   */
  subjectId: z
    .number()
    .int("Subject ID must be an integer")
    .positive("Subject ID must be positive"),

  /**
   * Email validation schema.
   * Validates RFC 5322 compliant email addresses.
   */
  email: z.string().email("Invalid email address format"),

  /**
   * Issue ID validation schema.
   * Validates that the number is a positive integer.
   */
  issueId: z
    .number()
    .int("Issue ID must be an integer")
    .positive("Issue ID must be positive"),

  /**
   * Pagination parameters validation schema.
   * Validates page number and results per page for paginated queries.
   */
  pagination: z.object({
    page: z
      .number()
      .int("Page must be an integer")
      .min(1, "Page must be at least 1"),
    resultsPerPage: z
      .number()
      .int("Results per page must be an integer")
      .min(0, "Results per page must be at least 0"),
  }),
} as const;

/**
 * Validate a single user ID.
 * Throws ZodError if validation fails with descriptive error message.
 *
 * @param userId - The user ID to validate
 * @throws {z.ZodError} If userId is not a valid UUID
 *
 * @example
 * validateUserId("00000000-0000-0000-0000-000000000001"); // passes
 * validateUserId("invalid"); // throws ZodError
 */
export function validateUserId(userId: string): void {
  ValidationSchemas.userId.parse(userId);
}

/**
 * Validate an array of user IDs.
 * Throws ZodError if validation fails with descriptive error message.
 *
 * @param userIds - The array of user IDs to validate
 * @throws {z.ZodError} If any userId is invalid or array is empty
 *
 * @example
 * validateUserIds(["00000000-0000-0000-0000-000000000001"]); // passes
 * validateUserIds([]); // throws ZodError
 * validateUserIds(["invalid"]); // throws ZodError
 */
export function validateUserIds(userIds: string[]): void {
  ValidationSchemas.userIds.parse(userIds);
}

/**
 * Validate a subject ID.
 * Throws ZodError if validation fails with descriptive error message.
 *
 * @param subjectId - The subject ID to validate
 * @throws {z.ZodError} If subjectId is not a positive integer
 *
 * @example
 * validateSubjectId(1); // passes
 * validateSubjectId(0); // throws ZodError
 * validateSubjectId(-1); // throws ZodError
 */
export function validateSubjectId(subjectId: number): void {
  ValidationSchemas.subjectId.parse(subjectId);
}

/**
 * Validate an email address.
 * Throws ZodError if validation fails with descriptive error message.
 *
 * @param email - The email address to validate
 * @throws {z.ZodError} If email is not a valid format
 *
 * @example
 * validateEmail("user@example.com"); // passes
 * validateEmail("invalid"); // throws ZodError
 */
export function validateEmail(email: string): void {
  ValidationSchemas.email.parse(email);
}

/**
 * Validate an issue ID.
 * Throws ZodError if validation fails with descriptive error message.
 *
 * @param issueId - The issue ID to validate
 * @throws {z.ZodError} If issueId is not a positive integer
 *
 * @example
 * validateIssueId(1); // passes
 * validateIssueId(0); // throws ZodError
 */
export function validateIssueId(issueId: number): void {
  ValidationSchemas.issueId.parse(issueId);
}

/**
 * Validate pagination parameters.
 * Throws ZodError if validation fails with descriptive error message.
 *
 * @param page - The page number (must be >= 1)
 * @param resultsPerPage - Number of results per page (must be >= 0)
 * @throws {z.ZodError} If page or resultsPerPage are invalid
 *
 * @example
 * validatePagination(1, 10); // passes
 * validatePagination(0, 10); // throws ZodError
 * validatePagination(1, -1); // throws ZodError
 */
export function validatePagination(page: number, resultsPerPage: number): void {
  ValidationSchemas.pagination.parse({ page, resultsPerPage });
}
