import React, { useRef, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ShareComponent from "../feed/ShareComponent";
import CommentModal from "../feed/commentModal";

// Define proper types based on your actual API response
interface FileItem {
  presignedUrl: string;
  type: string;
  isCustom?: boolean;
  fileName?: string;
  s3Key?: string;
  url?: string;
}

interface LocalReel {
  postId: string;
  userId: string;
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  files: FileItem[];
  isLiked?: boolean;
  type?: string;
  timestamp?: number;
  visibility?: string;
  pk?: string;
  sk?: string;
}

interface LocationState {
  posts: any[];
  highlightedPostId: string;
}

const ReelsAllPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data passed from UserReels
  const { posts: reelsFromProps, highlightedPostId } = (location.state as LocationState) || {};
  
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(-1);
  const [isManuallyPaused, setIsManuallyPaused] = useState<boolean>(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  const [localReels, setLocalReels] = useState<LocalReel[]>([]);
  const [selectedReel, setSelectedReel] = useState<LocalReel | null>(null);
  const [shareReel, setShareReel] = useState<LocalReel | null>(null);
  const [mutedStates, setMutedStates] = useState<Record<number, boolean>>({});

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const touchStartYRef = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);

  // Initialize local reels with data from props - Put highlighted reel first
  useEffect(() => {
    if (reelsFromProps && reelsFromProps.length > 0) {
      let formattedReels: LocalReel[] = reelsFromProps.map((reel: any) => ({
        postId: reel.postId,
        userId: reel.userId || userId || 'unknown',
        caption: reel.caption || '',
        tags: reel.tags || [],
        likes: reel.likes || 0,
        comments: reel.comments || 0,
        files: reel.files?.map((file: any) => ({
          presignedUrl: file.url || file.presignedUrl || '',
          type: file.type,
          isCustom: file.isCustom,
          fileName: file.fileName,
          s3Key: file.s3Key
        })) || [],
        isLiked: false,
        type: reel.type,
        timestamp: reel.timestamp,
        visibility: reel.visibility,
        pk: reel.pk,
        sk: reel.sk
      }));

      // If there's a highlight reel ID, move it to the beginning of the array
      if (highlightedPostId && formattedReels.length > 0) {
        const highlightIndex = formattedReels.findIndex(reel => reel.postId === highlightedPostId);
        if (highlightIndex !== -1) {
          const [highlightedReel] = formattedReels.splice(highlightIndex, 1);
          formattedReels = [highlightedReel, ...formattedReels];
        }
      }

      setLocalReels(formattedReels);
      
      // Initialize muted states - all videos start UNMUTED as requested
      const initialMutedStates: Record<number, boolean> = {};
      formattedReels.forEach((_, index) => {
        initialMutedStates[index] = false; // Changed from true to false
      });
      setMutedStates(initialMutedStates);
    } else {
      // Fallback: if no data passed, redirect back
      navigate(-1);
    }
  }, [reelsFromProps, highlightedPostId, userId, navigate]);

  // Handle navbar visibility and body scroll
  useEffect(() => {
    // Hide bottom navbar when in reels view for better immersion
    const bottomNav = document.querySelector('.bottom-navbar');
    if (bottomNav) {
      bottomNav.classList.add('hidden');
    }

    // Handle body scroll when modals are open
    if (selectedReel || shareReel) {
      document.body.classList.add('modal-open');
      if (currentPlayingIndex !== -1 && videoRefs.current[currentPlayingIndex]) {
        videoRefs.current[currentPlayingIndex]?.pause();
      }
    } else {
      document.body.classList.remove('modal-open');
      if (!isManuallyPaused && currentPlayingIndex !== -1 && videoRefs.current[currentPlayingIndex]) {
        videoRefs.current[currentPlayingIndex]?.play().catch(() => {});
      }
    }

    return () => {
      // Restore bottom navbar when leaving reels view
      const bottomNav = document.querySelector('.bottom-navbar');
      if (bottomNav) {
        bottomNav.classList.remove('hidden');
      }
      document.body.classList.remove('modal-open');
    };
  }, [selectedReel, shareReel, currentPlayingIndex, isManuallyPaused]);

  const truncateCaption = (caption: string, maxLength: number = 20): string => {
    if (!caption) return '';
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + '...';
  };

  // Initialize video refs array
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, localReels.length);
  }, [localReels]);

  // Auto-play video when it's in the center of the viewport
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = videoRefs.current.findIndex(ref => ref === entry.target);

          if (entry.isIntersecting && !isManuallyPaused && !selectedReel && !shareReel) {
            // Pause currently playing video if it's different
            if (currentPlayingIndex !== -1 && currentPlayingIndex !== index && videoRefs.current[currentPlayingIndex]) {
              videoRefs.current[currentPlayingIndex]?.pause();
            }

            setCurrentPlayingIndex(index);
            const video = entry.target as HTMLVideoElement;

            // Only try to play if video is not already playing
            if (video.paused) {
              // Set muted state from our state
              video.muted = mutedStates[index] ?? false; // Changed default from true to false
              
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    console.log(`Video ${index} auto-played successfully`);
                  })
                  .catch((error) => {
                    console.log(`Auto-play failed for video ${index}:`, error);
                    // If autoplay fails, try with muted
                    video.muted = true;
                    video.play().catch(() => {
                      // Silent catch for final failure
                    });
                  });
              }
            }
          } else if (currentPlayingIndex === index) {
            // Only pause if this is the currently playing video and it's no longer intersecting
            const video = entry.target as HTMLVideoElement;
            if (!video.paused) {
              video.pause();
            }
            setCurrentPlayingIndex(-1);
          }
        });
      },
      { threshold: 0.7 }
    );

    // Observe all videos
    videoRefs.current.forEach((video, _index) => {
      if (video && observerRef.current) {
        observerRef.current.observe(video);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [localReels, currentPlayingIndex, isManuallyPaused, selectedReel, shareReel, mutedStates]);

  const handleVideoClick = useCallback((index: number) => {
    // Ignore clicks if user is scrolling
    if (isScrollingRef.current) {
      isScrollingRef.current = false;
      return;
    }

    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      // Resume playing
      setIsManuallyPaused(false);
      video.muted = mutedStates[index] ?? false; // Changed default from true to false
      
      video.play().then(() => {
        setCurrentPlayingIndex(index);
      }).catch(() => {
        // If play fails, try with muted
        video.muted = true;
        video.play().then(() => {
          setCurrentPlayingIndex(index);
        }).catch(() => {
          // Silent catch for abort errors
        });
      });
    } else {
      // Pause
      video.pause();
      setIsManuallyPaused(true);
      setCurrentPlayingIndex(-1);
    }
  }, [currentPlayingIndex, mutedStates]);

  const handleMuteToggle = useCallback((index: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent video click from firing
    
    const video = videoRefs.current[index];
    if (!video) return;

    const newMutedState = !video.muted;
    
    // Update video muted state
    video.muted = newMutedState;
    
    // Update our state
    setMutedStates(prev => ({
      ...prev,
      [index]: newMutedState
    }));
  }, []);

  const handleCaptionClick = useCallback((index: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent video click from firing

    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const handleTouchStart = useCallback((_index: number) => (event: React.TouchEvent) => {
    touchStartYRef.current = event.touches[0].clientY;
    isScrollingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (Math.abs(event.touches[0].clientY - touchStartYRef.current) > 10) {
      isScrollingRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((index: number) => () => {
    if (!isScrollingRef.current) {
      // Simple: just toggle video play/pause on touch
      handleVideoClick(index);
    }
  }, [handleVideoClick]);

  const handleVideoRef = useCallback((index: number) => (el: HTMLVideoElement | null) => {
    videoRefs.current[index] = el;
  }, []);

  // Optimistic like handler
  const handleLike = useCallback((index: number, currentlyLiked: boolean) => {
    setLocalReels(prev => prev.map((reel, i) =>
      i === index
        ? {
          ...reel,
          isLiked: !currentlyLiked,
          likes: currentlyLiked ? Math.max(0, reel.likes - 1) : reel.likes + 1
        }
        : reel
    ));
  }, []);

  // Optimistic comment handler
  const handleComment = useCallback((index: number) => {
    const reel = localReels[index];
    if (reel) {
      setSelectedReel(reel);
    }
  }, [localReels]);

  // Share handler
  const handleShare = useCallback((index: number) => {
    const reel = localReels[index];
    if (reel) {
      setShareReel(reel);
    }
  }, [localReels]);

  // Handle new comment from modal
  const handleNewComment = useCallback((reelId: string) => {
    setLocalReels(prev => prev.map(reel =>
      reel.postId === reelId
        ? { ...reel, comments: reel.comments + 1 }
        : reel
    ));
  }, []);

  // Handle delete comment from modal
  const handleDeleteComment = useCallback((reelId: string) => {
    setLocalReels(prev => prev.map(reel =>
      reel.postId === reelId
        ? { ...reel, comments: Math.max(0, reel.comments - 1) }
        : reel
    ));
  }, []);

  // Close modals
  const handleCloseCommentModal = useCallback(() => {
    setSelectedReel(null);
  }, []);

  const handleCloseShareModal = useCallback(() => {
    setShareReel(null);
  }, []);

  // Handle video ended event
  const handleVideoEnded = useCallback((index: number) => {
    if (index < localReels.length - 1) {
      const nextVideo = videoRefs.current[index + 1];
      if (nextVideo) {
        setTimeout(() => {
          if (nextVideo.paused) {
            nextVideo.muted = mutedStates[index + 1] ?? false; // Changed default from true to false
            nextVideo.play().then(() => {
              setCurrentPlayingIndex(index + 1);
            }).catch(() => {
              // Silent catch
            });
          }
        }, 300);
      }
    }
  }, [localReels.length, mutedStates]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (!reelsFromProps || localReels.length === 0) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 text-lg">Loading reels...</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Main Reels Container */}
      <div
        ref={containerRef}
        className="bg-black h-screen overflow-y-scroll snap-y snap-mandatory relative"
        style={{
          scrollSnapType: 'y mandatory',
        }}
      >
        {/* Hide scrollbar */}
        <style>
          {`
            .snap-y::-webkit-scrollbar {
              display: none;
            }
            .snap-y {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}
        </style>

        {/* Reels List */}
        <div className="reels-list">
          {localReels.map((reel: LocalReel, index: number) => (
            <div
              key={reel.postId}
              id={`reel-${reel.postId}`}
              className="h-screen snap-start snap-always flex items-center justify-center relative"
              style={{
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              }}
            >
              {/* Video Container */}
              <div className="relative w-full h-full max-w-md mx-auto">
                {reel.files[0]?.presignedUrl && (
                  <>
                    <video
                      ref={handleVideoRef(index)}
                      className="w-full h-full object-cover"
                      src={reel.files[0].presignedUrl}
                      loop
                      muted={mutedStates[index] ?? false} // Changed default from true to false
                      playsInline
                      onClick={() => handleVideoClick(index)}
                      onTouchStart={handleTouchStart(index)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd(index)}
                      onEnded={() => handleVideoEnded(index)}
                    />

                    {/* Back Button - Individual for each video */}
                    <button
                      onClick={handleBack}
                      className="absolute top-4 left-4 z-50 w-10 h-10 bg-black/70 rounded-full flex items-center justify-center border border-white/30 hover:bg-black/90 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Mute/Unmute Button - Top Right */}
                    <button
                      onClick={(e) => handleMuteToggle(index, e)}
                      className="absolute top-4 right-4 z-40 w-10 h-10 bg-black/70 rounded-full flex items-center justify-center border border-white/30 hover:bg-black/90 transition-all duration-200"
                    >
                      {mutedStates[index] ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12m-4.5-9.5L6 9v6l1.5-1.5M5 15H3a1 1 0 01-1-1v-4a1 1 0 011-1h2l3.5-3.5A1 1 0 0110 3v18a1 1 0 01-1.5.866L5 15z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12m4.5-9.5L18 9v6l-1.5-1.5M19 15h2a1 1 0 001-1v-4a1 1 0 00-1-1h-2l-3.5-3.5A1 1 0 0014 3v18a1 1 0 001.5.866L19 15z" />
                        </svg>
                      )}
                    </button>

                    {/* Play/Pause Overlay - Only show when paused */}
                    {currentPlayingIndex !== index && (
                      <div
                        className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-30"
                        onClick={() => handleVideoClick(index)}
                      >
                        <div className="bg-black bg-opacity-50 rounded-full p-4">
                          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Bottom Info Overlay - Adjusted for bottom navbar space */}
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <div className="flex items-start gap-3 w-full">
                    {/* User Avatar */}
                    <div
                      className="flex-shrink-0 w-11 h-11 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-white border-opacity-20 shadow-lg cursor-pointer"
                      onClick={() => navigate(`/profile/${reel.userId}`)}
                    >
                      <span className="text-white font-bold text-sm">
                        {reel.userId?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>

                    {/* Caption and User Info */}
                    <div
                      className="cursor-pointer select-none max-w-[calc(100%-3rem)] flex-1 py-2"
                      onClick={(e) => handleCaptionClick(index, e)}
                    >
                      <p className="text-white font-bold text-sm mb-1.5 leading-tight">
                        @{reel.userId?.slice(0, 8) || 'unknown'}
                      </p>

                      {/* Caption - shows 20 chars initially, full when expanded */}
                      <p className={`text-white text-sm font-normal leading-relaxed break-words w-full transition-all duration-300 ${expandedDescriptions.has(index)
                          ? 'whitespace-normal'
                          : 'overflow-hidden whitespace-nowrap text-ellipsis max-w-full'
                        }`}>
                        {expandedDescriptions.has(index) ? reel.caption : truncateCaption(reel.caption)}
                      </p>

                      {/* Show tags only when expanded */}
                      {expandedDescriptions.has(index) && reel.tags && reel.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {reel.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="text-blue-400 text-xs font-medium bg-blue-400 bg-opacity-10 px-2 py-0.5 rounded-full border border-blue-400 border-opacity-30">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Show read more only if caption is longer than 20 chars */}
                      {reel.caption && reel.caption.length > 20 && (
                        <div className="text-white text-opacity-80 text-xs font-semibold mt-2 inline-flex items-center gap-1 px-2 py-1 bg-white bg-opacity-10 rounded-full transition-all duration-200">
                          {expandedDescriptions.has(index) ? 'Show less' : 'Read more'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Bar - Adjusted for bottom navbar space */}
                <div className="absolute right-4 bottom-40 flex flex-col items-center gap-2">
                  <div className="flex flex-col items-center gap-4">
                    {/* Like Button */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer ${reel.isLiked ? 'bg-red-500/20' : 'bg-black/50'
                          }`}
                        onClick={() => handleLike(index, reel.isLiked || false)}
                      >
                        <svg
                          className="w-7 h-7"
                          fill={reel.isLiked ? "#ff0000" : "white"}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
                        </svg>
                      </div>
                      <span className="text-white text-sm font-bold mt-1">{reel.likes}</span>
                    </div>

                    {/* Comment Button */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
                        onClick={() => handleComment(index)}
                      >
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM8 15h2.5l1.5 1.5 1.5-1.5H16v-2.5l1.5-1.5-1.5-1.5V8h-2.5L13 6.5 11.5 8H9v2.5L7.5 12 9 13.5V15z" />
                        </svg>
                      </div>
                      <span className="text-white text-sm font-bold mt-1">{reel.comments}</span>
                    </div>

                    {/* Share Button */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
                        onClick={() => handleShare(index)}
                      >
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                        </svg>
                      </div>
                      <span className="text-white text-sm font-bold mt-1">Share</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* End of Feed */}
        {localReels.length > 0 && (
          <div className="h-screen snap-start flex items-center justify-center bg-black">
            <div className="text-center text-gray-400">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-1">You've reached the end</p>
              <p className="text-sm">No more reels to show</p>
            </div>
          </div>
        )}
      </div>

      {/* MODALS RENDERED OUTSIDE THE SCROLL CONTAINER */}
      {selectedReel && (
        <CommentModal
          postId={selectedReel.postId}
          isOpen={true}
          onClose={handleCloseCommentModal}
          userName={selectedReel.userId || 'unknown'}
          postMessage={selectedReel.caption}
          currentUserId={"current-user-id"}
          onNewComment={handleNewComment}
          onDeleteComment={handleDeleteComment}
        />
      )}

      {shareReel && (
        <ShareComponent
          postId={shareReel.postId}
          userName={shareReel.userId || 'unknown'}
          message={shareReel.caption}
          timestamp={new Date().toISOString()}
          likeCount={shareReel.likes}
          commentCount={shareReel.comments}
          isOpen={true}
          onClose={handleCloseShareModal}
        />
      )}
    </>
  );
};

export default ReelsAllPage;