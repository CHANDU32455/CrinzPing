import React, { useEffect, useState } from "react";
import "../../styles/network-error-chip.css";

const NetworkErrorChip: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setMessage("Connection restored!");
      setIsVisible(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setMessage("Network connection lost. Using cached data.");
      setIsVisible(true);
    };

    // Listen for online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check if initially offline
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`network-chip ${isOnline ? "online" : "offline"}`}>
      <div className="network-chip-content">
        <span className="network-chip-icon">
          {isOnline ? "✅" : "⚠️"}
        </span>
        <span className="network-chip-message">{message}</span>
        <button
          className="network-chip-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default NetworkErrorChip;