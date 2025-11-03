import React, { useState, useCallback } from 'react';

interface ImageCarouselProps {
  images: Array<{ url: string; type: string }>;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingStates, setLoadingStates] = useState<boolean[]>(images.map(() => true));

  const nextImage = useCallback(() => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[nextIndex] = true;
      return newStates;
    });
  }, [currentIndex, images.length]);

  const prevImage = useCallback(() => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[prevIndex] = true;
      return newStates;
    });
  }, [currentIndex, images.length]);

  const handleImageLoad = useCallback((index: number) => {
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[index] = false;
      return newStates;
    });
  }, []);

  const handleImageError = useCallback((index: number) => {
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[index] = false;
      return newStates;
    });
  }, []);

  if (images.length === 0) return null;

  return (
    <div className="relative mb-4 rounded-xl overflow-hidden bg-gray-800">
      <div className="h-64 md:h-80 relative">
        {/* Loading animation */}
        {loadingStates[currentIndex] && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-700 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        )}
        
        <img
          src={images[currentIndex].url}
          alt={`Post image ${currentIndex + 1}`}
          className={`w-full h-full object-contain bg-black transition-opacity duration-300 ${
            loadingStates[currentIndex] ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => handleImageLoad(currentIndex)}
          onError={() => handleImageError(currentIndex)}
          loading="lazy"
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-all backdrop-blur-sm z-20"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-all backdrop-blur-sm z-20"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
                setLoadingStates(prev => {
                  const newStates = [...prev];
                  newStates[index] = true;
                  return newStates;
                });
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white scale-110'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-70'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;