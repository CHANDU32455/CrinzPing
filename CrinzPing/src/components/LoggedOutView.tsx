import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import SignUpButton from "./signupButton";

function LoggedOutView() {
  const auth = useAuth();
  const navigate = useNavigate();

  // redirect if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      const returnTo = sessionStorage.getItem("returnTo") || "/";
      sessionStorage.removeItem("returnTo"); // clean up
      navigate(returnTo, { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  // if auth is still initializing or redirecting, optionally return null or a loader
  if (auth.isAuthenticated) return <div>Redirecting...</div>;

  return (
    <div style={styles.wrapper}>
      {/* Left Section */}
      <div style={styles.leftSection}>
        <h1 style={styles.heading}>Welcome to CrinzPing 🔥</h1>
        <p style={styles.desc}>
          Wanna roast your friends with savage crinz messages? <br />
          Or maybe drop wild pickup lines to your loved ones? <br />
          Need something crazy to sound effortlessly cool? <br />
          You're at the right place — sign up, roast others, get roasted,  
          and join the madness. Let's gooooo 🚀
        </p>

        <div style={styles.highlights}>
          <p>🎯 Dark humor for developers & meme lovers</p>
          <p>🤝 Roast battles powered by the community</p>
          <p>💡 Share, laugh, and get roasted daily</p>
        </div>
      </div>

      {/* Right Section */}
      <div style={styles.rightSection}>
        <div style={styles.card}>
          <h2 style={styles.subHeading}>Join the Roast Arena</h2>
          <p style={styles.footerText}>Sign in to start roasting (or be roasted)</p>
          <SignUpButton />
          <p style={styles.note}>⚠️ Warning: You may laugh till you cry.</p>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    fontFamily: "'Fira Code', monospace",
    backgroundColor: "#000",
    color: "limegreen",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap", // allows stacking on mobile
  },
  leftSection: {
    flex: 1,
    minWidth: "300px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "3rem",
    color: "#00ffcc",
    textAlign: "left",
  },
  rightSection: {
    flex: 1,
    minWidth: "300px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
    borderLeft: "1px solid rgba(0,255,204,0.2)",
    padding: "2rem",
  },
  card: {
    backgroundColor: "#111",
    borderRadius: "16px",
    padding: "2.5rem",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
    boxShadow: "0 0 20px rgba(0, 255, 0, 0.4)",
    border: "1px solid #00ffcc",
  },
  heading: {
    fontSize: "2.5rem",
    marginBottom: "1.5rem",
    textShadow: "0 0 12px limegreen",
  },
  desc: {
    fontSize: "1.1rem",
    marginBottom: "2rem",
    lineHeight: 1.7,
  },
  highlights: {
    fontSize: "1rem",
    lineHeight: 1.8,
  },
  subHeading: {
    fontSize: "1.6rem",
    marginBottom: "1rem",
    color: "#00ffcc",
  },
  footerText: {
    fontSize: "1rem",
    marginBottom: "1rem",
    color: "#aaa",
    fontStyle: "italic",
  },
  note: {
    marginTop: "1rem",
    fontSize: "0.9rem",
    color: "#888",
    fontStyle: "italic",
  },
};

export default LoggedOutView;
