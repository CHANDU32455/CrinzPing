// src/utils/UserAvatar.tsx
import React, { useEffect, useRef } from "react";

interface UserAvatarProps {
  userName: string;
  size?: number;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ userName, size = 40, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Generate random background color
    const colors = ["#FF6B6B", "#4A90E2", "#2ECC71", "#F1C40F", "#9B59B6", "#E91E63"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Draw background
    ctx.fillStyle = randomColor;
    ctx.fillRect(0, 0, size, size);

    // Draw initials
    const initials = userName
      .split(" ")
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `${size / 2}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, size / 2, size / 2);
  }, [userName, size]);

  return <canvas ref={canvasRef} width={size} height={size} className={className} />;
};

export default UserAvatar;