import { useEffect, useRef, useState, useCallback } from "react";
import { usePersonalizedData } from "./usePersonalizedData";

// Custom hook for intersection observer (viewport detection)
const useInViewport = (options = {}) => {
  const [isInViewport, setIsInViewport] = useState(false);
  const [hasBeenInViewport, setHasBeenInViewport] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      const nowInViewport = entry.isIntersecting;
      setIsInViewport(nowInViewport);
      
      if (nowInViewport && !hasBeenInViewport) {
        setHasBeenInViewport(true);
      }
    }, {
      threshold: 0.5,
      rootMargin: "0px",
      ...options
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options, hasBeenInViewport]);

  return { ref, isInViewport, hasBeenInViewport };
};

// Audio player hook
const useAudioPlayer = () => {
  const audioInstances = useRef<Map<string, HTMLAudioElement>>(new Map());

  const playAudio = useCallback((id: string, audioUrl: string) => {
    stopAllAudio();
    
    let audio = audioInstances.current.get(id);
    if (!audio) {
      audio = new Audio(audioUrl);
      audio.volume = 0.7;
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

// Video player hook - FIXED INFINITE LOOP
const useVideoPlayer = () => {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const mutedStates = useRef<Map<string, boolean>>(new Map());
  const playStates = useRef<Map<string, boolean>>(new Map());

  const registerVideo = useCallback((id: string, video: HTMLVideoElement | null) => {
    if (video) {
      videoRefs.current.set(id, video);
      // Initialize as NOT muted by default
      if (!mutedStates.current.has(id)) {
        mutedStates.current.set(id, false);
      }
      if (!playStates.current.has(id)) {
        playStates.current.set(id, false);
      }
    } else {
      videoRefs.current.delete(id);
    }
  }, []);

  const playVideo = useCallback((id: string) => {
    const video = videoRefs.current.get(id);
    if (video) {
      const isMuted = mutedStates.current.get(id) ?? false;
      video.muted = isMuted;
      video.play().catch((e) => {
        console.warn("Video play failed:", e);
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
      const currentlyMuted = mutedStates.current.get(id) ?? false;
      const newMutedState = !currentlyMuted;
      
      video.muted = newMutedState;
      mutedStates.current.set(id, newMutedState);
      
      return newMutedState;
    }
    return false;
  }, []);

  const isMuted = useCallback((id: string) => {
    return mutedStates.current.get(id) ?? false;
  }, []);

  const isPlaying = useCallback((id: string) => {
    return playStates.current.get(id) ?? false;
  }, []);

  return { registerVideo, playVideo, pauseVideo, toggleMute, isMuted, isPlaying };
};

// Global media manager
const useMediaManager = () => {
  const { stopAllAudio } = useAudioPlayer();
  const { pauseVideo } = useVideoPlayer();
  const [activeMedia, setActiveMedia] = useState<Set<string>>(new Set());

  const activateMedia = useCallback((id: string) => {
    setActiveMedia(prev => new Set(prev).add(id));
  }, []);

  const deactivateMedia = useCallback((id: string) => {
    setActiveMedia(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    pauseVideo(id);
  }, [pauseVideo]);

  const stopAllMedia = useCallback(() => {
    stopAllAudio();
    activeMedia.forEach(id => pauseVideo(id));
    setActiveMedia(new Set());
  }, [activeMedia, pauseVideo, stopAllAudio]);

  return {
    activeMedia,
    activateMedia,
    deactivateMedia,
    stopAllMedia
  };
};

// Image Carousel Component
const ImageCarousel = ({ images }: { images: Array<{ url: string; type: string }> }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) return null;

  return (
    <div className="relative mb-4 rounded-xl overflow-hidden bg-gray-800">
      <div className="h-64 md:h-80">
        <img
          src={images[currentIndex].url}
          alt={`Post image ${currentIndex + 1}`}
          className="w-full h-full object-contain bg-black"
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
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-all backdrop-blur-sm"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-all backdrop-blur-sm"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
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

// Engagement Buttons Component
const EngagementButtons = ({ item, onLike, onShare, onComment }: { 
  item: any; 
  onLike: () => void;
  onShare: () => void;
  onComment: () => void;
}) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likeCount || 0);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev: number) => liked ? prev - 1 : prev + 1);
    onLike();
  };

  return (
    <div className="flex items-center justify-between text-gray-400 text-sm mt-4 pt-4 border-t border-gray-700">
      <div className="flex items-center gap-4 md:gap-6">
        <button 
          onClick={handleLike}
          className="flex items-center gap-2 hover:text-red-400 transition-colors"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <span className={`text-lg ${liked ? 'text-red-500' : ''}`}>
            {liked ? '❤️' : '🤍'}
          </span>
          <span>{likeCount}</span>
        </button>
        
        <button 
          onClick={onComment}
          className="flex items-center gap-2 hover:text-blue-400 transition-colors"
          aria-label="Comment"
        >
          <span className="text-lg">💬</span>
          <span>{item.commentCount || 0}</span>
        </button>
        
        <button 
          onClick={onShare}
          className="flex items-center gap-2 hover:text-green-400 transition-colors"
          aria-label="Share"
        >
          <span className="text-lg">↗️</span>
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

// Reel Component - FIXED INFINITE LOOP
const ReelItem = ({ item }: { item: any }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref, isInViewport } = useInViewport({ threshold: 0.7 });
  const { registerVideo, playVideo, pauseVideo, toggleMute, isMuted, isPlaying } = useVideoPlayer();
  const videoFile = item.files?.find((f: any) => f.type.startsWith('video/'));
  const thumbnailFile = item.files?.find((f: any) => f.type.startsWith('image/'));
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);

  // Register video - FIXED: Only register once
  useEffect(() => {
    if (videoRef.current) {
      registerVideo(item.id, videoRef.current);
      setIsVideoMuted(isMuted(item.id));
    }
  }, [item.id, registerVideo, isMuted]);

  // Add event listeners for play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setShowPlayButton(false);
    const handlePause = () => setShowPlayButton(true);
    const handleLoadedData = () => {
      setShowPlayButton(true);
    };
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadeddata', handleLoadedData);
    
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, []);

  // Handle viewport changes - FIXED: Proper dependencies
  useEffect(() => {
    if (isInViewport && videoFile) {
      playVideo(item.id);
    } else {
      pauseVideo(item.id);
    }
  }, [isInViewport, videoFile, item.id, playVideo, pauseVideo]);

  // Handle mute toggle
  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMutedState = toggleMute(item.id);
    setIsVideoMuted(newMutedState);
  };

  // Handle manual play/pause
  const handleVideoToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying(item.id)) {
      pauseVideo(item.id);
    } else {
      playVideo(item.id);
    }
  };

  const handleLike = () => console.log('Liked reel:', item.id);
  const handleShare = () => console.log('Share reel:', item.id);
  const handleComment = () => console.log('Comment on reel:', item.id);

  return (
    <div 
      ref={ref}
      className="bg-gray-900 border border-gray-700 rounded-2xl p-4 md:p-6 w-full hover:border-purple-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-bold">REEL</span>
          </div>
          <div>
            <p className="text-white font-semibold text-base">Developer Reel</p>
            <p className="text-gray-400 text-sm">
              {new Date(item.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        
        <span className="px-3 py-1 bg-purple-900 bg-opacity-50 rounded-full text-xs font-medium border border-purple-700">
          REEL
        </span>
      </div>

      {/* Video Container with Dynamic Height */}
      {videoFile && (
        <div className="relative mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-700/30">
          {/* Gradient Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl pointer-events-none"></div>
          
          <div className="relative">
            <video
              ref={videoRef}
              src={videoFile.url}
              poster={thumbnailFile?.url}
              muted={isVideoMuted}
              loop
              playsInline
              className="w-full rounded-xl object-cover bg-black shadow-2xl transition-all duration-500 hover:scale-[1.02]"
              style={{ 
                maxHeight: '70vh',
                minHeight: '400px'
              }}
              onClick={handleVideoToggle}
            />
            
            {/* Play/Pause Overlay Button */}
            {showPlayButton && (
              <button
                onClick={handleVideoToggle}
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300 hover:bg-black/30"
                aria-label={isPlaying(item.id) ? "Pause video" : "Play video"}
              >
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 hover:scale-110 transition-transform">
                  <span className="text-white text-3xl">
                    {isPlaying(item.id) ? '⏸️' : '▶️'}
                  </span>
                </div>
              </button>
            )}
          </div>
          
          {/* Floating Controls */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            {/* Play/Pause Button */}
            <button 
              onClick={handleVideoToggle}
              className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/80 transition-all duration-300 hover:scale-110 border border-white/20"
              aria-label={isPlaying(item.id) ? "Pause video" : "Play video"}
            >
              <span className="text-white text-xl">
                {isPlaying(item.id) ? '⏸️' : '▶️'}
              </span>
            </button>

            {/* Mute Button */}
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

          {/* Bottom Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
        </div>
      )}

      {/* Content */}
      {item.content && (
          <p className="text-gray-200 text-base leading-relaxed">{item.content}</p>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.tags.slice(0, 4).map((tag: string, index: number) => (
            <span 
              key={index}
              className="px-3 py-2 bg-gradient-to-r from-purple-900/50 to-pink-900/50 text-purple-300 text-sm rounded-lg border border-purple-700/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Enhanced Engagement Buttons */}
        <EngagementButtons 
          item={item}
          onLike={handleLike}
          onShare={handleShare}
          onComment={handleComment}
        />
      </div>
  );
};

// Post Component
const PostItem = ({ item }: { item: any }) => {
  const { playAudio, stopAudio } = useAudioPlayer();
  const { ref, isInViewport } = useInViewport({ threshold: 0.7 });
  const audioFile = item.files?.find((f: any) => f.type.startsWith('audio/'));
  const imageFiles = item.files?.filter((f: any) => f.type.startsWith('image/')) || [];

  useEffect(() => {
    if (isInViewport && audioFile) {
      playAudio(item.id, audioFile.url);
    } else {
      stopAudio(item.id);
    }
  }, [isInViewport, audioFile, item.id, playAudio, stopAudio]);

  const handleLike = () => console.log('Liked post:', item.id);
  const handleShare = () => console.log('Share post:', item.id);
  const handleComment = () => console.log('Comment on post:', item.id);

  return (
    <div 
      ref={ref}
      className="bg-gray-900 border border-gray-700 rounded-2xl p-4 md:p-6 w-full hover:border-blue-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-bold">DEV</span>
          </div>
          <div>
            <p className="text-white font-semibold text-base">Developer</p>
            <p className="text-gray-400 text-sm">
              {new Date(item.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        
        <span className="px-3 py-1 bg-blue-900 bg-opacity-50 rounded-full text-xs font-medium border border-blue-700">
          POST
        </span>
      </div>

      {/* Content */}
      {item.content && (
        <p className="text-gray-200 text-base mb-4 leading-relaxed">{item.content}</p>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {item.tags.slice(0, 4).map((tag: string, index: number) => (
            <span 
              key={index}
              className="px-3 py-1 bg-gray-800 text-blue-400 text-sm rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Images */}
      <ImageCarousel images={imageFiles} />

      {/* Audio Indicator */}
      {audioFile && (
        <div className="flex items-center gap-3 text-green-400 text-sm mb-3">
          <div className={`w-3 h-3 rounded-full ${isInViewport ? 'bg-green-400 animate-pulse' : 'bg-green-600'}`} />
          <span className="font-medium">
            {isInViewport ? '🎵 Playing...' : '🔊 Audio'}
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

  const handleLike = () => console.log('Liked message:', item.id);
  const handleShare = () => console.log('Share message:', item.id);
  const handleComment = () => console.log('Comment on message:', item.id);

  return (
    <div 
      ref={ref}
      className="bg-gradient-to-r from-cyan-900 to-blue-900 border border-cyan-700 rounded-2xl p-4 md:p-6 w-full shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-bold">CRZ</span>
          </div>
          <div>
            <p className="text-white font-semibold text-base">{item.userName || 'Anonymous'}</p>
            <p className="text-cyan-300 text-sm">
              {new Date(item.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        
        <span className="px-3 py-1 bg-cyan-800 bg-opacity-50 rounded-full text-xs font-medium border border-cyan-600">
          CRINZ
        </span>
      </div>

      {/* Content */}
      <p className="text-white text-base mb-4 leading-relaxed italic">"{item.content}"</p>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {item.tags.map((tag: string, index: number) => (
            <span 
              key={index}
              className="px-3 py-1 bg-cyan-800 bg-opacity-50 text-cyan-300 text-sm rounded-full"
            >
              #{tag}
            </span>
          ))}
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

// Utility function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Main Feed Component
export const PersonalizedFeed = () => {
  const { content, loading, hasMore, fetchContent } = usePersonalizedData();
  const { stopAllMedia } = useMediaManager();
  const [shuffledContent, setShuffledContent] = useState<any[]>([]);

  // Shuffle content when new content is loaded
  useEffect(() => {
    if (content.length > 0) {
      setShuffledContent(shuffleArray(content));
    }
  }, [content]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchContent(10);
    }
  };

  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, [stopAllMedia]);

  if (loading && shuffledContent.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading your developer feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-4 md:py-8 px-3 md:px-4">
      {/* Feed - Vertical Stack */}
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 px-2">
        {shuffledContent.map((item) => (
          <div key={item.id}>
            {item.type === 'post' && <PostItem item={item} />}
            {item.type === 'reel' && <ReelItem item={item} />}
            {item.type === 'crinz_message' && <CrinzMessageItem item={item} />}
          </div>
        ))}

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-8 md:mt-12">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-6 py-3 md:px-8 md:py-4 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Loading...' : '📥 Load More'}
            </button>
          </div>
        )}

        {/* No More Content */}
        {!hasMore && shuffledContent.length > 0 && (
          <div className="text-center mt-8 md:mt-12 py-6 md:py-8 border-t border-gray-800">
            <p className="text-gray-400 text-base md:text-lg">🎉 You've reached the end of your feed!</p>
          </div>
        )}

        {/* Empty State */}
        {shuffledContent.length === 0 && !loading && (
          <div className="text-center py-12 md:py-16">
            <div className="text-gray-400 text-6xl md:text-8xl mb-4 md:mb-6">📱</div>
            <h3 className="text-xl md:text-2xl font-semibold text-white mb-2 md:mb-3">No content yet</h3>
            <p className="text-gray-400 text-base md:text-lg">Your personalized feed will appear here soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedFeed;