import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useReels, type Reel } from "../../hooks/usereels";
import "../../css/ReelsFeed.css";
import ShareModal from "./ShareModal";
import CommentModal from "./CommentModal";

interface LocalReel extends Reel {
  isLiked?: boolean;
}

function ReelsFeed() {
  const navigate = useNavigate();
  const { reels, loading, hasMore, loadMore } = useReels();
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(-1);
  const [isManuallyPaused, setIsManuallyPaused] = useState<boolean>(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  const [localReels, setLocalReels] = useState<LocalReel[]>([]);
  const [selectedReel, setSelectedReel] = useState<LocalReel | null>(null);
  const [shareReel, setShareReel] = useState<LocalReel | null>(null);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const touchStartYRef = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);

  // Initialize local reels when reels change
  useEffect(() => {
    setLocalReels(reels.map(reel => ({ ...reel, isLiked: false })));
  }, [reels]);

  useEffect(() => {
    // Handle body scroll when modals are open
    if (selectedReel || shareReel) {
      document.body.classList.add('modal-open');
      // Also pause the current video when modal opens
      if (currentPlayingIndex !== -1 && videoRefs.current[currentPlayingIndex]) {
        videoRefs.current[currentPlayingIndex]?.pause();
      }
    } else {
      document.body.classList.remove('modal-open');
      // Resume playing if it was manually paused
      if (!isManuallyPaused && currentPlayingIndex !== -1 && videoRefs.current[currentPlayingIndex]) {
        videoRefs.current[currentPlayingIndex]?.play().catch(() => {
          // Silent catch
        });
      }
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [selectedReel, shareReel, currentPlayingIndex, isManuallyPaused]);
  
  const truncateCaption = (caption: string, maxLength: number = 20): string => {
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
              // Try to play with audio if possible
              video.muted = false;

              // Use a small timeout to avoid race conditions
              setTimeout(() => {
                if (video.paused && entry.isIntersecting) {
                  const playPromise = video.play();

                  if (playPromise !== undefined) {
                    playPromise
                      .then(() => {
                        // Autoplay started successfully
                      })
                      .catch(() => {
                        // Autoplay was prevented, fall back to muted
                        video.muted = true;
                        video.play().catch(() => {
                          // Silent catch for abort errors
                        });
                      });
                  }
                }
              }, 100);
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

    videoRefs.current.forEach(video => {
      if (video && observerRef.current) {
        observerRef.current.observe(video);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [localReels, currentPlayingIndex, isManuallyPaused, selectedReel, shareReel]);

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
      video.muted = false;

      video.play().then(() => {
        setCurrentPlayingIndex(index);
      }).catch(() => {
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
  }, [currentPlayingIndex]);

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

  // Load more reels when reaching the end
  useEffect(() => {
    if (!hasMore || loading) return;

    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
          loadMore();
        }
      }
    };

    const debouncedScroll = debounce(handleScroll, 200);
    const currentContainer = containerRef.current;

    if (currentContainer) {
      currentContainer.addEventListener('scroll', debouncedScroll);
      return () => currentContainer.removeEventListener('scroll', debouncedScroll);
    }
  }, [hasMore, loading, loadMore]);

  // Simple debounce function
  const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  // Handle video ended event
  const handleVideoEnded = useCallback((index: number) => {
    if (index < localReels.length - 1) {
      const nextVideo = videoRefs.current[index + 1];
      if (nextVideo) {
        setTimeout(() => {
          if (nextVideo.paused) {
            nextVideo.play().then(() => {
              setCurrentPlayingIndex(index + 1);
            }).catch(() => {
              // Silent catch
            });
          }
        }, 300);
      }
    }
  }, [localReels.length]);

  return (
    <>
      {/* Main Reels Container */}
      <div
        ref={containerRef}
        className="reels-feed-container"
      >
        {/* Reels List */}
        <div className="reels-list">
          {localReels.map((reel: LocalReel, index: number) => (
            <div
              key={reel.postId}
              className="reel-item"
            >
              {/* Video Container */}
              <div className="reel-video-container">
                {reel.files[0]?.presignedUrl && (
                  <>
                    <video
                      ref={handleVideoRef(index)}
                      className="reel-video"
                      src={reel.files[0].presignedUrl}
                      loop
                      muted={false}
                      playsInline
                      onClick={() => handleVideoClick(index)}
                      onTouchStart={handleTouchStart(index)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd(index)}
                      onEnded={() => handleVideoEnded(index)}
                    />

                    {/* Play/Pause Overlay */}
                    {currentPlayingIndex !== index && (
                      <div
                        className="reel-play-overlay"
                        onClick={() => handleVideoClick(index)}
                      >
                        <div className="reel-play-button">
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Bottom Info Overlay */}
                <div className="reel-info-overlay">
                  <div className="reel-user-info">
                    {/* User Avatar */}
                    <div className="reel-user-avatar" onClick={() => navigate(`/profile/${reel.userId}`)}>
                      <span>
                        {reel.userId?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>

                    {/* Caption and User Info */}
                    <div
                      className="reel-caption-container"
                      onClick={(e) => handleCaptionClick(index, e)}
                    >
                      <p className="reel-username">
                        @{reel.userId?.slice(0, 8) || 'unknown'}
                      </p>

                      {/* Caption - shows 20 chars initially, full when expanded */}
                      <p className={`reel-caption ${expandedDescriptions.has(index) ? 'expanded' : ''}`}>
                        {expandedDescriptions.has(index) ? reel.caption : truncateCaption(reel.caption)}
                      </p>

                      {/* Show tags only when expanded */}
                      {expandedDescriptions.has(index) && reel.tags && reel.tags.length > 0 && (
                        <div className="reel-tags">
                          {reel.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="reel-tag">#{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Show read more only if caption is longer than 20 chars */}
                      {reel.caption.length > 20 && (
                        <div className="reel-read-more">
                          {expandedDescriptions.has(index) ? 'Show less' : 'Read more'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Bar */}
                <div className="reel-actions-right">
                  <div className="reel-action-buttons">
                    <div className="reel-action-item">
                      <div
                        className={`reel-action-button ${reel.isLiked ? 'liked' : ''}`}
                        onClick={() => handleLike(index, reel.isLiked || false)}
                      >
                        <svg
                          fill={reel.isLiked ? "#ff0000" : "currentColor"}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
                        </svg>
                      </div>
                      <span className="reel-action-count">{reel.likes}</span>
                    </div>

                    <div className="reel-action-item">
                      <div
                        className="reel-action-button"
                        onClick={() => handleComment(index)}
                      >
                        <svg fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM8 15h2.5l1.5 1.5 1.5-1.5H16v-2.5l1.5-1.5-1.5-1.5V8h-2.5L13 6.5 11.5 8H9v2.5L7.5 12 9 13.5V15z" />
                        </svg>
                      </div>
                      <span className="reel-action-count">{reel.comments}</span>
                    </div>

                    <div className="reel-action-item">
                      <div
                        className="reel-action-button"
                        onClick={() => handleShare(index)}
                      >
                        <svg fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                        </svg>
                      </div>
                      <span className="reel-action-count">Share</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="reels-loading">
            <div className="reels-loading-spinner"></div>
          </div>
        )}

        {/* End of Feed */}
        {!hasMore && localReels.length > 0 && (
          <div className="reels-end">
            <div className="reels-end-content">
              <div className="reels-end-icon">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                </svg>
              </div>
              <p className="reels-end-title">You've reached the end</p>
              <p className="reels-end-subtitle">No more reels to show</p>
            </div>
          </div>
        )}
      </div>

      {/* MODALS RENDERED OUTSIDE THE SCROLL CONTAINER */}
      
      {/* Comment Modal */}
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

      {/* Share Modal */}
      {shareReel && (
        <ShareModal
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

export default ReelsFeed;