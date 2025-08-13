import React from "react";
import { useAuth } from "react-oidc-context";

const RefreshGen: React.FC = () => {
  const auth = useAuth();

  React.useEffect(() => {
    if (auth.isAuthenticated) {
      const expiresAt = auth.user?.expires_at; // seconds
      const now = Math.floor(Date.now() / 1000);
      const expiresInMs = expiresAt ? (expiresAt - now) * 1000 : 0;

      if (expiresInMs > 60000) {
        const timeout = setTimeout(() => {
          auth.signinSilent().catch(console.error);
        }, expiresInMs - 60000); // renew 1 min before expiry

        return () => clearTimeout(timeout);
      }
    }
  }, [auth]);

  return null;
};

export default RefreshGen;
