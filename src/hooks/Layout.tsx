import React, { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import SignOutButton from "../components/SignOutButton";
import logo from "../assets/CrinzPing.png";

// Import your main page components
import Home from "../pages/home";
import GlobalFeed from "../feed/tabs/GlobalFeed";
import UserPostsFeed from "../feed/tabs/personalizedfeed/PersonalizedFeed";
import ReelsFeed from "../feed/tabs/ReelsFeed";
import CrinzProfile from "../profile/CrinzProfile";
import "../css/Layout.css";

const Layout: React.FC = () => {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isReelsPage = location.pathname === '/feed/reelsfeed' || location.pathname.includes('/reels');

  const handleSignIn = () => {
    localStorage.removeItem("manual_logout");
    auth.signinRedirect();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  const isActiveRoute = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Define main pages
  const mainPages = [
    { path: "/", label: "Home", icon: "💀", component: Home },
    { path: "/feed/crinzmessagesfeed", label: "Global Feed", icon: "🌍", component: GlobalFeed },
    { path: "/feed/personalizedfeed", label: "Personalized Feed", icon: "🎯", component: UserPostsFeed },
    { path: "/feed/reelsfeed", label: "Reels Feed", icon: "🎬", component: ReelsFeed },
    { path: "/profile", label: "Extras", icon: "👻", component: CrinzProfile },
  ];

  // Show hamburger only when authenticated
  const showHamburger = auth.isAuthenticated;
  // Show sidebar menu only when authenticated AND menu is open
  const showSidebarMenu = auth.isAuthenticated && isMenuOpen;

  return (
    <div className="layout-wrapper">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            {/* Show hamburger only when authenticated */}
            {showHamburger ? (
              <button
                className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`}
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </button>
            ) : (
              // Empty div to maintain flex layout when no hamburger
              <div style={{ width: '40px' }}></div>
            )}
          </div>

          <Link to="/" className="header-title">
            <img src={logo} alt="CrinzPing" className="logo-img" />
            <span className="title-text">CrinzPing</span>
          </Link>

          <div className="header-right">
            {auth.isAuthenticated ? (
              <SignOutButton className="auth-button sign-out" />
            ) : (
              <button className="auth-button sign-in" onClick={handleSignIn}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Menu - Only show when authenticated AND menu is open */}
      {showSidebarMenu && (
        <div
          ref={menuRef}
          className={`hamburger-menu ${isMenuOpen ? 'open' : ''}`}
        >
          <div className="menu-header">
            <h3 className="menu-title">Navigation</h3>
            <button
              className="menu-close-btn"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="menu-nav">
            {mainPages.map((item) => (
              <button
                key={item.path}
                className={`menu-item ${isActiveRoute(item.path) ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
                {hoveredItem === item.path && (
                  <div className="menu-tooltip">Go to {item.label}</div>
                )}
              </button>
            ))}
          </nav>

          <div className="menu-footer">
            <div className="user-status">
              <span className="status-dot"></span>
              Signed In
            </div>
          </div>
        </div>
      )}

      <main className={`main-content ${isReelsPage ? 'reels-feed-page' : ''}`}>
        <Outlet />
      </main>

      {/* Menu Overlay - Only show when authenticated and menu is open */}
      {isMenuOpen && auth.isAuthenticated && (
        <div
          className="menu-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;