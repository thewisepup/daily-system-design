import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "~/env.js";

export interface JWTPayload {
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Generates a JWT token for the given payload
 */
export function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, Buffer.from(env.JWT_SECRET), {
    expiresIn: "6h", // 6 hours, matching the current session duration
  });
}

/**
 * Verifies and decodes a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      Buffer.from(env.JWT_SECRET),
    ) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * Hashes a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compares a plain text password with a hashed password
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validates admin credentials against environment variables
 */
export async function validateAdminCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  if (email !== env.ADMIN_EMAIL) {
    return false;
  }

  // In a real application, you would store the hashed password in the env
  // For now, we'll do a direct comparison but this should be improved
  return password === env.ADMIN_PASSWORD;
}

/**
 * Extracts JWT token from Authorization header
 */
export function extractTokenFromHeader(authorization?: string): string | null {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.substring(7); // Remove "Bearer " prefix
}
