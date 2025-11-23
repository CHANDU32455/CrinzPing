import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import SignOutButton from "../auth/SignOutButton";
import logo from "../../assets/CrinzPing.png";
import BottomNavbar from "./BottomNavbar";
import "../../styles/layout.css";

const Layout: React.FC = () => {
  const auth = useAuth();
  const location = useLocation();
  const isReelsPage = location.pathname === '/feed/reelsfeed' || location.pathname.includes('/reels');

  const handleSignIn = () => {
    localStorage.removeItem("manual_logout");
    auth.signinRedirect();
  };

  return (
    <div className="layout-wrapper">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            {/* Empty div to maintain flex layout */}
            <div style={{ width: '40px' }}></div>
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

      <main className={`main-content ${isReelsPage ? 'reels-feed-page' : ''}`}>
        <Outlet />
      </main>

      {/* Bottom Navbar - Only show when authenticated */}
      {auth.isAuthenticated && <BottomNavbar />}
    </div>
  );
};

export default Layout;