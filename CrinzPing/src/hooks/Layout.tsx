import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { clearAuthData } from "../utils/useAuthStore";
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
            <header className={`navbar ${hidden ? "hidden" : ""}`}>
                <Link to="/" className="navbar-title-center">
                    CrinzPing 🔥
                </Link>
                <div className="navbar-right">
                    {auth.isAuthenticated ? (
                        <button
                            className="auth-button sign-out"
                            onClick={async () => {
                                // clear local auth
                                clearAuthData();
                                localStorage.setItem("manual_logout", "true");

                                // check if token exists and is valid
                                const idToken = auth.user?.id_token;
                                const isTokenValid = () => {
                                    if (!idToken) return false;
                                    try {
                                        const payload = JSON.parse(atob(idToken.split(".")[1]));
                                        return Date.now() / 1000 < payload.exp;
                                    } catch {
                                        return false;
                                    }
                                };

                                if (isTokenValid()) {
                                    try {
                                        // redirect to Cognito logout
                                        await auth.signoutRedirect();
                                    } catch (err) {
                                        console.warn("Cognito logout failed, redirecting locally", err);
                                        window.location.href = "/"; // fallback
                                    }
                                } else {
                                    console.log("ID token expired or missing, redirecting locally");
                                    window.location.href = "/"; // fallback
                                }
                            }}
                        >
                            Sign Out
                        </button>
                    ) : (
                        <button
                            className="auth-button sign-in"
                            onClick={() => {
                                localStorage.removeItem("manual_logout"); // allow silent login again
                                auth.signinRedirect();                     // full login
                            }}
                        >
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
