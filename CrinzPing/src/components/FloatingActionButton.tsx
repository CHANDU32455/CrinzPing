import React, { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

interface FloatingActionButtonProps {
  icon?: React.ReactNode;
  size?: number; 
  color?: string;
}

interface ChipItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

export function FloatingActionButton({
  icon = "➕",
  size = 56, 
  color = "#1a2531ff",
}: FloatingActionButtonProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  const chipItems: ChipItem[] = [
    {
      id: "contribute",
      icon: "❤️",
      label: "Crinz",
      path: "/contributeCrinz"
    },
    {
      id: "post",
      icon: "📝",
      label: "Post",
      path: "/addPostCrinz"
    },
    {
      id: "video",
      icon: "🎥",
      label: "Video",
      path: "/addVideoCrinz"
    }
  ];

  const containerStyle: CSSProperties = {
    position: "fixed",
    bottom: "11%",
    right: "16px",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "15px",
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
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const chipContainerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    alignItems: "flex-end",
  };

  const chipStyle = (index: number, isVisible: boolean): CSSProperties => ({
    padding: "12px 20px",
    background: color,
    color: "white",
    border: "none",
    borderRadius: "30px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(20px)",
    maxWidth: isVisible ? "300px" : "0",
    overflow: "hidden",
    whiteSpace: "nowrap",
    transitionDelay: isVisible ? `${index * 0.1}s` : "0s",
  });

  const handleFabClick = () => {
    setIsOpen(!isOpen);
  };

  const handleChipClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div style={containerStyle}>
      <div style={chipContainerStyle}>
        {chipItems.map((chip, index) => (
          <button
            key={chip.id}
            style={chipStyle(index, isOpen)}
            onClick={() => handleChipClick(chip.path)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#263340";
              e.currentTarget.style.transform = "translateX(-5px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = color;
              e.currentTarget.style.transform = isOpen ? "translateX(0)" : "translateY(20px)";
            }}
          >
            <span>{chip.icon}</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
      
      <button
        onClick={handleFabClick}
        style={{
          ...buttonStyle,
          transform: isOpen ? "rotate(45deg)" : "none"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = isOpen ? "rotate(45deg) scale(1.1)" : "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isOpen ? "rotate(45deg)" : "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
        }}
      >
        {icon}
      </button>
    </div>
  );
}