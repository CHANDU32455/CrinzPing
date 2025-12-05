import React, { useState, useEffect } from "react";

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

  // Reset error when profilePic changes
  useEffect(() => {
    setImageError(false);
  }, [profilePic]);

  // Generate random background color based on username
  const colors = ["#FF6B6B", "#4A90E2", "#2ECC71", "#F1C40F", "#9B59B6", "#E91E63"];
  const randomColor = colors[userName.length % colors.length];

  // Get initials
  const initials = userName
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  // Show image if we have a valid profile picture and no error
  if (profilePic && !imageError) {
    return (
      <img
        src={profilePic}
        alt={`${userName}'s avatar`}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover"
        }}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }

  // Fallback: colored circle with initials
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