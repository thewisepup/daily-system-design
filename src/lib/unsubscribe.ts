import jwt from "jsonwebtoken";
import { env } from "~/env.js";

export interface UnsubscribeTokenPayload {
  userId: string;
  email: string;
  type: "unsubscribe";
  iat?: number;
  exp?: number;
}

/**
 * Generates an unsubscribe JWT token with 6-month expiration
 */
export function generateUnsubscribeToken(
  userId: string,
  email: string,
): string {
  const payload: Omit<UnsubscribeTokenPayload, "iat" | "exp"> = {
    userId,
    email,
    type: "unsubscribe",
  };

  return jwt.sign(payload, Buffer.from(env.JWT_SECRET), {
    expiresIn: "6M", // 6 months - long-term expiration
  });
}

/**
 * Validates and decodes an unsubscribe JWT token
 */
export function validateUnsubscribeToken(
  token: string,
): { userId: string; email: string } | null {
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
      email: decoded.email,
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
export function generateOneClickUnsubscribeUrl(
  userId: string,
  email: string,
): string {
  const token = generateUnsubscribeToken(userId, email);
  const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return `${baseUrl}/api/trpc/emailSubscription.oneClickUnsubscribe?input=${encodeURIComponent(
    JSON.stringify({ json: { token } }),
  )}`;
}

/**
 * Generates the unsubscribe page URL for footer links
 * This leads to a confirmation page before processing
 */
export function generateUnsubscribePageUrl(
  userId: string,
  email: string,
): string {
  const token = generateUnsubscribeToken(userId, email);
  const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return `${baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
}
