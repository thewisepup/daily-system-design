/**
 * Server-side admin authentication utilities
 */

/**
 * Verifies admin credentials against environment variables
 */
export function verifyAdminCredentials(
  email: string,
  password: string,
): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("Admin credentials not configured in environment variables");
    return false;
  }

  return email === adminEmail && password === adminPassword;
}

/**
 * Extracts admin credentials from request headers
 * Expects Authorization header in format: "Bearer email:password" (base64 encoded)
 */
export function extractCredentialsFromHeaders(headers: Headers): {
  email?: string;
  password?: string;
} {
  try {
    const authHeader = headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return {};
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email, password] = decoded.split(":");

    return { email, password };
  } catch (error) {
    console.error("Failed to extract credentials from headers:", error);
    return {};
  }
}

/**
 * Creates a base64 encoded token from email and password
 */
export function createAuthToken(email: string, password: string): string {
  return Buffer.from(`${email}:${password}`).toString("base64");
}
