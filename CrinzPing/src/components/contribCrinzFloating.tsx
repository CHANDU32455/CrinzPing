import React, { type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

interface FloatingActionButtonProps {
  icon?: React.ReactNode;
  size?: number;
  color?: string;
}

export function ContribCrinzFloating({
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
  };

  const handleClick = () => {
    navigate("/contributeCrinz");
  };

  return (
    <div style={containerStyle}>
      <button
        style={buttonStyle}
        onClick={handleClick}
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
