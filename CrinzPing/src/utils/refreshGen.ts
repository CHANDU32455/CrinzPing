import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { setAuthData, clearAuthData } from "../utils/useAuthStore";

const MAX_INACTIVITY_DAYS = 5;

const AuthManager: React.FC = () => {
  const auth = useAuth();

  // 1️⃣ Silent login for returning user if allowed
  useEffect(() => {
    if (auth.isAuthenticated) return;

    const manualLogout = localStorage.getItem("manual_logout") === "true";
    if (manualLogout) return;

    const lastLogin = localStorage.getItem("last_login");
    if (!lastLogin) return;

    // Check if stored ID token is still valid
    const idToken = localStorage.getItem("id_token");
    const tokenExpired = () => {
      if (!idToken) return true;
      try {
        const payload = JSON.parse(atob(idToken.split(".")[1]));
        return Date.now() / 1000 > payload.exp;
      } catch {
        return true;
      }
    };

    if (tokenExpired()) return; // skip silent login if token expired

    auth.signinSilent()
      .then((user) => {
        if (user?.id_token && user?.access_token) {
          setAuthData(user as any);
          console.log("Silent login successful");
        }
      })
      .catch(() => {
        console.log("Silent login failed, manual login required");
      });
  }, [auth.isAuthenticated]);

  // 2️⃣ Inactivity logout + token storage
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const lastLogin = localStorage.getItem("last_login");
    if (lastLogin) {
      const daysInactive = (Date.now() - parseInt(lastLogin, 10)) / (1000 * 60 * 60 * 24);
      if (daysInactive > MAX_INACTIVITY_DAYS) {
        clearAuthData();
        auth.removeUser();
        localStorage.removeItem("last_login");
        localStorage.setItem("manual_logout", "true");
        auth.signinRedirect(); // redirect to login after inactivity
        return;
      }
    }

    // Update last_login & store latest auth tokens
    localStorage.setItem("last_login", Date.now().toString());
    if (auth.user?.id_token && auth.user?.access_token) {
      setAuthData(auth.user as any);
      localStorage.setItem("id_token", auth.user.id_token); // store for silent login check
    }
  }, [auth.isAuthenticated, auth.user]);

  return null;
};

export default AuthManager;
