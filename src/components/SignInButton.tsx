import React from "react";
import { useAuth } from "react-oidc-context";

const SignInButton: React.FC = () => {
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

  return (
    <button style={styles.button} onClick={() => auth.signinRedirect()}>
      Sign In
    </button>
  );
};

export default SignInButton;
