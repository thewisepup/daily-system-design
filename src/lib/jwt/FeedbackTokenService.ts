import jwt from "jsonwebtoken";
import { env } from "~/env";

interface FeedbackJWTPayload {
  userId: string;
  issueId?: number;
  campaignId?: string;
}

export function generateFeedbackToken(userId: string, issueId: number): string {
  return jwt.sign({ userId, issueId }, env.JWT_SECRET);
}

export function generateMarketingFeedbackToken(
  userId: string,
  campaignId: string,
): string {
  return jwt.sign({ userId, campaignId }, env.JWT_SECRET);
}

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

export function generateFeedbackPageUrl(
  userId: string,
  issueId: number,
): string {
  const token = generateFeedbackToken(userId, issueId);
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  return `${baseUrl}/feedback?token=${encodeURIComponent(token)}`;
}

export function generateMarketingFeedbackPageUrl(
  userId: string,
  campaignId: string,
): string {
  const token = generateMarketingFeedbackToken(userId, campaignId);
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  return `${baseUrl}/feedback?token=${encodeURIComponent(token)}`;
}
