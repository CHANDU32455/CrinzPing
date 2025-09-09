import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import SignOutButton from "../components/SignOutButton";
import logo from "../assets/CrinzPing.png";
import "../css/Layout.css";

const Layout: React.FC = () => {
  const auth = useAuth();
  const location = useLocation();
  const handleSignIn = () => {
    localStorage.removeItem("manual_logout");
    auth.signinRedirect();
  };

  return (
    <div className="layout-wrapper">
      <header className="navbar">
        <Link to="/" className="navbar-title-center">
          <img
            src={logo}
            alt="Logo"
            style={{
              width: "24px",       // width of logo
              height: "24px",      // height of logo
              marginLeft: "8px",   // spacing from text
              verticalAlign: "middle", // align with text
              borderRadius:"50%",
            }}
          />{" "} CrinzPing
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
            className={`bottom-link ${location.pathname === "/" ? "active" : ""}`}
          >
            💀 <span>Home</span>
          </Link>
          <Link
            to="/feed"
            className={`bottom-link ${location.pathname === "/feed" ? "active" : ""}`}
          >
            ☠️ <span>Feed</span>
          </Link>
          <Link
            to="/extras"
            className={`bottom-link ${location.pathname === "/extras" ? "active" : ""}`}
          >
            👻 <span>Extras</span>
          </Link>
        </nav>
      )}
    </div>
  );
};

export default Layout;
