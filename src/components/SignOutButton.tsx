// src/components/SignOutButton.tsx
import React, { useState } from "react";
import { useAuth } from "react-oidc-context";
import { clearAuthData } from "../utils/useAuthStore";

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const SignOutButton: React.FC<SignOutButtonProps> = ({ className, children }) => {
  const auth = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);

    try {
      // Clear cached auth data
      clearAuthData();

      // Clear sessionStorage for user details and crinz posts
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith("user_details_") || key.startsWith("crinz_posts_")) {
          sessionStorage.removeItem(key);
        }
      });

      // Mark manual logout
      localStorage.setItem("manual_logout", "true");

      // Remove user from auth context
      await auth.removeUser();

      // Give React time to update the UI
      await new Promise(resolve => setTimeout(resolve, 300));

      // Redirect to Cognito logout
      const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
      const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI;
      const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;

      window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
        logoutUri
      )}`;

    } catch (error) {
      console.error("Sign out error:", error);
      setIsSigningOut(false);
      
      // Fallback redirect
      const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
      const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI;
      const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;

      window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
        logoutUri
      )}`;
    }
  };

  return (
    <button 
      className={className || "btn-signout"} 
      onClick={handleSignOut}
      disabled={isSigningOut}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '8px',
        minWidth: '100px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {isSigningOut ? (
        <>
          <div 
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid currentColor',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <span>Signing Out...</span>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </>
      ) : (
        children || "Sign Out"
      )}
    </button>
  );
};

export default SignOutButton;