import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import SignUpButton from "./signupButton";

function LoggedOutView() {
  const auth = useAuth();
  const navigate = useNavigate();

  // Add CSS animations safely
  useEffect(() => {
    const styleSheet = document.styleSheets[0];
    if (styleSheet) {
      try {
        styleSheet.insertRule(`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(3deg); }
          }
        `, styleSheet.cssRules.length);

        styleSheet.insertRule(`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
          }
        `, styleSheet.cssRules.length);
      } catch (error) {
        console.warn("Could not insert CSS animations:", error);
      }
    }
  }, []);

  // redirect if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      const returnTo = sessionStorage.getItem("returnTo") || "/";
      sessionStorage.removeItem("returnTo"); // clean up
      navigate(returnTo, { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  // if auth is still initializing or redirecting, optionally return null or a loader
  if (auth.isAuthenticated) return <div style={styles.loading}>🔥 Loading the roast chamber...</div>;

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Main Content Card */}
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.skull}>💀</div>
            <h1 style={styles.heading}>CRINZPING</h1>
            <div style={styles.subtitle}>THE DARK SIDE AWAITS</div>
          </div>

          {/* Warning Banner */}
          <div style={styles.warningBanner}>
            ⚠️ ENTER AT YOUR OWN RISK ⚠️
          </div>

          {/* Description */}
          <div style={styles.description}>
            <p><strong>Tired of being basic?</strong> We got you.</p>
            <p>This ain't your grandma's social media. This is the digital thunderdome where:</p>
            
            <div style={styles.features}>
              <div style={styles.feature}>💀 <strong>Weak memes get executed</strong> at dawn</div>
              <div style={styles.feature}>🧠 <strong>Your IQ drops</strong> 20 points just by scrolling</div>
              <div style={styles.feature}>🔥 <strong>Friendships burn</strong> faster than your toast</div>
              <div style={styles.feature}>😈 <strong>Your ex's new partner</strong> becomes our content</div>
            </div>
          </div>

          {/* Sign Up Section */}
          <div style={styles.signupSection}>
            <h2 style={styles.signupTitle}>SIGN YOUR DIGITAL DEATH WARRANT</h2>
            <p style={styles.signupText}>
              Click below to voluntarily surrender your dignity and become eternal meme fuel
            </p>
            
            <div style={styles.buttonContainer}>
              <SignUpButton />
            </div>
          </div>

          {/* Footer Warnings */}
          <div style={styles.footer}>
            <div style={styles.disclaimer}>
              ⚠️ BY PROCEEDING YOU ACCEPT: Eternal cringe membership • Roast-induced trauma • Your mom seeing your posts
            </div>
            <div style={styles.emergency}>
              🚨 EMERGENCY EXIT: Close this tab now if you value your sanity
            </div>
          </div>
        </div>

        {/* Floating Cringe Elements */}
        <div style={styles.floatingCringe}>"Your coding skills hurt my eyes" 👁️‍🗨️</div>
        <div style={styles.floatingCringe2}>"That haircut deserves its own zip code" 💇‍♂️</div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    fontFamily: "'Fira Code', monospace",
    backgroundColor: "#0a0a0a",
    backgroundImage: `
      radial-gradient(circle at 50% 50%, rgba(255, 0, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(0, 255, 255, 0.1) 0%, transparent 50%)
    `,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3px",
    position: "relative",
    overflow: "hidden",
  },
  loading: {
    color: "#ff00ff",
    textAlign: "center",
    fontSize: "1.5rem",
    textShadow: "0 0 10px #ff00ff",
  },
  container: {
    width: "100%",
    maxWidth: "600px",
    display: "flex",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderRadius: "20px",
    padding: "2rem",
    width: "100%",
    textAlign: "center",
    boxShadow: `
      0 0 30px rgba(255, 0, 255, 0.4),
      0 0 60px rgba(0, 255, 255, 0.2),
      inset 0 0 20px rgba(255, 255, 0, 0.1)
    `,
    border: "2px solid transparent",
    backgroundImage: `
      linear-gradient(black, black),
      linear-gradient(45deg, #ff00ff, #00ffff, #ffff00)
    `,
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
    position: "relative",
  },
  header: {
    marginBottom: "1.5rem",
  },
  skull: {
    fontSize: "3rem",
    marginBottom: "0.5rem",
    filter: "drop-shadow(0 0 10px #ff00ff)",
  },
  heading: {
    fontSize: "2.5rem",
    margin: "0.5rem 0",
    textShadow: `
      0 0 10px #ff00ff,
      0 0 20px #ff00ff,
      2px 2px 0 #00ffff
    `,
    color: "#ffffff",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "3px",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#00ffcc",
    textShadow: "0 0 5px #00ffcc",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  warningBanner: {
    backgroundColor: "rgba(255, 0, 0, 0.2)",
    color: "#ff4444",
    padding: "0.8rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    border: "1px solid #ff4444",
    fontWeight: "bold",
    fontSize: "0.9rem",
    textShadow: "0 0 5px #ff4444",
  },
  description: {
    color: "#00ffcc",
    lineHeight: 1.6,
    marginBottom: "2rem",
    textAlign: "left",
  },
  features: {
    marginTop: "1rem",
  },
  feature: {
    padding: "0.5rem 0",
    borderBottom: "1px solid rgba(0, 255, 204, 0.2)",
    fontSize: "0.95rem",
  },
  signupSection: {
    margin: "2rem 0",
    padding: "1.5rem",
    backgroundColor: "rgba(255, 255, 0, 0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 0, 0.3)",
  },
  signupTitle: {
    fontSize: "1.4rem",
    color: "#ffff00",
    marginBottom: "1rem",
    textShadow: "0 0 8px #ffff00",
    fontWeight: "bold",
  },
  signupText: {
    color: "#00ffcc",
    marginBottom: "1.5rem",
    fontSize: "0.95rem",
  },
  buttonContainer: {
    margin: "1rem 0",
  },
  footer: {
    marginTop: "1.5rem",
  },
  disclaimer: {
    fontSize: "0.75rem",
    color: "#ff4444",
    marginBottom: "1rem",
    lineHeight: 1.4,
    padding: "0.8rem",
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: "6px",
    border: "1px solid rgba(255, 0, 0, 0.3)",
  },
  emergency: {
    fontSize: "0.8rem",
    color: "#ffff00",
    fontWeight: "bold",
    textShadow: "0 0 5px #ffff00",
  },
  floatingCringe: {
    position: "absolute",
    top: "10%",
    right: "5%",
    color: "#ff00ff",
    fontSize: "0.8rem",
    opacity: 0.6,
  },
  floatingCringe2: {
    position: "absolute",
    bottom: "15%",
    left: "5%",
    color: "#00ffff",
    fontSize: "0.8rem",
    opacity: 0.6,
  },
};

export default LoggedOutView;