import React, { useState, useRef, useEffect } from "react";
import './css/FeedSwitcher.css';

interface FeedSwitcherProps {
  currentFeed: string;
  onFeedChange: (feedType: string) => void;
  loading?: boolean;
}

const FeedSwitcher: React.FC<FeedSwitcherProps> = ({ currentFeed, onFeedChange, loading = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const feeds = [
    { id: "personalized", label: "Personalized", icon: "🌟" },
    { id: "global", label: "Global", icon: "🌍" },
    { id: "reels", label: "Reels", icon: "🎥" }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFeedSelect = (feedId: string) => {
    onFeedChange(feedId);
    setIsExpanded(false);
  };

  const getCurrentFeedIcon = () => {
    const current = feeds.find(feed => feed.id === currentFeed);
    return current?.icon || "🌟";
  };

  return (
    <div ref={switcherRef} className={`floating-feed-switcher ${isExpanded ? "expanded" : ""}`}>
      {/* Main floating button */}
      <button
        className="floating-switcher-button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={loading}
      >
        <span className="floating-button-icon">{getCurrentFeedIcon()}</span>
        <span className="floating-button-arrow">{isExpanded ? "▲" : "▼"}</span>
      </button>

      {/* Expanded menu */}
      {isExpanded && (
        <div className="floating-switcher-menu">
          <div className="switcher-menu-header">
            <h3>Switch Feed</h3>
          </div>
          <div className="switcher-menu-items">
            {feeds.map((feed) => (
              <button
                key={feed.id}
                className={`switcher-menu-item ${currentFeed === feed.id ? "active" : ""}`}
                onClick={() => handleFeedSelect(feed.id)}
              >
                <span className="menu-item-icon">{feed.icon}</span>
                <span className="menu-item-label">{feed.label}</span>
                {currentFeed === feed.id && (
                  <span className="menu-item-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedSwitcher;