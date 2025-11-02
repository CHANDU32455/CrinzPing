// src\feed\tabs\personalizedfeed\PersonalizedFeed.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { usePersonalizedData } from "./usePersonalizedData";

// Enhanced viewport hook with priority loading
const useInViewport = (options = {}) => {
  const [isInViewport, setIsInViewport] = useState(false);
  const [hasBeenInViewport, setHasBeenInViewport] = useState(false);
  const [shouldPreload, setShouldPreload] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      const nowInViewport = entry.isIntersecting;
      setIsInViewport(nowInViewport);

      if (nowInViewport && !hasBeenInViewport) {
        setHasBeenInViewport(true);
      }
    }, {
      threshold: 0.7,
      rootMargin: "100px",
      ...options
    });

    const preloadObserver = new IntersectionObserver(([entry]) => {
      setShouldPreload(entry.isIntersecting);
    }, {
      threshold: 0.1,
      rootMargin: "200px",
    });

    if (ref.current) {
      observer.observe(ref.current);
      preloadObserver.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
        preloadObserver.unobserve(ref.current);
      }
    };
  }, [options, hasBeenInViewport]);

  return { ref, isInViewport, hasBeenInViewport, shouldPreload };
};

// Audio player hook
const useAudioPlayer = () => {
  const audioInstances = useRef<Map<string, HTMLAudioElement>>(new Map());

  const playAudio = useCallback((id: string, audioUrl: string) => {
    // Stop other audio first
    audioInstances.current.forEach((audio, audioId) => {
      if (audioId !== id) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    let audio = audioInstances.current.get(id);
    if (!audio) {
      audio = new Audio(audioUrl);
      audio.volume = 0.7;
      audio.preload = "auto";
      audioInstances.current.set(id, audio);
    }

    audio.play().catch((e) => console.warn("Audio play failed:", e));
  }, []);

  const stopAudio = useCallback((id: string) => {
    const audio = audioInstances.current.get(id);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const stopAllAudio = useCallback(() => {
    audioInstances.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, []);

  return { playAudio, stopAudio, stopAllAudio };
};

// Video player hook with enhanced preloading - UPDATED
const useVideoPlayer = () => {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const mutedStates = useRef<Map<string, boolean>>(new Map());
  const playStates = useRef<Map<string, boolean>>(new Map());
  const preloadedVideos = useRef<Map<string, boolean>>(new Map());

  // Track global mute preference
  const globalMutePreference = useRef<boolean | null>(null);

  const registerVideo = useCallback((id: string, video: HTMLVideoElement | null) => {
    if (video) {
      videoRefs.current.set(id, video);

      // Use global preference if set, otherwise default to muted
      const shouldMute = globalMutePreference.current !== null
        ? globalMutePreference.current
        : true;

      mutedStates.current.set(id, shouldMute);
      video.muted = shouldMute;

      if (!playStates.current.has(id)) {
        playStates.current.set(id, false);
      }
    } else {
      videoRefs.current.delete(id);
    }
  }, []);

  const preloadVideo = useCallback((id: string, videoUrl: string) => {
    if (preloadedVideos.current.get(id)) return;

    const video = document.createElement('video');
    video.src = videoUrl;
    video.preload = "metadata";
    video.load();
    preloadedVideos.current.set(id, true);
  }, []);

  const playVideo = useCallback((id: string) => {
    const video = videoRefs.current.get(id);
    if (video) {
      const isMuted = mutedStates.current.get(id) ?? true;
      video.muted = isMuted;
      video.play().catch((e) => {
        if (e.name !== 'AbortError') {
          console.warn("Video play failed:", e);
        }
      });
      playStates.current.set(id, true);
    }
  }, []);

  const pauseVideo = useCallback((id: string) => {
    const video = videoRefs.current.get(id);
    if (video) {
      video.pause();
      playStates.current.set(id, false);
    }
  }, []);

  const toggleMute = useCallback((id: string) => {
    const video = videoRefs.current.get(id);
    if (video) {
      const currentlyMuted = mutedStates.current.get(id) ?? true;
      const newMutedState = !currentlyMuted;

      video.muted = newMutedState;
      mutedStates.current.set(id, newMutedState);

      // Update global preference when user explicitly mutes/unmutes
      globalMutePreference.current = newMutedState;

      // Apply to all currently registered videos
      videoRefs.current.forEach((vid, vidId) => {
        if (vidId !== id) {
          vid.muted = newMutedState;
          mutedStates.current.set(vidId, newMutedState);
        }
      });

      return newMutedState;
    }
    return true;
  }, []);

  const isMuted = useCallback((id: string) => {
    return mutedStates.current.get(id) ?? true;
  }, []);

  const isPlaying = useCallback((id: string) => {
    return playStates.current.get(id) ?? false;
  }, []);

  return useMemo(() => ({
    registerVideo,
    preloadVideo,
    playVideo,
    pauseVideo,
    toggleMute,
    isMuted,
    isPlaying
  }), [registerVideo, preloadVideo, playVideo, pauseVideo, toggleMute, isMuted, isPlaying]);
};

// Global media manager
const useMediaManager = () => {
  const { stopAllAudio } = useAudioPlayer();
  const { pauseVideo } = useVideoPlayer();
  const activeMedia = useRef<Set<string>>(new Set());

  const activateMedia = useCallback((id: string) => {
    activeMedia.current.add(id);
  }, []);

  const deactivateMedia = useCallback((id: string) => {
    activeMedia.current.delete(id);
    pauseVideo(id);
    stopAllAudio(); // Stop audio when any media is deactivated
  }, [pauseVideo, stopAllAudio]);

  const stopAllMedia = useCallback(() => {
    stopAllAudio();
    activeMedia.current.forEach(id => pauseVideo(id));
    activeMedia.current.clear();
  }, [pauseVideo, stopAllAudio]);

  return {
    activateMedia,
    deactivateMedia,
    stopAllMedia
  };
};

// Image Carousel Component with loading animation
const ImageCarousel = ({ images }: { images: Array<{ url: string; type: string }> }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingStates, setLoadingStates] = useState<boolean[]>(images.map(() => true));

  const nextImage = useCallback(() => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    // Set loading state for next image
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[nextIndex] = true;
      return newStates;
    });
  }, [currentIndex, images.length]);

  const prevImage = useCallback(() => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    // Set loading state for previous image
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

// Compact Engagement Buttons Component
const EngagementButtons = ({ item, onLike, onShare, onComment }: {
  item: any;
  onLike: () => void;
  onShare: () => void;
  onComment: () => void;
}) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likeCount || 0);

  const handleLike = useCallback(() => {
    setLiked(!liked);
    setLikeCount((prev: number) => liked ? prev - 1 : prev + 1);
    onLike();
  }, [liked, onLike]);

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
      <div className="flex items-center gap-4">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-800/50 transition-all duration-200 group"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <div className={`p-2 rounded-full transition-all duration-200 ${liked
            ? 'bg-red-500/20 text-red-500 scale-110'
            : 'bg-gray-700/30 text-gray-400 group-hover:bg-red-500/20 group-hover:text-red-400'
            }`}>
            {liked ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path d="M10 18.35L8.55 17.03C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0 7.24 0 8.91 0.81 10 2.09 11.09 0.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.54L10 18.35z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path d="M10 18.35L8.55 17.03C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0 7.24 0 8.91 0.81 10 2.09 11.09 0.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.54L10 18.35z" />
              </svg>
            )}
          </div>
          <span className={`text-sm font-semibold min-w-[24px] text-center ${liked ? 'text-red-500' : 'text-gray-400'
            }`}>
            {likeCount}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={onComment}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-800/50 transition-all duration-200 group"
          aria-label="Comment"
        >
          <div className="p-2 rounded-full bg-gray-700/30 text-gray-400 transition-all duration-200 group-hover:bg-blue-500/20 group-hover:text-blue-400">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
              <path d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm4 0H9v2h2V8zm4 0h-2v2h2V8z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-400 min-w-[24px] text-center">
            {item.commentCount || 0}
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-800/50 transition-all duration-200 group"
          aria-label="Share"
        >
          <div className="p-2 rounded-full bg-gray-700/30 text-gray-400 transition-all duration-200 group-hover:bg-green-500/20 group-hover:text-green-400">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-400 hidden sm:inline">
            Share
          </span>
        </button>
      </div>
    </div>
  );
};

// Profile Picture Component with better loading and fixed sizing
const ProfilePicture = ({
  src,
  alt,
  fallbackText,
  className = "w-10 h-10",
  borderColor = "border-gray-500"
}: {
  src?: string;
  alt: string;
  fallbackText: string;
  className?: string;
  borderColor?: string;
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

// Reel Component - Fixed to play videos properly
const ReelItem = ({ item }: { item: any }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref, isInViewport, hasBeenInViewport, shouldPreload } = useInViewport({ threshold: 0.7 });
  const { registerVideo, preloadVideo, playVideo, pauseVideo, toggleMute, isMuted, isPlaying } = useVideoPlayer();
  const { activateMedia, deactivateMedia } = useMediaManager();

  const videoFile = item.files?.find((f: any) => f.type.startsWith('video/'));
  const thumbnailFile = item.files?.find((f: any) => f.type.startsWith('image/'));
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number>(16 / 9);
  const [containerHeight, setContainerHeight] = useState<number>(400);

  // Calculate container height based on aspect ratio
  useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = width / videoAspectRatio;
        setContainerHeight(Math.min(height, window.innerHeight * 0.7));
      }
    };

    updateContainerHeight();
    window.addEventListener('resize', updateContainerHeight);
    return () => window.removeEventListener('resize', updateContainerHeight);
  }, [videoAspectRatio]);

  // Preload video when in preload zone
  useEffect(() => {
    if (videoFile && shouldPreload && !videoLoaded && !videoError) {
      console.log(`Preloading video for reel ${item.id}`);
      preloadVideo(item.id, videoFile.url);
    }
  }, [videoFile, item.id, shouldPreload, videoLoaded, videoError, preloadVideo]);

  // Register video and set mute state
  useEffect(() => {
    if (videoRef.current) {
      registerVideo(item.id, videoRef.current);
      const currentMutedState = isMuted(item.id);
      setIsVideoMuted(currentMutedState);
      videoRef.current.muted = currentMutedState;

      // Get video dimensions for sizing
      const video = videoRef.current;
      const handleLoadedMetadata = () => {
        if (video.videoWidth && video.videoHeight) {
          setVideoAspectRatio(video.videoWidth / video.videoHeight);
          console.log(`Video metadata loaded for ${item.id}: ${video.videoWidth}x${video.videoHeight}`);
        }
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }

    return () => {
      registerVideo(item.id, null);
    };
  }, [item.id, registerVideo, isMuted]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      const currentMutedState = isMuted(item.id);
      if (currentMutedState !== isVideoMuted) {
        setIsVideoMuted(currentMutedState);
        videoRef.current.muted = currentMutedState;
      }
    }
  }, [item.id, isMuted, isVideoMuted]);

  // Handle viewport changes - FIXED LOGIC
  useEffect(() => {
    console.log(`Reel ${item.id}: isInViewport=${isInViewport}, videoLoaded=${videoLoaded}, videoError=${videoError}`);
    
    if (isInViewport && videoFile) {
      if (videoLoaded && !videoError) {
        // Video is loaded and in viewport - play it
        console.log(`Playing reel ${item.id} - in viewport and loaded`);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
        playVideo(item.id);
        activateMedia(item.id);
        setShowPlayButton(false);
      } else {
        // Video not loaded yet - show play button on thumbnail
        console.log(`Reel ${item.id} - waiting for video to load`);
        setShowPlayButton(true);
      }
    } else {
      // Not in viewport - pause and reset
      console.log(`Pausing reel ${item.id} - not in viewport`);
      pauseVideo(item.id);
      deactivateMedia(item.id);
      if (videoRef.current && hasBeenInViewport) {
        videoRef.current.currentTime = 0;
      }
      setShowPlayButton(true);
    }
  }, [isInViewport, videoFile, item.id, videoLoaded, videoError, playVideo, pauseVideo, activateMedia, deactivateMedia, hasBeenInViewport]);

  // Video event handlers - FIXED
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      console.log(`Video loaded for reel ${item.id}`);
      setVideoLoaded(true);
      setVideoError(false);
      
      // Apply mute state
      const currentMutedState = isMuted(item.id);
      video.muted = currentMutedState;
      setIsVideoMuted(currentMutedState);

      // If in viewport and loaded, play it immediately
      if (isInViewport) {
        console.log(`Auto-playing reel ${item.id} after load`);
        video.currentTime = 0;
        playVideo(item.id);
        activateMedia(item.id);
        setShowPlayButton(false);
      } else {
        setShowPlayButton(true);
      }
    };

    const handleCanPlay = () => {
      console.log(`Video can play for reel ${item.id}`);
      // Video is ready to play
    };

    const handleError = (e: Event) => {
      console.error(`Video load error for reel ${item.id}:`, e);
      setVideoError(true);
      setVideoLoaded(false);
      setShowPlayButton(false);
    };

    const handlePlay = () => {
      console.log(`Video started playing for reel ${item.id}`);
      setShowPlayButton(false);
      activateMedia(item.id);
    };

    const handlePause = () => {
      console.log(`Video paused for reel ${item.id}`);
      setShowPlayButton(true);
    };

    const handleEnded = () => {
      console.log(`Video ended for reel ${item.id}`);
      setShowPlayButton(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [item.id, isInViewport, playVideo, activateMedia, isMuted]);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newMutedState = toggleMute(item.id);
    setIsVideoMuted(newMutedState);
  }, [item.id, toggleMute]);

  const handleVideoToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Manual video toggle for reel ${item.id}, isPlaying: ${isPlaying(item.id)}`);
    
    if (isPlaying(item.id)) {
      pauseVideo(item.id);
    } else {
      // Always start from beginning when manually playing
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
      playVideo(item.id);
    }
  }, [item.id, isPlaying, playVideo, pauseVideo]);

  const handleRetryLoad = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Retrying load for reel ${item.id}`);
    setVideoError(false);
    setVideoLoaded(false);
    setShowPlayButton(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
  }, []);

  const handleLike = useCallback(() => console.log('Liked reel:', item.id), [item.id]);
  const handleShare = useCallback(() => console.log('Share reel:', item.id), [item.id]);
  const handleComment = useCallback(() => console.log('Comment on reel:', item.id), [item.id]);

  return (
    <div
      ref={ref}
      className="bg-gray-900 border border-gray-700 rounded-2xl p-4 md:p-6 w-full hover:border-purple-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <ProfilePicture
            src={item.user?.profilePic}
            alt={item.user?.userName || 'User'}
            fallbackText={item.user?.userName || 'U'}
            borderColor="border-purple-500"
          />
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-base truncate">
              {item.user?.userName || 'Anonymous'}
            </p>
            {item.user?.tagline && (
              <p className="text-gray-400 text-sm italic truncate">"{item.user.tagline}"</p>
            )}
            <p className="text-gray-400 text-sm">
              {new Date(item.timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-purple-900 bg-opacity-50 rounded-full text-xs font-medium border border-purple-700 flex-shrink-0 ml-2">
          REEL
        </span>
      </div>

      {/* Content */}
      {item.content && (
        <p className="text-gray-200 text-base leading-relaxed mb-3 break-words whitespace-pre-wrap">
          {item.content}
        </p>
      )}

      {/* Video Container */}
      {videoFile && (
        <div
          ref={containerRef}
          className="relative mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-700/30"
          style={{ height: `${containerHeight}px` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl pointer-events-none"></div>

          <div className="relative w-full h-full">
            {/* Error State */}
            {videoError && (
              <div className="absolute inset-0 bg-gray-800 rounded-xl flex flex-col items-center justify-center z-10">
                <div className="text-center p-4">
                  <div className="text-4xl mb-3">❌</div>
                  <p className="text-gray-400 text-sm mb-4">Failed to load video</p>
                  <button
                    onClick={handleRetryLoad}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {!videoLoaded && !videoError && (
              <div className="absolute inset-0 bg-gray-800 rounded-xl flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Loading video...</p>
                </div>
              </div>
            )}

            {/* Thumbnail - Show when video not playing */}
            {(showPlayButton || !videoLoaded) && !videoError && thumbnailFile && (
              <img
                src={thumbnailFile.url}
                alt="Video thumbnail"
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            )}

            {/* Video */}
            <video
              ref={videoRef}
              src={videoFile.url}
              poster={thumbnailFile?.url}
              muted={isVideoMuted}
              loop
              playsInline
              preload="auto"
              className={`w-full h-full object-contain bg-black transition-opacity duration-300 ${
                videoLoaded && !videoError && !showPlayButton ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={handleVideoToggle}
              style={{ maxHeight: '70vh' }}
            />

            {/* Play Button on Thumbnail */}
            {showPlayButton && !videoError && videoLoaded && (
              <button
                onClick={handleVideoToggle}
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/30 backdrop-blur-sm z-20 transition-all duration-300"
                aria-label="Play video"
              >
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 hover:scale-110 transition-transform">
                  <span className="text-white text-3xl">▶️</span>
                </div>
              </button>
            )}
          </div>

          {/* Video Status Debug */}
          <div className="absolute top-4 left-4 z-30">
            <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs text-white">
              {videoError ? '❌ Error' : 
               !videoLoaded ? '🔄 Loading' : 
               isInViewport ? (isPlaying(item.id) ? '▶️ Playing' : '⏸️ Paused') : '📹 Ready'}
            </div>
          </div>

          {/* Floating Controls */}
          {videoLoaded && !videoError && !showPlayButton && (
            <div className="absolute bottom-4 right-4 flex gap-2 z-30">
              <button
                onClick={handleVideoToggle}
                className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/80 transition-all duration-300 hover:scale-110 border border-white/20"
                aria-label={isPlaying(item.id) ? "Pause video" : "Play video"}
              >
                <span className="text-white text-xl">
                  {isPlaying(item.id) ? '⏸️' : '▶️'}
                </span>
              </button>

              <button
                onClick={handleMuteToggle}
                className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/80 transition-all duration-300 hover:scale-110 border border-white/20"
                aria-label={isVideoMuted ? "Unmute video" : "Mute video"}
              >
                <span className="text-white text-xl">
                  {isVideoMuted ? '🔇' : '🔊'}
                </span>
              </button>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
        </div>
      )}

      {/* Engagement Buttons */}
      <EngagementButtons
        item={item}
        onLike={handleLike}
        onShare={handleShare}
        onComment={handleComment}
      />
    </div>
  );
};

