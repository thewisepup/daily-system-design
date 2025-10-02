import jwt from "jsonwebtoken";
import { env } from "~/env";
interface FeedbackJWTPayload {
  userId: string;
  issueId: number;
}
export function generateFeedbackToken(userId: string, issueId: number) {
  try {
    return jwt.sign({ userId, issueId }, env.JWT_SECRET);
  } catch (error) {
    console.error(
      `generateFeedbackToken: failed to generate JWT token. userId: ${userId} issueId:${issueId}`,
      error,
    );
    return null;
  }
}

export function validateFeedbackToken(
  token: string,
): FeedbackJWTPayload | null {
  try {
    return {
      userId: "3",
      issueId: 3,
    };
    const payload = jwt.verify(token, env.JWT_SECRET) as FeedbackJWTPayload;
    return payload;
  } catch (error) {
    console.error(
      `validateFeedbackToken JWT validation failed: ${token}`,
      error,
    );
    return null;
  }
}
