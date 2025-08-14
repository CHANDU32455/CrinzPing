import React, { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { setAuthData, clearAuthData } from "../utils/useAuthStore";

const MAX_INACTIVITY_DAYS = 7;

const AuthManager: React.FC = () => {
  const auth = useAuth();
  const refreshTimeout = useRef<number | null>(null);

  // 1️⃣ Silent login if returning user (not manual logout)
  useEffect(() => {
    if (auth.isAuthenticated) return;

    const manualLogout = localStorage.getItem("manual_logout") === "true";
    if (manualLogout) return;

    const lastLogin = localStorage.getItem("last_login");
    if (!lastLogin) return;

    const trySilentLogin = async () => {
      try {
        const silentUser = await auth.signinSilent();
        if (silentUser?.id_token && silentUser?.access_token) {
          setAuthData(silentUser as any);
          console.log("Silent login successful");
        }
      } catch {
        console.log("Silent login failed, user needs manual sign-in");
      }
    };

    trySilentLogin();
  }, [auth.isAuthenticated]);

  // 2️⃣ Token refresh + inactivity check
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    // Check inactivity
    const lastLogin = localStorage.getItem("last_login");
    if (lastLogin) {
      const daysInactive =
        (Date.now() - parseInt(lastLogin)) / (1000 * 60 * 60 * 24);
      if (daysInactive > MAX_INACTIVITY_DAYS) {
        auth.removeUser();
        clearAuthData();
        localStorage.removeItem("last_login");
        localStorage.setItem("manual_logout", "true");
        auth.signinRedirect();
        return;
      }
    }

    // Clear previous timeout
    if (refreshTimeout.current) clearTimeout(refreshTimeout.current);

    // Schedule silent refresh 1 min before token expiry
    const expiresAt = auth.user?.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const refreshInMs = (expiresAt - now - 60) * 1000;

      if (refreshInMs > 0) {
        refreshTimeout.current = window.setTimeout(async () => {
          try {
            const refreshed = await auth.signinSilent();
            if (refreshed?.id_token && refreshed?.access_token) {
              setAuthData(refreshed as any);
              console.log("Token refreshed successfully");
            }
          } catch (err) {
            console.error("Silent refresh failed", err);
          }
        }, refreshInMs);
      }
    }

    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, [auth.isAuthenticated, auth.user?.expires_at]);

  // 3️⃣ Update last_login & auth store whenever authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      localStorage.setItem("last_login", Date.now().toString());
      if (auth.user?.id_token && auth.user?.access_token) {
        setAuthData(auth.user as any);
      }
    }
  }, [auth.isAuthenticated]);

  return null;
};

export default AuthManager;
