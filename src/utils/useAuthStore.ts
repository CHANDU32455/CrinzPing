export type AuthData = {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  refresh_token_expires_at?: number;
  token_type?: string;
  scope?: string;
  expires_at?: number;
  profile: {
    sub: string;
    email: string;
    email_verified?: boolean;
    cognito_username?: string;
    token_use?: string;
    aud?: string;
    iat?: number;
    iss?: string;
  };
};

let authObject: AuthData | null = null;

// Store refresh token expiry for 5 days
const REFRESH_TOKEN_EXPIRY_DAYS = 5;

// Track if we've already logged the initial auth success
let initialAuthLogged = false;

export const setAuthData = (auth: AuthData, isInitialAuth: boolean = false) => {
  // Validate auth data before setting
  if (!auth.id_token || !auth.access_token || !auth.profile?.sub) {
    console.error("Auth: Invalid auth data provided");
    throw new Error("Invalid authentication data");
  }

  // Check if we're actually setting new data vs refreshing existing
  const existingSub = localStorage.getItem("sub");
  const isNewAuth = existingSub !== auth.profile.sub;

  // Calculate refresh token expiry (5 days from now)
  const refreshTokenExpiry = Date.now() + (REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  authObject = {
    ...auth,
    refresh_token_expires_at: refreshTokenExpiry,
    profile: { ...auth.profile }
  };

  try {
    localStorage.setItem("id_token", auth.id_token);
    localStorage.setItem("access_token", auth.access_token);
    localStorage.setItem("email", auth.profile.email);
    localStorage.setItem("sub", auth.profile.sub);
    localStorage.setItem("refresh_token_expires_at", refreshTokenExpiry.toString());
    localStorage.setItem("last_login", Date.now().toString());
    localStorage.removeItem("auth_error");
    localStorage.removeItem("manual_logout");

    // Only log for new authentications or initial setup
    if (isNewAuth || (isInitialAuth && !initialAuthLogged)) {
      console.log("Auth: Data stored successfully");
      initialAuthLogged = true;
    }
    // Otherwise, silent update - no console log
  } catch (e) {
    console.error("Auth: Failed to save auth data locally", e);
    throw e;
  }
};

export const getAuthItem = (
  key: keyof AuthData | keyof AuthData["profile"]
) => {
  if (!authObject) {
    // Try to recover from localStorage if possible
    const value = localStorage.getItem(key as string);
    return value;
  }
  return (authObject as any)[key] ?? (authObject.profile as any)[key];
};

export const clearAuthData = () => {
  authObject = null;

  // Only clear essential auth tokens, keep user preferences
  const itemsToRemove = [
    "id_token",
    "access_token",
    "refresh_token_expires_at",
    "last_login",
    "auth_error",
    "manual_logout"
  ];

  itemsToRemove.forEach(item => localStorage.removeItem(item));

  console.log("Auth: Essential auth data cleared");
};

// Check if refresh token is still valid (within 5 days)
export const isRefreshTokenValid = (): boolean => {
  const refreshTokenExpiry = localStorage.getItem("refresh_token_expires_at");
  const sub = localStorage.getItem("sub");

  if (!refreshTokenExpiry || !sub) {
    return false;
  }

  // Check if refresh token is still valid
  const now = Date.now();
  const isValid = parseInt(refreshTokenExpiry, 10) > now;

  console.log(`Auth: Refresh token valid: ${isValid}`);
  return isValid;
};

// Check if we should attempt silent login
export const shouldAttemptSilentLogin = (): boolean => {
  // Don't attempt if user manually logged out
  if (localStorage.getItem("manual_logout") === "true") {
    console.log("Auth: Manual logout detected, skipping silent login");
    return false;
  }

  // Don't attempt if we have critical auth errors
  const recentAuthError = localStorage.getItem("auth_error");
  if (recentAuthError && recentAuthError !== "state_mismatch") {
    console.log("Auth: Critical auth error detected, skipping silent login");
    return false;
  }

  return isRefreshTokenValid();
};

// Get user auth state for UI
export const getUserAuthState = () => {
  const isAuthenticated = !!localStorage.getItem("access_token");
  const hasRefreshToken = isRefreshTokenValid();

  return {
    isAuthenticated,
    hasRefreshToken,
    shouldSilentLogin: shouldAttemptSilentLogin()
  };
};