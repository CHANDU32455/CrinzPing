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
import React, { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { setAuthData, clearAuthData } from "./useAuthStore";
import { useNavigate } from "react-router-dom";

const MAX_INACTIVITY_DAYS = 5;

const AuthManager: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const attemptedAutoLogin = useRef(false);

  // 1. Sync auth state with localStorage
  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      setAuthData(auth.user as any);
      localStorage.setItem("last_login", Date.now().toString());
      localStorage.removeItem("manual_logout");
    } else {
      clearAuthData();
    }
  }, [auth.isAuthenticated, auth.user]);

  // 2. Auto-login attempt (only once)
  useEffect(() => {
    if (auth.isAuthenticated || auth.isLoading || attemptedAutoLogin.current) return;

    attemptedAutoLogin.current = true;

    const manualLogout = localStorage.getItem("manual_logout") === "true";
    if (manualLogout) return;

    const lastLogin = localStorage.getItem("last_login");
    if (!lastLogin) return;

    const daysInactive =
      (Date.now() - parseInt(lastLogin, 10)) / (1000 * 60 * 60 * 24);

    if (daysInactive <= MAX_INACTIVITY_DAYS) {
      auth
        .signinSilent()
        .then((user) => {
          if (user && user.access_token) {
            console.log("Auto-login successful");
          } else {
            console.warn("Auto-login failed (no valid token)");
            clearAuthData();
            navigate("/");
          }
        })
        .catch((err) => {
          console.error("Auto-login failed:", err);
          clearAuthData();
          navigate("/");
        });
    } else {
      clearAuthData();
    }
  }, [auth.isLoading]);

  return null;
};

export default AuthManager;
