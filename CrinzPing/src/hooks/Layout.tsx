import React, { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import UserDetailsViewer from "../components/userProfileDropdown";

const Layout: React.FC = () => {
    const [hidden, setHidden] = useState(false);
    const [lastScroll, setLastScroll] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScroll = window.scrollY;
            if (currentScroll > lastScroll && currentScroll > 50) {
                // scrolling down
                setHidden(true);
            } else {
                // scrolling up
                setHidden(false);
            }
            setLastScroll(currentScroll);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScroll]);

    const styles: { [key: string]: React.CSSProperties } = {
        wrapper: {
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            backgroundColor: "#000",
            color: "limegreen",
            fontFamily: "'Fira Code', monospace",
        },
        navbar: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#0a0a0a",
            boxShadow: "0 2px 8px rgba(0, 255, 0, 0.2)",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            transform: hidden ? "translateY(-100%)" : "translateY(0)",
            transition: "transform 0.3s ease-in-out",
            flexWrap: "wrap",
        },
        title: {
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "limegreen",
            letterSpacing: "2px",
            textDecoration: "none",
            cursor: "pointer",
            flex: "1",
            minWidth: "150px",
        },
        rightSection: {
            display: "flex",
            alignItems: "center",
            flex: "0",
            marginTop: "0.5rem",
        },
        content: {
            flex: 1,
            padding: "5rem 1.5rem 1.5rem", // add top padding to avoid content hiding under navbar
        },
    };

    const responsiveCSS = `
        @media (max-width: 768px) {
            header {
                flex-direction: column;
                align-items: flex-start !important;
                padding: 1rem !important;
            }

            header a {
                font-size: 1.2rem !important;
                margin-bottom: 0.5rem;
            }

            .user-profile-dropdown {
                align-self: flex-start;
                margin-top: 0.5rem;
            }
        }

        @media (max-width: 480px) {
            header {
                padding: 0.75rem !important;
            }
            header a {
                font-size: 1rem !important;
            }
        }
    `;

    return (
        <>
            <style>{responsiveCSS}</style>
            <div style={styles.wrapper}>
                <header style={styles.navbar}>
                    <Link to="/" style={styles.title}>
                        CrinzPing 🔥
                    </Link>
                    <div style={styles.rightSection}>
                        <UserDetailsViewer />
                    </div>
                </header>
                <main style={styles.content}>
                    <Outlet />
                </main>
            </div>
        </>
    );
};

export default Layout;
