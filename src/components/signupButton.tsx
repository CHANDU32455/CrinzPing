import React from "react";
import { useAuth } from "react-oidc-context";

const SignUpButton: React.FC = () => {
  const auth = useAuth();

  const styles = {
    button: {
      background: "#000",
      color: "#00FF00",
      border: "1px solid #00FF00",
      padding: "0.5rem 1rem",
      cursor: "pointer",
      borderRadius: "4px",
      fontFamily: "'Fira Code', monospace",
      fontSize: "1rem",
      transition: "all 0.2s ease",
    },
  };

  if (auth.isAuthenticated) return null;

const handleSignup = () => {
  const signupUrl = `${import.meta.env.VITE_COGNITO_DOMAIN}/signup?client_id=${import.meta.env.VITE_COGNITO_CLIENT_ID}&response_type=code&scope=openid+email+phone&redirect_uri=${encodeURIComponent(import.meta.env.VITE_COGNITO_REDIRECT_URI)}&state=${Math.random().toString(36).substring(2)}`;
  window.location.href = signupUrl;
};


  return (
    <button style={styles.button} onClick={handleSignup}>
      Create Account
    </button>
  );
};

export default SignUpButton;
