import React, { type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

interface FloatingActionButtonProps {
  icon?: React.ReactNode;
  size?: number; 
  color?: string;
}

export function FloatingActionButton({
  icon = "➕",
  size = 56,
  color = "#1a2531ff",
}: FloatingActionButtonProps) {
  const navigate = useNavigate();

  const containerStyle: CSSProperties = {
    position: "fixed",
    bottom: "11%",
    right: "16px",
    zIndex: 10,
  };

  const buttonStyle: CSSProperties = {
    background: color,
    border: "none",
    borderRadius: "50%",
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size / 2.3}px`,
    color: "white",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={containerStyle}>
      <button
        onClick={() => navigate("/contributeCrinz")}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
        }}
      >
        {icon}
      </button>
    </div>
  );
}
