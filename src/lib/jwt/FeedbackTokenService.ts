import jwt from "jsonwebtoken";
import { env } from "~/env";

interface FeedbackJWTPayload {
  userId: string;
  issueId?: number;
  campaignId?: string;
}

/**
 * Generates a JWT token for issue-based feedback.
 * @param userId - The user ID.
 * @param issueId - The issue ID.
 * @returns The JWT token with 90-day expiration.
 * @throws {Error} If JWT signing fails.
 */
export function generateFeedbackToken(userId: string, issueId: number): string {
  return jwt.sign({ userId, issueId }, env.JWT_SECRET, {
    expiresIn: "90d",
  });
}

/**
 * Generates a JWT token for marketing campaign feedback.
 * @param userId - The user ID.
 * @param campaignId - The campaign ID.
 * @returns The JWT token with 90-day expiration.
 * @throws {Error} If JWT signing fails.
 */
export function generateMarketingFeedbackToken(
  userId: string,
  campaignId: string,
): string {
  return jwt.sign({ userId, campaignId }, env.JWT_SECRET, {
    expiresIn: "90d",
  });
}

/**
 * Validates and decodes a feedback JWT token.
 * @param token - The JWT token to validate.
 * @returns The decoded token payload if valid, null otherwise.
 */
export function validateFeedbackToken(
  token: string,
): FeedbackJWTPayload | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as FeedbackJWTPayload;
    return payload;
  } catch (error) {
    console.error("validateFeedbackToken JWT validation failed", error);
    return null;
  }
}

/**
 * Generates a feedback page URL with an embedded JWT token for issue-based feedback.
 * @param userId - The user ID.
 * @param issueId - The issue ID.
 * @returns The complete feedback page URL with token query parameter.
 */
export function generateFeedbackPageUrl(
  userId: string,
  issueId: number,
): string {
  const token = generateFeedbackToken(userId, issueId);
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  return `${baseUrl}/feedback?token=${encodeURIComponent(token)}`;
}

/**
 * Generates a feedback page URL with an embedded JWT token for marketing campaign feedback.
 * @param userId - The user ID.
 * @param campaignId - The campaign ID.
 * @returns The complete feedback page URL with token query parameter.
 */
export function generateMarketingFeedbackPageUrl(
  userId: string,
  campaignId: string,
): string {
  const token = generateMarketingFeedbackToken(userId, campaignId);
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  return `${baseUrl}/feedback?token=${encodeURIComponent(token)}`;
}
