import React, { useState, useEffect } from "react";
import { useImageCache } from "../hooks/useImageCache";

interface UserAvatarProps {
  userName: string;
  profilePic?: string;
  size?: number;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  userName,
  profilePic,
  size = 40,
  className = ""
}) => {
  const [imageError, setImageError] = useState(false);
  const { cachedSrc, error } = useImageCache(profilePic);

  // Reset error when profilePic changes
  useEffect(() => {
    setImageError(false);
  }, [profilePic]);

  // Generate random background color
  const colors = ["#FF6B6B", "#4A90E2", "#2ECC71", "#F1C40F", "#9B59B6", "#E91E63"];
  const randomColor = colors[userName.length % colors.length];

  // Get initials
  const initials = userName
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  // If we have a valid profile picture and no error, show the image
  // We check for cachedSrc (which handles loading) or fallback to profilePic if caching isn't used/ready but we want to try rendering anyway
  // However, useImageCache handles the fetching, so we should rely on cachedSrc.
  // If error occurs in hook or image load, we fall back to initials.
  if (profilePic && !imageError && !error && cachedSrc) {
    return (
      <img
        src={cachedSrc}
        alt={`${userName}'s avatar`}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover"
        }}
        onError={() => setImageError(true)}
      />
    );
  }

  // Otherwise show colored circle with initials
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: randomColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#FFFFFF",
        fontSize: size / 2.5,
        fontWeight: "bold",
        fontFamily: "Arial, sans-serif"
      }}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;