// Post Component with viewport-based audio
const PostItem = ({ item }: { item: any }) => {
  const { ref, isInViewport, hasBeenInViewport } = useInViewport({ threshold: 0.7 });
  const { playAudio, stopAudio } = useAudioPlayer();
  const { activateMedia, deactivateMedia } = useMediaManager();

  const audioFile = item.files?.find((f: any) => f.type.startsWith('audio/'));
  const imageFiles = item.files?.filter((f: any) => f.type.startsWith('image/')) || [];

  // Handle audio based on viewport
  useEffect(() => {
    if (isInViewport && audioFile) {
      playAudio(item.id, audioFile.url);
      activateMedia(item.id);
    } else {
      stopAudio(item.id);
      deactivateMedia(item.id);
    }
  }, [isInViewport, audioFile, item.id, playAudio, stopAudio, activateMedia, deactivateMedia]);

  const handleLike = useCallback(() => console.log('Liked post:', item.id), [item.id]);
  const handleShare = useCallback(() => console.log('Share post:', item.id), [item.id]);
  const handleComment = useCallback(() => console.log('Comment on post:', item.id), [item.id]);

  return (
    <div
      ref={ref}
      className="bg-gray-900 border border-gray-700 rounded-2xl p-4 md:p-6 w-full hover:border-blue-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0"> {/* Added min-w-0 to prevent text overflow */}
          <ProfilePicture
            src={item.user?.profilePic}
            alt={item.user?.userName || 'User'}
            fallbackText={item.user?.userName || 'U'}
            borderColor="border-blue-500"
          />
          <div className="min-w-0 flex-1"> {/* Added min-w-0 and flex-1 for proper text truncation */}
            <p className="text-white font-semibold text-base truncate">
              {item.user?.userName || 'Anonymous'}
            </p>
            {item.user?.tagline && (
              <p className="text-gray-400 text-sm italic truncate">"{item.user.tagline}"</p>
            )}
            <p className="text-gray-400 text-sm">
              {new Date(item.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-blue-900 bg-opacity-50 rounded-full text-xs font-medium border border-blue-700 flex-shrink-0 ml-2">
          POST
        </span>
      </div>

      {/* Content */}
      {item.content && (
        <p className="text-gray-200 text-base mb-4 leading-relaxed">{item.content}</p>
      )}

      {/* Images */}
      <ImageCarousel images={imageFiles} />

      {/* Audio Indicator */}
      {audioFile && (
        <div className="flex items-center gap-3 text-green-400 text-sm mb-3">
          <div className={`w-3 h-3 rounded-full ${isInViewport ? 'bg-green-400 animate-pulse' : 'bg-green-600'}`} />
          <span className="font-medium">
            {isInViewport ? '🎵 Playing...' : hasBeenInViewport ? '🔊 Ready' : '🔊 Audio'}
          </span>
        </div>
      )}

      {/* Engagement Buttons */}
      <EngagementButtons
        item={item}
        onLike={handleLike}
        onShare={handleShare}
        onComment={handleComment}
      />
    </div>
  );
};

// Crinz Message Component
const CrinzMessageItem = ({ item }: { item: any }) => {
  const { ref } = useInViewport();

  const handleLike = useCallback(() => console.log('Liked message:', item.id), [item.id]);
  const handleShare = useCallback(() => console.log('Share message:', item.id), [item.id]);
  const handleComment = useCallback(() => console.log('Comment on message:', item.id), [item.id]);

  return (
    <div
      ref={ref}
      className="bg-gradient-to-r from-cyan-900 to-blue-900 border border-cyan-700 rounded-2xl p-4 md:p-6 w-full shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0"> {/* Added min-w-0 to prevent text overflow */}
          <ProfilePicture
            src={item.user?.profilePic}
            alt={item.user?.userName || 'User'}
            fallbackText={item.user?.userName || 'U'}
            borderColor="border-cyan-500"
          />
          <div className="min-w-0 flex-1"> {/* Added min-w-0 and flex-1 for proper text truncation */}
            <p className="text-white font-semibold text-base truncate">
              {item.user?.userName || 'Anonymous'}
            </p>
            {item.user?.tagline && (
              <p className="text-cyan-200 text-sm italic truncate">"{item.user.tagline}"</p>
            )}
            <p className="text-cyan-300 text-sm">
              {new Date(item.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-cyan-800 bg-opacity-50 rounded-full text-xs font-medium border border-cyan-600 flex-shrink-0 ml-2">
          CRINZ
        </span>
      </div>

      {/* Content */}
      <p className="text-white text-base mb-4 leading-relaxed italic">"{item.content}"</p>

      {/* Engagement Buttons */}
      <EngagementButtons
        item={item}
        onLike={handleLike}
        onShare={handleShare}
        onComment={handleComment}
      />
    </div>
  );
};

// Loading Skeleton Component
const FeedItemSkeleton = () => (
  <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 md:p-6 w-full animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded w-24"></div>
          <div className="h-3 bg-gray-700 rounded w-32"></div>
        </div>
      </div>
      <div className="h-6 bg-gray-700 rounded w-16"></div>
    </div>
    <div className="h-48 bg-gray-700 rounded-xl mb-4"></div>
    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
    <div className="flex gap-4 pt-4 border-t border-gray-700">
      <div className="h-8 bg-gray-700 rounded w-16"></div>
      <div className="h-8 bg-gray-700 rounded w-16"></div>
      <div className="h-8 bg-gray-700 rounded w-16"></div>
    </div>
  </div>
);

// Main Feed Component
export const PersonalizedFeed = () => {
  const { content, loading, hasMore, loadMore, metrics } = usePersonalizedData();
  const { stopAllMedia } = useMediaManager();

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  // Cleanup media on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, [stopAllMedia]);

  return (
    <div className="min-h-screen bg-gray-950 py-4 md:py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          {metrics && (
            <p className="text-gray-400 text-sm">
              Showing {content.length} items • {metrics.stats.followees_processed} friends • {metrics.stats.global_users_processed} discovered
            </p>
          )}
        </div>

        {/* Feed Content */}
        <div className="space-y-6 md:space-y-8">
          {content.map((item) => (
            <div key={item.id} className="scroll-m-20">
              {item.type === 'post' && <PostItem item={item} />}
              {item.type === 'reel' && <ReelItem item={item} />}
              {item.type === 'crinz_message' && <CrinzMessageItem item={item} />}
            </div>
          ))}

          {/* Loading Skeletons */}
          {loading && content.length === 0 && (
            <>
              <FeedItemSkeleton />
              <FeedItemSkeleton />
              <FeedItemSkeleton />
            </>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-8 md:mt-12">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Loading more content...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>📥</span>
                    Load More
                  </div>
                )}
              </button>
            </div>
          )}

          {/* End of Feed */}
          {!hasMore && content.length > 0 && (
            <div className="text-center mt-12 py-8 border-t border-gray-800">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-white mb-2">You're all caught up!</h3>
              <p className="text-gray-400">
                You've reached the end of your personalized feed.
              </p>
            </div>
          )}

          {/* Empty State */}
          {content.length === 0 && !loading && (
            <div className="text-center py-16 md:py-24">
              <div className="text-gray-400 text-6xl md:text-8xl mb-6">📱</div>
              <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                Your feed is empty
              </h3>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                Follow more users or explore content to personalize your feed experience.
              </p>
              <button
                onClick={loadMore}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Refresh Feed
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalizedFeed;