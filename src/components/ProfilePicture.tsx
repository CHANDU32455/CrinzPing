import React, { useState, useCallback } from 'react';

interface ProfilePictureProps {
  src?: string;
  alt: string;
  fallbackText: string;
  className?: string;
  borderColor?: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  src,
  alt,
  fallbackText,
  className = "w-10 h-10",
  borderColor = "border-gray-500"
}) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setImgError(true);
    setIsLoading(false);
  }, []);

  if (imgError || !src) {
    return (
      <div className={`${className} bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-md border ${borderColor} flex-shrink-0`}>
        <span className="text-white text-sm font-bold">
          {fallbackText.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} relative flex-shrink-0`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-700 rounded-full animate-pulse"></div>
      )}
      <img
        src={src}
        alt={alt}
        className={`rounded-full object-cover border ${borderColor} w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};

export default ProfilePicture;