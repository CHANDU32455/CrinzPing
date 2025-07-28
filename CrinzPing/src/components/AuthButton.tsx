import { useAuth } from "react-oidc-context";

export default function AuthButton() {
  const auth = useAuth();
  const buttonStyle = {
    fontFamily: "'Fira Code', monospace",
    padding: "8px 16px",
    backgroundColor: "#111",
    color: "#00ffcc",
    border: "1px solid #00ffcc",
    borderRadius: "4px",
    cursor: "pointer",
  };

  return (
    <div style={{ position: "absolute", top: "20px", right: "20px" }}>
      {auth.isAuthenticated ? (
        <button onClick={() => auth.removeUser()} style={buttonStyle}>Sign out</button>
      ) : (
        <button onClick={() => auth.signinRedirect()} style={buttonStyle}>Sign in</button>
      )}
    </div>
  );
}
