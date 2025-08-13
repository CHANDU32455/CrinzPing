import React, { useState, useEffect } from "react";
import { useUserDetails } from "../hooks/UserInfo";
import { useAuth } from "react-oidc-context";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../css/Extras.css";

const Extras: React.FC = () => {
  const auth = useAuth();
  const { userDetails, error, refreshUserDetails } = useUserDetails();
  const location = useLocation();
  const navigate = useNavigate();

  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [signOutHovered, setSignOutHovered] = useState(false);

  useEffect(() => {
    if (location.state?.refreshUser) {
      console.log("Refreshing user details with fresh data...");
      refreshUserDetails();
      // clear refresh flag so it doesn't keep refreshing on re-renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, refreshUserDetails, navigate, location.pathname]);

  if (!auth.isAuthenticated) {
    return (
      <div className="extras-container">
        <div className="extras-card">
          <button
            onClick={() => auth.signinRedirect()}
            className="extras-signin-btn"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="extras-container">
      <div className="extras-card">
        {error && (
          <>
            <div className="extras-error">{error}</div>
            <Link
              to="/postUserDetails"
              className="extras-link"
              onMouseEnter={() => setHoveredLink("update")}
              onMouseLeave={() => setHoveredLink(null)}
            >
              Update Profile Now
              <span
                className={`underline ${hoveredLink === "update" ? "active" : ""}`}
              />
            </Link>
          </>
        )}

        {!error && userDetails && (
          <>
            <div className="extras-header">
              <h2>Welcome, {userDetails.displayName} 👋</h2>
              <p>{userDetails.email}</p>
            </div>

            <div className="extras-links">
              <Link
                to="/postUserDetails"
                className="extras-link"
                state={{ userDetails, refreshUser: true }}
                onMouseEnter={() => setHoveredLink("edit")}
                onMouseLeave={() => setHoveredLink(null)}
              >
                Edit Profile
                <span
                  className={`underline ${hoveredLink === "edit" ? "active" : ""}`}
                />
              </Link>

              <Link
                to="/contributeCrinz"
                className="extras-link"
                state={{ userDetails }}
                onMouseEnter={() => setHoveredLink("contrib")}
                onMouseLeave={() => setHoveredLink(null)}
              >
                Contribute Crinz
                <span
                  className={`underline ${hoveredLink === "contrib" ? "active" : ""}`}
                />
              </Link>

              <Link
                to="/about"
                className="extras-link about"
                onMouseEnter={() => setHoveredLink("about")}
                onMouseLeave={() => setHoveredLink(null)}
              >
                About
                <span
                  className={`underline about ${hoveredLink === "about" ? "active" : ""}`}
                />
              </Link>
            </div>

            <button
              onMouseEnter={() => setSignOutHovered(true)}
              onMouseLeave={() => setSignOutHovered(false)}
              onClick={() => {
                auth.removeUser();
                sessionStorage.removeItem("user_details");
                sessionStorage.removeItem("user_details_token");
              }}
              className={`extras-signout-btn ${signOutHovered ? "hovered" : ""}`}
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Extras;
