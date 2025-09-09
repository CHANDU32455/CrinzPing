{/**
  import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { setAuthData, clearAuthData } from "./useAuthStore";

const MAX_INACTIVITY_DAYS = 5;

const AuthManager: React.FC = () => {
  const auth = useAuth();

  // ⚡ Keep localStorage in sync with real auth state
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id_token && auth.user?.access_token) {
      setAuthData(auth.user as any);
      localStorage.setItem("last_login", Date.now().toString());
      localStorage.removeItem("manual_logout");
    } else {
      clearAuthData();
    }
  }, [auth.isAuthenticated, auth.user]);

  // ⚡ Automatic logout after inactivity
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const lastLogin = localStorage.getItem("last_login");
    if (!lastLogin) return;

    const daysInactive =
      (Date.now() - parseInt(lastLogin, 10)) / (1000 * 60 * 60 * 24);

    if (daysInactive > MAX_INACTIVITY_DAYS) {
      clearAuthData();
      auth.removeUser();
      localStorage.setItem("manual_logout", "true");
      auth.signinRedirect(); // redirect to login
    }
  }, [auth.isAuthenticated]);

  return null;
};

export default AuthManager;


 */}

import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { setAuthData, clearAuthData } from "./useAuthStore";
import { useNavigate } from "react-router-dom";

const MAX_INACTIVITY_DAYS = 5;

const AuthManager: React.FC = () => {
  const auth = useAuth();
  const Navigate = useNavigate();
  // 1. Sync auth state with localStorage
  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      // Save auth data to localStorage
      setAuthData(auth.user as any);
      localStorage.setItem("last_login", Date.now().toString());
      localStorage.removeItem("manual_logout");
    } else {
      // Clear auth data if not authenticated
      clearAuthData();
    }
  }, [auth.isAuthenticated, auth.user]);

  // 2. Check if we should try to auto-login when app loads
  useEffect(() => {
    // If already logged in or still loading, do nothing
    if (auth.isAuthenticated || auth.isLoading) return;
    
    // Check if user manually logged out
    const manualLogout = localStorage.getItem("manual_logout") === "true";
    if (manualLogout) return;
    
    // Check if we have a recent login
    const lastLogin = localStorage.getItem("last_login");
    if (!lastLogin) return;

    const daysInactive = (Date.now() - parseInt(lastLogin, 10)) / (1000 * 60 * 60 * 24);
    
    // If within the 5-day window, try to silently login
    if (daysInactive <= MAX_INACTIVITY_DAYS) {
      auth.signinSilent()
        .then(() => {
          console.log("Auto-login successful");
        })
        .catch(() => {
          console.log("Auto-login failed");
          clearAuthData();
          Navigate("/");
        });
    } else {
      // Session expired beyond 5 days
      clearAuthData();
    }
  }, [auth.isLoading]); // Run when app finishes loading

  return null;
};

export default AuthManager;