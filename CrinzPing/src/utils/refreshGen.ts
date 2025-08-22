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
