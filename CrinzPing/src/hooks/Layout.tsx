import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import "../css/Layout.css";

const Layout: React.FC = () => {
    const [hidden, setHidden] = useState(false);
    const [lastScroll, setLastScroll] = useState(0);
    const location = useLocation();
    const auth = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            const currentScroll = window.scrollY;
            if (currentScroll > lastScroll && currentScroll > 50) {
                setHidden(true); 
            } else {
                setHidden(false); 
            }
            setLastScroll(currentScroll);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScroll]);

    return (
        <div className="layout-wrapper">
            {/* Top Navbar */}
            <header className={`navbar ${hidden ? "hidden" : ""}`}>
                <Link to="/" className="navbar-title-center">
                    CrinzPing 🔥
                </Link>
                <div className="navbar-right">
                    {auth.isAuthenticated ? (
                        <button
                            className="auth-button sign-out"
                            onClick={() => auth.signoutRedirect()}
                        >
                            Sign Out
                        </button>
                    ) : (
                        <button
                            className="auth-button sign-in"
                            onClick={() => auth.signinRedirect()}
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </header>

            {/* Main content */}
            <main className="content">
                <Outlet />
            </main>

            {/* Bottom navbar (only visible if authenticated) */}
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
