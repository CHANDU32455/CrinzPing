import React, { useRef, useState, useCallback } from 'react';
import { useInViewport } from '../feed/tabs/personalizedfeed/Parts/useInViewPort';
import { useVideoPlayer, useMediaManager } from '../feed/tabs/personalizedfeed/Parts/useMediaManager';
import ProfilePicture from './ProfilePicture';
import EngagementButtons from '../feed/tabs/personalizedfeed/Parts/EngagementButtons';

interface ReelTileProps {
  item: any;
  onComment: () => void;
  onShare: () => void;
  onLikeUpdate?: (contentId: string, newLikeCount: number, isLiked: boolean) => void; // ✅ NEW: Like callback
}

const ReelTile: React.FC<ReelTileProps> = ({ item, onComment, onShare, onLikeUpdate }) => {
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
  // Default to vertical reel aspect (9:16) so space is reserved before metadata
  const [videoAspectRatio, setVideoAspectRatio] = useState<number>(9 / 16);
  const [containerHeight, setContainerHeight] = useState<number>(400);

  // Calculate container height based on aspect ratio
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (videoFile && shouldPreload && !videoLoaded && !videoError) {
      console.log(`Preloading video for reel ${item.id}`);
      preloadVideo(item.id, videoFile.url);
    }
  }, [videoFile, item.id, shouldPreload, videoLoaded, videoError, preloadVideo]);

  // Register video and set mute state
  React.useEffect(() => {
    if (videoRef.current) {
      registerVideo(item.id, videoRef.current);
      const currentMutedState = isMuted(item.id);
      setIsVideoMuted(currentMutedState);
      videoRef.current.muted = currentMutedState;

      const video = videoRef.current;
      const handleLoadedMetadata = () => {
        if (video.videoWidth && video.videoHeight) {
          setVideoAspectRatio(video.videoWidth / video.videoHeight);
        }
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }

    return () => {
      registerVideo(item.id, null);
    };
  }, [item.id, registerVideo, isMuted]);

  // Handle viewport changes
  React.useEffect(() => {
    if (isInViewport && videoFile) {
      if (videoLoaded && !videoError) {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
        playVideo(item.id);
        activateMedia(item.id);
        setShowPlayButton(false);
      } else {
        setShowPlayButton(true);
      }
    } else {
      pauseVideo(item.id);
      deactivateMedia(item.id);
      if (videoRef.current && hasBeenInViewport) {
        videoRef.current.currentTime = 0;
      }
      setShowPlayButton(true);
    }
  }, [isInViewport, videoFile, item.id, videoLoaded, videoError, playVideo, pauseVideo, activateMedia, deactivateMedia, hasBeenInViewport]);

  // Video event handlers
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setVideoLoaded(true);
      setVideoError(false);
      
      const currentMutedState = isMuted(item.id);
      video.muted = currentMutedState;
      setIsVideoMuted(currentMutedState);

      if (isInViewport) {
        video.currentTime = 0;
        playVideo(item.id);
        activateMedia(item.id);
        setShowPlayButton(false);
      } else {
        setShowPlayButton(true);
      }
    };

    const handleError = () => {
      setVideoError(true);
      setVideoLoaded(false);
      setShowPlayButton(false);
    };

    const handlePlay = () => {
      setShowPlayButton(false);
      activateMedia(item.id);
    };

    const handlePause = () => {
      setShowPlayButton(true);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [item.id, isInViewport, playVideo, activateMedia, isMuted]);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newMutedState = toggleMute(item.id);
    setIsVideoMuted(newMutedState);
  }, [item.id, toggleMute]);

  const handleVideoToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isPlaying(item.id)) {
      pauseVideo(item.id);
    } else {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
      playVideo(item.id);
    }
  }, [item.id, isPlaying, playVideo, pauseVideo]);

  const handleRetryLoad = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoError(false);
    setVideoLoaded(false);
    setShowPlayButton(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
  }, []);

  // ✅ UPDATED: Handle like with callback
  const handleLike = useCallback(() => {
    // This will be handled by EngagementButtons with the callback
  }, []);

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
              <div className="absolute inset-0 rounded-xl z-10">
                {/* Skeleton placeholder for reel body */}
                <div className="w-full h-full bg-gray-800/70 animate-pulse rounded-xl border border-purple-700/20 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-700/30" />
                    <div className="h-3 w-28 rounded bg-purple-700/30" />
                    <div className="h-3 w-40 rounded bg-purple-700/20" />
                  </div>
                </div>
              </div>
            )}

            {/* Thumbnail */}
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

            {/* Play Button */}
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
        </div>
      )}

      {/* Engagement Buttons */}
      <EngagementButtons
        item={item}
        onLike={handleLike}
        onShare={onShare}
        onComment={onComment}
        onLikeUpdate={onLikeUpdate} // ✅ NEW: Pass like callback
      />
    </div>
  );
};

export default ReelTile;