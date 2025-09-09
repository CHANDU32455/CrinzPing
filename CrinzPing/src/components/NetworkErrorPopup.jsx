import React, { useEffect, useState } from "react";

const NetworkErrorPopup = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    };

    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#d9534f",
        color: "white",
        padding: "10px 20px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        fontSize: "14px",
        zIndex: 9999,
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      ⚠️ Network error. Please check your connection.
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, 20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
        `}
      </style>
    </div>
  );
};

export default NetworkErrorPopup;
