/**
 * Client-side admin authentication utilities - JWT-based
 */

interface AdminAuthData {
  token: string;
  email: string;
  loginTime: number;
}

const AUTH_KEY = 'admin_auth';
const SESSION_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

/**
 * Checks if the current user is admin (client-side)
 */
export function isAdmin(): boolean {
  try {
    const authData = getStoredAuthData();
    if (!authData) {
      return false;
    }

    // Check if session has expired (6 hours)
    const currentTime = Date.now();
    if (currentTime - authData.loginTime > SESSION_DURATION) {
      clearAdminAuth();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Gets the current admin auth data
 */
export function getAdminAuth(): { email?: string; token?: string } {
  const authData = getStoredAuthData();
  if (!authData) {
    return {};
  }

  return {
    email: authData.email,
    token: authData.token
  };
}

/**
 * Stores admin auth token in session storage with timestamp
 */
export function setAdminAuth(email: string, token: string): void {
  const authData: AdminAuthData = {
    email,
    token,
    loginTime: Date.now()
  };
  
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(authData));
}

/**
 * Clears admin authentication
 */
export function clearAdminAuth(): void {
  sessionStorage.removeItem(AUTH_KEY);
}

/**
 * Creates authorization header for API requests
 */
export function getAuthHeader(): string | null {
  const authData = getStoredAuthData();
  if (!authData?.token) {
    return null;
  }

  // Return JWT token directly
  return `Bearer ${authData.token}`;
}

/**
 * Gets stored auth data from session storage
 */
function getStoredAuthData(): AdminAuthData | null {
  try {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    const stored = sessionStorage.getItem(AUTH_KEY);
    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as AdminAuthData;
  } catch (error) {
    console.error('Error getting stored auth data:', error);
    return null;
  }
}
