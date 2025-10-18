import React, { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import SignOutButton from "../components/SignOutButton";
import logo from "../assets/CrinzPing.png";
import "../css/Layout.css";

const Layout: React.FC = () => {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showFeedDropdown, setShowFeedDropdown] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignIn = () => {
    localStorage.removeItem("manual_logout");
    auth.signinRedirect();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFeedDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFeedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowFeedDropdown(!showFeedDropdown);
  };

  const handleFeedOptionClick = (path: string) => {
    setShowFeedDropdown(false);
    navigate(path);
  };

  const isFeedActive = location.pathname.startsWith("/feed/");

  return (
    <div className="layout-wrapper">
      <header className="navbar">
        <Link to="/" className="navbar-title-center">
          <img
            src={logo}
            alt="Logo"
            className="logo-img"
          />{" "}
          CrinzPing
        </Link>
        <div className="navbar-right">
          {auth.isAuthenticated ? (
            <SignOutButton className="auth-button sign-out" />
          ) : (
            <button className="auth-button sign-in" onClick={handleSignIn}>
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>

      {auth.isAuthenticated && (
        <nav className="bottom-navbar">
          <Link
            to="/"
            className={`nav-icon ${location.pathname === "/" ? "active" : ""}`}
            onMouseEnter={() => setHoveredIcon("home")}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <div className="icon-wrapper">
              <span className="icon">💀</span>
              {hoveredIcon === "home" && <div className="icon-tooltip">Home</div>}
            </div>
          </Link>

          {/* Feed with Dropdown */}
          <div className="feed-dropdown-container" ref={dropdownRef}>
            <button
              className={`nav-icon feed-trigger ${isFeedActive ? "active" : ""}`}
              onClick={handleFeedClick}
              onMouseEnter={() => setHoveredIcon("feed")}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <div className="icon-wrapper">
                <span className="icon">☠️</span>
                {hoveredIcon === "feed" && <div className="icon-tooltip">Feed</div>}
                {showFeedDropdown && <div className="pulse-dot"></div>}
              </div>
            </button>

            {showFeedDropdown && (
              <div className="feed-dropdown">
                <button
                  className={`feed-option ${location.pathname === "/feed/crinzmessagesfeed" ? "active" : ""}`}
                  onClick={() => handleFeedOptionClick("/feed/crinzmessagesfeed")}
                >
                  <span className="feed-icon">🌍</span>
                </button>
                <button
                  className={`feed-option ${location.pathname === "/feed/personalizedfeed" ? "active" : ""}`}
                  onClick={() => handleFeedOptionClick("/feed/personalizedfeed")}
                >
                  <span className="feed-icon">🎯</span>
                </button>
                <button
                  className={`feed-option ${location.pathname === "/feed/reelsfeed" ? "active" : ""}`}
                  onClick={() => handleFeedOptionClick("/feed/reelsfeed")}
                >
                  <span className="feed-icon">🎬</span>
                </button>
              </div>
            )}
          </div>

          <Link
            to="/extras"
            className={`nav-icon ${location.pathname === "/extras" ? "active" : ""}`}
            onMouseEnter={() => setHoveredIcon("extras")}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <div className="icon-wrapper">
              <span className="icon">👻</span>
              {hoveredIcon === "extras" && <div className="icon-tooltip">Extras</div>}
            </div>
          </Link>
        </nav>
      )}
    </div>
  );
};

export default Layout;