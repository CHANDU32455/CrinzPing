import React, { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { setAuthData, clearAuthData, shouldAttemptSilentLogin } from "./useAuthStore";
import { type AuthData } from "./useAuthStore";
import { useNavigate } from "react-router-dom";

const AuthManager: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const silentLoginAttempted = useRef(false);
  const isProcessingCallback = useRef(false);
  const authSyncCompleted = useRef(false); // Track if we've already synced

  // Check if we're in an OAuth callback flow
  useEffect(() => {
    const isCallback = window.location.pathname.includes("/auth/callback") ||
      window.location.search.includes("code=") ||
      window.location.search.includes("error=");

    if (isCallback) {
      isProcessingCallback.current = true;
    }
  }, []);

  // 1. Handle authentication errors gracefully
  useEffect(() => {
    if (auth.error) {
      const errorMessage = auth.error.message;

      // Handle non-critical errors that don't require clearing data
      if (errorMessage.includes("No matching state found in storage") ||
        errorMessage.includes("state_mismatch")) {

        if (isProcessingCallback.current) {
          navigate("/", { replace: true });
        }
        return;
      }

      // Only clear data for critical authentication failures
      if (errorMessage.includes("login_required") ||
        errorMessage.includes("interaction_required")) {
        // Don't clear data immediately, let silent login handle it
      }
    }
  }, [auth.error, navigate]);

  // 2. Sync auth state when user successfully authenticates - ONLY ONCE
  useEffect(() => {
    // Skip if already processed or not authenticated
    if (authSyncCompleted.current || !auth.isAuthenticated || !auth.user) {
      return;
    }

    // Check if this is a fresh authentication vs page refresh
    const hasExistingAuth = localStorage.getItem("access_token");
    const isFreshAuth = !hasExistingAuth || isProcessingCallback.current;

    try {
      // Pass isInitialAuth flag to control logging
      setAuthData(auth.user as unknown as AuthData, isFreshAuth);
      isProcessingCallback.current = false;
      silentLoginAttempted.current = false;
      authSyncCompleted.current = true; // Mark as completed

      if (isFreshAuth) {
        // Handle new user registration
        if (window.location.pathname.includes("/auth/callback")) {
          // Callback handling logic
        }
      }
      // No log for page refreshes - silent success
    } catch {
      // Ignore errors
    }
  }, [auth.isAuthenticated, auth.user]);

  // 3. MAIN LOGIC: Silent login using refresh token (5 days)
  useEffect(() => {
    // Skip if already authenticated, loading, or attempted
    if (auth.isAuthenticated || auth.isLoading || silentLoginAttempted.current) {
      return;
    }

    // Skip during callback processing
    if (isProcessingCallback.current) {
      return;
    }

    // Check if we should attempt silent login
    if (!shouldAttemptSilentLogin()) {
      return;
    }

    silentLoginAttempted.current = true;

    auth.signinSilent()
      .then((user) => {
        if (user && user.access_token) {
          localStorage.removeItem("auth_error");
          localStorage.setItem("last_login", Date.now().toString());
          authSyncCompleted.current = false; // Reset for new auth data
        }
      })
      .catch((err) => {
        // Don't clear data for non-critical errors
        if (err.message.includes("No matching state") ||
          err.message.includes("state_mismatch")) {
          silentLoginAttempted.current = false; // Allow retry
          return;
        }

        // Only clear data if refresh token is truly expired
        if (err.message.includes("invalid_grant") ||
          err.message.includes("refresh_token expired")) {
          clearAuthData();
        }
      });
  }, [auth, auth.isLoading, auth.isAuthenticated]);

  // 4. Handle URL parameters and redirects
  useEffect(() => {
    // Check URL parameters for auth errors
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
      if (error === 'invalid_grant') {
        localStorage.setItem('auth_error', 'invalid_grant');
        // Clean URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    }

    // Handle returnTo redirect after successful authentication
    const returnTo = sessionStorage.getItem('returnTo');
    if (auth.isAuthenticated && returnTo && !authSyncCompleted.current) {
      sessionStorage.removeItem('returnTo');
      navigate(returnTo, { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  return null;
};

export default AuthManager;