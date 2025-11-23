import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Home from '../../pages/home';
import GlobalFeed from '../../pages/GlobalFeed';
import ReelsFeed from '../../pages/ReelsFeed';
import CrinzProfile from '../../pages/CrinzProfile';
import '../../styles/Layout.css'; // We'll add styles here

const BottomNavbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const mainPages = [
        { path: "/", label: "Home", icon: "💀", component: Home },
        { path: "/feed/crinzmessagesfeed", label: "Global", icon: "🌍", component: GlobalFeed },
        { path: "/feed/reelsfeed", label: "Reels", icon: "🎬", component: ReelsFeed },
        { path: "/profile", label: "Extras", icon: "👻", component: CrinzProfile },
    ];

    const isActiveRoute = (path: string) => {
        if (path === "/") {
            return location.pathname === "/";
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="bottom-navbar">
            {mainPages.map((item) => (
                <button
                    key={item.path}
                    className={`nav-item ${isActiveRoute(item.path) ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                    onMouseEnter={() => setHoveredItem(item.path)}
                    onMouseLeave={() => setHoveredItem(null)}
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {hoveredItem === item.path && (
                        <div className="nav-tooltip">{item.label}</div>
                    )}
                </button>
            ))}
        </nav>
    );
};

export default BottomNavbar;
