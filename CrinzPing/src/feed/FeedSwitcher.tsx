import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface FeedSwitcherProps {
  position?: "header" | "floating";
  top?: number;
  right?: number;
  left?: number;
  bottom?: number;
  onFeedChange?: (feedId: string) => void;
  className?: string; // <-- optional className added
}

const FeedSwitcher: React.FC<FeedSwitcherProps> = ({
  position = "header",
  top,
  right,
  left,
  bottom,
  onFeedChange,
  className = "", // default empty
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const feeds = [
    { id: "personalized", icon: "🌟", path: "/feed/personalizedfeed" },
    { id: "global", icon: "🌍", path: "/feed/crinzmessagesfeed" },
    { id: "reels", icon: "🎥", path: "/feed/reelsfeed" },
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

  const handleFeedSelect = (feed: typeof feeds[0]) => {
    setIsExpanded(false);
    navigate(feed.path);
    if (onFeedChange) onFeedChange(feed.id);
  };

  const getPositionStyle = () => {
    if (position !== "floating") return {};
    return {
      ...(top !== undefined && { top: `${top}px` }),
      ...(right !== undefined && { right: `${right}px` }),
      ...(left !== undefined && { left: `${left}px` }),
      ...(bottom !== undefined && { bottom: `${bottom}px` }),
    };
  };

  return (
    <div
      ref={switcherRef}
      className={`relative inline-block ${position === "floating" ? "fixed z-50" : ""} ${className}`}
      style={getPositionStyle()}
    >
      {/* main toggle button */}
      <button
        style={{ all: "unset" }}
        className={`flex items-center justify-center w-11 h-11 rounded-full
          bg-gray-900 border border-gray-700 text-gray-300
          hover:bg-gray-800 hover:text-white transition-colors
          shadow-md cursor-pointer
          ${isExpanded ? "ring-2 ring-indigo-500" : ""}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        🎯
      </button>

      {/* dropdown menu */}
      {isExpanded && (
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 
                     bg-gray-900 border border-gray-700 rounded-xl shadow-lg 
                     py-2 flex flex-col items-center gap-1 min-w-[56px] z-50"
        >
          {feeds.map((feed) => (
            <button
              key={feed.id}
              style={{ all: "unset" }}
              className="w-10 h-10 flex items-center justify-center 
                         rounded-full text-lg bg-gray-900 text-gray-300 border border-gray-700
                         hover:bg-gray-800 hover:text-white transition-colors shadow-sm cursor-pointer"
              onClick={() => handleFeedSelect(feed)}
            >
              {feed.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedSwitcher;
