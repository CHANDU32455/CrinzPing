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
import Extras from "../pages/Extras";

import "../css/Layout.css";

// Use localStorage to persist mounted pages across refreshes
const getMountedPages = (): Set<string> => {
  const stored = localStorage.getItem("mountedPages");
  return new Set(stored ? JSON.parse(stored) : ["/"]);
};

const saveMountedPages = (pages: Set<string>) => {
  localStorage.setItem("mountedPages", JSON.stringify([...pages]));
};

const Layout: React.FC = () => {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activePages, setActivePages] = useState<Set<string>>(getMountedPages()); // Start with all mounted pages
  const [mountedPages, setMountedPages] = useState<Set<string>>(getMountedPages());
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Detect screen size for hamburger visibility
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1025);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Track active pages and mark as mounted
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Find if this is a main page
    const mainPage = mainPages.find(page => isActiveRoute(page.path));
    
    if (mainPage) {
      // Mark this page as mounted (persist across refreshes)
      const newMountedPages = new Set(mountedPages);
      newMountedPages.add(mainPage.path);
      setMountedPages(newMountedPages);
      saveMountedPages(newMountedPages);
      
      // On page refresh, keep ALL mounted pages active for instant navigation
      const isPageRefresh = performance.navigation.type === performance.navigation.TYPE_RELOAD || 
                           !sessionStorage.getItem('hasInitialized');
      
      if (isPageRefresh) {
        // Keep all previously mounted pages active for instant switching
        setActivePages(newMountedPages);
        sessionStorage.setItem('hasInitialized', 'true');
      } else {
        // Normal navigation - ensure current page is active
        setActivePages(prev => {
          const newSet = new Set(prev);
          newSet.add(mainPage.path);
          return newSet;
        });
      }

      // Store last visited main page for potential recovery
      if (mainPage.path !== "/") {
        sessionStorage.setItem("lastMainPage", currentPath);
      }
    }
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (path: string) => {
    setIsMenuOpen(false);
    
    // Mark the target page as active immediately
    setActivePages(prev => {
      const newSet = new Set(prev);
      newSet.add(path);
      return newSet;
    });

    // Mark as mounted
    const newMountedPages = new Set(mountedPages);
    newMountedPages.add(path);
    setMountedPages(newMountedPages);
    saveMountedPages(newMountedPages);
    
    // Navigate immediately
    navigate(path);
  };

  const isActiveRoute = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Define main pages that should be kept mounted once visited
  const mainPages = [
    { path: "/", label: "Home", icon: "💀", component: Home },
    { path: "/feed/crinzmessagesfeed", label: "Global Feed", icon: "🌍", component: GlobalFeed },
    { path: "/feed/personalizedfeed", label: "Personalized Feed", icon: "🎯", component: UserPostsFeed },
    { path: "/feed/reelsfeed", label: "Reels Feed", icon: "🎬", component: ReelsFeed },
    { path: "/extras", label: "Extras", icon: "👻", component: Extras },
  ];

  // Check if current route is one of the main pages
  const isMainPage = mainPages.some(page => isActiveRoute(page.path));

  // Show hamburger only when authenticated AND on mobile/tablet
  const showHamburger = auth.isAuthenticated && !isDesktop;
  // Show sidebar menu only when authenticated AND (on desktop OR mobile menu is open)
  const showSidebarMenu = auth.isAuthenticated && (isDesktop || isMenuOpen);

  return (
    <div className="layout-wrapper">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            {/* Show hamburger only when authenticated and on mobile/tablet */}
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

      {/* Sidebar Menu - Only show when authenticated */}
      {showSidebarMenu && (
        <div
          ref={menuRef}
          className={`hamburger-menu ${isMenuOpen || isDesktop ? 'open' : ''} ${isDesktop ? 'desktop' : 'mobile'}`}
        >
          <div className="menu-header">
            <h3 className="menu-title">Navigation</h3>
            {!isDesktop && (
              <button
                className="menu-close-btn"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            )}
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
                {mountedPages.has(item.path) && (
                  <span style={{ 
                    fontSize: "0.6rem", 
                    opacity: 0.7, 
                    marginLeft: "auto",
                    color: "#00ff88",
                    animation: "pulse 2s infinite"
                  }}>
                    ●
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="menu-footer">
            <div className="user-status">
              <span className="status-dot"></span>
              Signed In
            </div>
            <div style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "0.5rem" }}>
              Visited pages: {mountedPages.size}
            </div>
          </div>
        </div>
      )}

      <main className={`main-content ${location.pathname === '/feed/reelsfeed' ? 'reels-feed-page' : ''} ${showSidebarMenu && isDesktop ? 'has-sidebar' : ''}`}>
        {/* Render main pages without remounting - only show visited pages */}
        {isMainPage ? (
          <div className="pages-container">
            {mainPages
              .filter(page => activePages.has(page.path)) // Only render currently active pages
              .map((page) => (
                <div
                  key={page.path}
                  className={`page-content ${isActiveRoute(page.path) ? 'active' : 'hidden'}`}
                >
                  {React.createElement(page.component)}
                </div>
              ))
            }
          </div>
        ) : (
          // For other routes (profile pages, settings, etc.), use normal Outlet
          <Outlet />
        )}
      </main>

      {/* Menu Overlay - Only show when authenticated and on mobile/tablet */}
      {isMenuOpen && auth.isAuthenticated && !isDesktop && (
        <div
          className="menu-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;