import jwt from "jsonwebtoken";
import { env } from "~/env.js";

export interface UnsubscribeTokenPayload {
  userId: string;
  type: "unsubscribe";
  iat?: number;
  exp?: number;
}

/**
 * Generates an unsubscribe JWT token with 6-month expiration
 */
export function generateUnsubscribeToken(userId: string): string {
  const payload: Omit<UnsubscribeTokenPayload, "iat" | "exp"> = {
    userId,
    type: "unsubscribe",
  };

  return jwt.sign(payload, Buffer.from(env.JWT_SECRET), {
    expiresIn: "90d", // 3 months
  });
}

/**
 * Validates and decodes an unsubscribe JWT token
 */
export function validateUnsubscribeToken(
  token: string,
): { userId: string } | null {
  try {
    const decoded = jwt.verify(
      token,
      Buffer.from(env.JWT_SECRET),
    ) as UnsubscribeTokenPayload;

    // Validate token type
    if (decoded.type !== "unsubscribe") {
      console.error("Invalid token type:", decoded.type);
      return null;
    }

    return {
      userId: decoded.userId,
    };
  } catch (error) {
    console.error("Unsubscribe token validation failed:", error);
    return null;
  }
}

/**
 * Generates the one-click unsubscribe URL for List-Unsubscribe header
 * This leads directly to instant unsubscribe processing
 */
export function generateOneClickUnsubscribeUrl(userId: string): string {
  const token = generateUnsubscribeToken(userId);
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  return `${baseUrl}/api/unsubscribe/${encodeURIComponent(token)}`;
}

/**
 * Generates the unsubscribe page URL for footer links
 * This leads to a confirmation page before processing
 */
export function generateUnsubscribePageUrl(userId: string): string {
  const token = generateUnsubscribeToken(userId);
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  return `${baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
}
