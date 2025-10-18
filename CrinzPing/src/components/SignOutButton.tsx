// src/components/SignOutButton.tsx
import React from "react";
import { useAuth } from "react-oidc-context";
import { clearAuthData } from "../utils/useAuthStore";

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const SignOutButton: React.FC<SignOutButtonProps> = ({ className, children }) => {
  const auth = useAuth();
const handleSignOut = () => {
  // clear cached auth data
  clearAuthData();

  // clear sessionStorage for user details and crinz posts
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith("user_details_") || key.startsWith("crinz_posts_")) {
      sessionStorage.removeItem(key);
    }
  });

  // mark manual logout
  localStorage.setItem("manual_logout", "true");

  auth.removeUser();

  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI;
  const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;

  window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
    logoutUri
  )}`;
};

  return (
    /** created that signout css at app.css level */
    <button className={className || "btn-signout"} onClick={handleSignOut}>
      {children || "Sign Out"}
    </button>
  );
};

export default SignOutButton;
