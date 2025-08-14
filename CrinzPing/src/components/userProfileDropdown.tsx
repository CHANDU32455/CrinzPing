import React, { useState, useRef, useEffect } from "react";
import { useUserDetails } from "../hooks/UserInfo";
import { useAuth } from "react-oidc-context";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuthData } from "../utils/useAuthStore";

const UserDetailsViewer: React.FC = () => {
  const auth = useAuth();
  const { userDetails, error, refreshUserDetails } = useUserDetails();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [contribHovered, setContribHovered] = useState(false);
  const [aboutHovered, setAboutHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [signOutHovered, setSignOutHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.refreshUser) {
      refreshUserDetails();
    }
  }, [location.state]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const truncateId = (id: string) => {
    if (windowWidth > 600) return id;
    if (id.length <= 10) return id;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  };

  const styles = {
    container: {
      position: "absolute" as const,
      top: "1rem",
      right: "1rem",
      zIndex: 1000,
      fontFamily: "'Fira Code', monospace",
      textAlign: "right" as const,
    },
    toggle: {
      background: "#000",
      color: "#00FF00",
      border: "1px solid #00FF00",
      padding: "0.5rem 1rem",
      cursor: "pointer",
      borderRadius: "4px",
      maxWidth: "200px",
      overflow: "hidden",
      whiteSpace: "nowrap" as const,
      textOverflow: "ellipsis",
      transition: "all 0.2s ease",
    },
    panel: {
      marginTop: "0.5rem",
      backgroundColor: "#0a0a0a",
      boxShadow: "0 0 8px limegreen",
      borderRadius: "6px",
      padding: "1rem",
      color: "limegreen",
      minWidth: "250px",
      fontSize: "0.95rem",
    },
    stat: { marginBottom: "0.5rem" },
    button: {
      fontFamily: "'Fira Code', monospace",
      padding: "8px 16px",
      backgroundColor: signOutHovered ? "#330000" : "#111",
      color: signOutHovered ? "#ff4d4d" : "#00ffcc",
      border: signOutHovered ? "1px solid #ff4d4d" : "1px solid #00ffcc",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      width: "100%",
      marginTop: "0.5rem",
    },
    error: { color: "red", fontSize: "0.85rem" },
  };

  const linkStyles = {
    display: "inline-block",
    position: "relative" as const,
    color: "#00ffcc",
    textDecoration: "none",
    fontFamily: "'Fira Code', monospace",
    marginTop: "1rem",
    fontSize: "0.9rem",
    cursor: "pointer",
  };

  const underlineStyle = (hover: boolean) => ({
    position: "absolute" as const,
    bottom: -2,
    left: 0,
    height: "2px",
    width: "100%",
    backgroundColor: "#00ffcc",
    transform: hover ? "scaleX(1)" : "scaleX(0)",
    transformOrigin: "left",
    transition: "transform 0.3s ease",
  });

  const aboutLinkStyles = {
    ...linkStyles,
    color: "#888",
    fontStyle: "italic",
  };

  const aboutUnderline = (hover: boolean) => ({
    position: "absolute" as const,
    bottom: -2,
    left: 0,
    height: "2px",
    width: "100%",
    backgroundColor: "#888",
    transform: hover ? "scaleX(1)" : "scaleX(0)",
    transformOrigin: "left",
    transition: "transform 0.3s ease",
  });

  return (
    <div ref={containerRef} style={styles.container}>
      {!auth.isAuthenticated ? (
        <button
          onClick={() => {
            localStorage.removeItem("manual_logout"); // allow silent login later
            auth.signinRedirect(); // Cognito login
          }}
          style={styles.toggle}
        >
          Sign In
        </button>
      ) : (
        <>
          <button style={styles.toggle} onClick={() => setOpen((prev) => !prev)}>
            {userDetails?.userId ? truncateId(userDetails.userId) : "User Info"}
          </button>

          {open && (
            <div style={styles.panel}>
              {error && <div style={styles.error}>{error}</div>}
              {!error && userDetails && (
                <>
                  <div style={styles.stat}>Hello! {userDetails.displayName}</div>
                  <div style={styles.stat}>{userDetails.email}</div>

                  <Link
                    to="/postUserDetails"
                    style={linkStyles}
                    state={{ userDetails, refreshUser: true }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                  >
                    Edit Profile
                    <span style={underlineStyle(hovered)} />
                  </Link>
                  <br />

                  <Link
                    to="/contributeCrinz"
                    style={linkStyles}
                    state={{ userDetails }}
                    onMouseEnter={() => setContribHovered(true)}
                    onMouseLeave={() => setContribHovered(false)}
                  >
                    Contribute Crinz
                    <span style={underlineStyle(contribHovered)} />
                  </Link>
                  <br />

                  <Link
                    to="/about"
                    style={aboutLinkStyles}
                    onMouseEnter={() => setAboutHovered(true)}
                    onMouseLeave={() => setAboutHovered(false)}
                  >
                    About
                    <span style={aboutUnderline(aboutHovered)} />
                  </Link>

                  <div>
                    <br />
                    <button
                      onMouseEnter={() => setSignOutHovered(true)}
                      onMouseLeave={() => setSignOutHovered(false)}
                      onClick={() => {
                        localStorage.setItem("manual_logout", "true"); // prevent silent login
                        clearAuthData(); // clear local auth store
                        auth.removeUser(); // remove Cognito session
                        navigate("/"); // redirect home
                      }}
                      style={styles.button}
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserDetailsViewer;
