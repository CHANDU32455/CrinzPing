// Layout.tsx
import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import "../css/Layout.css";

const Layout: React.FC = () => {
  const auth = useAuth();
  const location = useLocation();

  const handleSignOut = () => {
    localStorage.setItem("manual_logout", "true");
    auth.removeUser(); // clear local auth

    // redirect to Cognito logout
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
    const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI;
    const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  const handleSignIn = () => {
    localStorage.removeItem("manual_logout");
    auth.signinRedirect();
  };

  return (
    <div className="layout-wrapper">
      <header className="navbar">
        <Link to="/" className="navbar-title-center">
          CrinzPing 🔥
        </Link>
        <div className="navbar-right">
          {auth.isAuthenticated ? (
            <button className="auth-button sign-out" onClick={handleSignOut}>
              Sign Out
            </button>
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
          <Link to="/" className={`bottom-link ${location.pathname === "/" ? "active" : ""}`}>
            💀 <span>Home</span>
          </Link>
          <Link to="/feed" className={`bottom-link ${location.pathname === "/feed" ? "active" : ""}`}>
            ☠️ <span>Feed</span>
          </Link>
          <Link to="/extras" className={`bottom-link ${location.pathname === "/extras" ? "active" : ""}`}>
            👻 <span>Extras</span>
          </Link>
        </nav>
      )}
    </div>
  );
};

export default Layout;
