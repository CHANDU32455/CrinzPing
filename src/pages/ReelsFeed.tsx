import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "react-oidc-context";
import { useReels } from "../feed/hooks/usereels";
import AdUnit from "../components/ads/GeneralAdUnit";
import ShareComponent from "../components/shared/ShareComponent";
import CommentModal from "../components/feed/CommentModal";
import ReelItem from "../utils/ReelsFeed_ReelItem";
import { contentManager } from "../utils/Posts_Reels_Stats_Syncer";
import "../styles/reels-feed.css";

const APP_CONFIG = {
  ADS_ENABLED: process.env.NODE_ENV === 'production'
};

interface LocalReel {
  id: number;
  userId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  description: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  postId: string;
  likes: number;
  comments: number;
  isLikedByUser?: boolean;
  user?: {
    userName: string;
    profilePicture: string;
    tagline: string;
  };
}

interface VideoPlaybackState {
  currentTime: number;
  isPlaying: boolean;
  hasBeenViewed: boolean;
  isLoaded: boolean;
}

const videoPlaybackStates = new Map<number, VideoPlaybackState>();

function ReelsFeed() {
  const auth = useAuth();
  const userId = auth.user?.profile?.sub;
  const accessToken = auth.user?.access_token;

  const { reels, loading, error, hasMore, loadMore, retry } = useReels();
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(-1);
  const [isManuallyPaused, setIsManuallyPaused] = useState<boolean>(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    postId: string;
    userName: string;
    postMessage: string;
    commentCount: number;
    contentType?: 'post' | 'reel' | 'crinz_message';
  } | null>(null);
  const [shareReel, setShareReel] = useState<LocalReel | null>(null);
  const [doubleTapLike, setDoubleTapLike] = useState<{ index: number; active: boolean }>({ index: -1, active: false });

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasInteractedRef = useRef<boolean>(false);
  const lastTapRef = useRef<number>(0);

  // Track muted state and loading priority
  const mutedStatesRef = useRef<boolean[]>([]);
  const loadingPriorityRef = useRef<Set<number>>(new Set([0]));

  const [localReels, setLocalReels] = useState<LocalReel[]>([]);

  // Initialize reels with enhanced state tracking
  useEffect(() => {
    const updatedReels = reels.map(reel => ({
      ...reel,
      isLiked: reel.isLikedByUser || false
    }));
    setLocalReels(updatedReels);

    // Initialize content manager stats
    updatedReels.forEach(reel => {
      contentManager.initializeContentStats(reel.postId, {
        likeCount: reel.likes,
        commentCount: reel.comments,
        shareCount: 0,
        viewCount: 0,
        isLikedByUser: reel.isLikedByUser || false
      });
    });

    // Initialize video states
    mutedStatesRef.current = new Array(reels.length).fill(false);
    reels.forEach((_, index) => {
      if (!videoPlaybackStates.has(index)) {
        videoPlaybackStates.set(index, {
          currentTime: 0,
          isPlaying: false,
          hasBeenViewed: false,
          isLoaded: false
        });
      }
    });

    loadingPriorityRef.current = new Set([0, 1]);
  }, [reels]);

  // Handle modals - pause current video
  useEffect(() => {
    if (commentModal || shareReel) {
      document.body.classList.add('modal-open');
      if (currentPlayingIndex !== -1) {
        const video = videoRefs.current[currentPlayingIndex];
        if (video) {
          videoPlaybackStates.set(currentPlayingIndex, {
            ...videoPlaybackStates.get(currentPlayingIndex)!,
            currentTime: video.currentTime,
            isPlaying: false
          });
          video.pause();
        }
      }
    } else {
      document.body.classList.remove('modal-open');
      if (!isManuallyPaused && currentPlayingIndex !== -1) {
        playVideoSafely(currentPlayingIndex);
      }
    }
  }, [commentModal, shareReel, currentPlayingIndex, isManuallyPaused]);

  // Enhanced video playback with priority loading
  const playVideoSafely = async (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    const playbackState = videoPlaybackStates.get(index) || {
      currentTime: 0,
      isPlaying: false,
      hasBeenViewed: false,
      isLoaded: false
    };

    if (!playbackState.isLoaded && video.readyState < 3) {
      video.load();
    }

    try {
      if (playbackState.hasBeenViewed && playbackState.currentTime > 0) {
        video.currentTime = playbackState.currentTime;
      } else {
        video.currentTime = 0;
        videoPlaybackStates.set(index, {
          ...playbackState,
          hasBeenViewed: true
        });
      }

      video.muted = false;
      await video.play();

      videoPlaybackStates.set(index, {
        ...playbackState,
        isPlaying: true,
        hasBeenViewed: true,
        isLoaded: true
      });

    } catch (error) {
      try {
        video.muted = true;
        await video.play();
        mutedStatesRef.current[index] = true;
        videoPlaybackStates.set(index, {
          ...playbackState,
          isPlaying: true,
          hasBeenViewed: true,
          isLoaded: true
        });
      } catch (mutedError) {
        videoPlaybackStates.set(index, {
          ...playbackState,
          isPlaying: false
        });
      }
    }
  };

  // Smart video loading priority system
  const updateLoadingPriority = useCallback((currentIndex: number) => {
    const newPriority = new Set<number>();

    newPriority.add(currentIndex);

    if (currentIndex < localReels.length - 1) {
      newPriority.add(currentIndex + 1);
    }

    if (currentIndex > 0) {
      newPriority.add(currentIndex - 1);
    }

    loadingPriorityRef.current = newPriority;

    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (newPriority.has(index)) {
          video.preload = "auto";
          video.load();
        } else {
          video.preload = "metadata";
        }
      }
    });
  }, [localReels.length]);

  // Enhanced intersection observer for smart video management
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleVideos = entries.filter(entry => entry.isIntersecting);

        if (visibleVideos.length === 0) {
          if (currentPlayingIndex !== -1) {
            const video = videoRefs.current[currentPlayingIndex];
            if (video) {
              videoPlaybackStates.set(currentPlayingIndex, {
                ...videoPlaybackStates.get(currentPlayingIndex)!,
                currentTime: video.currentTime,
                isPlaying: false
              });
              video.pause();
            }
            setCurrentPlayingIndex(-1);
          }
          return;
        }

        let mostCenteredIndex = -1;
        let smallestDistance = Infinity;

        visibleVideos.forEach(entry => {
          const index = videoRefs.current.findIndex(ref => ref === entry.target);
          const rect = entry.boundingClientRect;
          const viewportCenter = window.innerHeight / 2;
          const videoCenter = rect.top + (rect.height / 2);
          const distance = Math.abs(videoCenter - viewportCenter);

          if (distance < smallestDistance) {
            smallestDistance = distance;
            mostCenteredIndex = index;
          }
        });

        if (mostCenteredIndex !== -1 && mostCenteredIndex !== currentPlayingIndex && !isManuallyPaused && !commentModal && !shareReel) {
          if (currentPlayingIndex !== -1) {
            const currentVideo = videoRefs.current[currentPlayingIndex];
            if (currentVideo) {
              videoPlaybackStates.set(currentPlayingIndex, {
                ...videoPlaybackStates.get(currentPlayingIndex)!,
                currentTime: currentVideo.currentTime,
                isPlaying: false
              });
              currentVideo.pause();
            }
          }

          updateLoadingPriority(mostCenteredIndex);
          setCurrentPlayingIndex(mostCenteredIndex);
          playVideoSafely(mostCenteredIndex);
        }
      },
      {
        threshold: 0.7,
        rootMargin: '0px 0px 0px 0px'
      }
    );

    observerRef.current = observer;
    videoRefs.current.forEach(video => video && observer.observe(video));

    return () => observer.disconnect();
  }, [localReels.length, isManuallyPaused, commentModal, shareReel, currentPlayingIndex, updateLoadingPriority]);

  // Load more on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !hasMore || loading) return;

      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        loadMore();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loading, loadMore]);

  // Double tap to like functionality
  const handleDoubleTap = useCallback((index: number, event: React.MouseEvent) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapRef.current;

    if (tapLength < 300 && tapLength > 0) {
      event.preventDefault();
      setDoubleTapLike({ index, active: true });

      handleLike(index);

      setTimeout(() => {
        setDoubleTapLike({ index: -1, active: false });
      }, 1000);

      lastTapRef.current = 0;
    } else {
      lastTapRef.current = currentTime;
    }
  }, []);

  // Enhanced video click handler
  const handleVideoClick = async (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    hasInteractedRef.current = true;

    if (video.paused) {
      if (currentPlayingIndex !== -1 && currentPlayingIndex !== index) {
        const currentVideo = videoRefs.current[currentPlayingIndex];
        if (currentVideo) {
          videoPlaybackStates.set(currentPlayingIndex, {
            ...videoPlaybackStates.get(currentPlayingIndex)!,
            currentTime: currentVideo.currentTime,
            isPlaying: false
          });
          currentVideo.pause();
        }
      }

      setIsManuallyPaused(false);
      setCurrentPlayingIndex(index);
      updateLoadingPriority(index);

      if (mutedStatesRef.current[index]) {
        try {
          video.muted = false;
          await video.play();
          mutedStatesRef.current[index] = false;
          videoPlaybackStates.set(index, {
            ...videoPlaybackStates.get(index)!,
            isPlaying: true
          });
        } catch (error) {
          video.muted = true;
          await video.play();
          videoPlaybackStates.set(index, {
            ...videoPlaybackStates.get(index)!,
            isPlaying: true
          });
        }
      } else {
        await playVideoSafely(index);
      }
    } else {
      video.pause();
      videoPlaybackStates.set(index, {
        ...videoPlaybackStates.get(index)!,
        currentTime: video.currentTime,
        isPlaying: false
      });
      setIsManuallyPaused(true);
      setCurrentPlayingIndex(-1);
    }
  };

  // Video event handlers
  const handleVideoError = (index: number) => {
    console.error(`Video ${index} failed to load`);
    videoPlaybackStates.set(index, {
      ...videoPlaybackStates.get(index)!,
      isLoaded: false
    });
  };

  const handleVideoLoaded = (index: number) => {
    console.log(`Video ${index} loaded successfully`);
    videoPlaybackStates.set(index, {
      ...videoPlaybackStates.get(index)!,
      isLoaded: true
    });
  };

  const handleVideoTimeUpdate = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    const playbackState = videoPlaybackStates.get(index);
    if (playbackState && video.currentTime !== playbackState.currentTime) {
      videoPlaybackStates.set(index, {
        ...playbackState,
        currentTime: video.currentTime
      });
    }
  };

  const handleVideoEnded = async (index: number) => {
    videoPlaybackStates.set(index, {
      currentTime: 0,
      isPlaying: false,
      hasBeenViewed: true,
      isLoaded: true
    });

    if (index < localReels.length - 1) {
      const nextIndex = index + 1;
      const nextVideo = videoRefs.current[nextIndex];

      if (nextVideo && nextVideo.paused) {
        videoRefs.current[index]?.pause();
        setCurrentPlayingIndex(nextIndex);
        updateLoadingPriority(nextIndex);
        await playVideoSafely(nextIndex);

        setTimeout(() => {
          const nextReelElement = containerRef.current?.querySelector(`[data-reel-index="${nextIndex}"]`);
          nextReelElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  };

  // Interaction handlers
  const handleCaptionClick = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleLike = useCallback((index: number) => {
    if (!userId) return;

    const reel = localReels[index];
    const newLikedState = !reel.isLiked;
    const newLikeCount = newLikedState ? reel.likes + 1 : Math.max(0, reel.likes - 1);

    setLocalReels(prev => prev.map((item, i) =>
      i === index ? {
        ...item,
        isLiked: newLikedState,
        likes: newLikeCount
      } : item
    ));

    contentManager.likeContent(reel.postId, 'reel', userId, !!reel.isLiked);
  }, [localReels, userId]);

  const handleComment = useCallback((index: number) => {
    const reel = localReels[index];
    setCommentModal({
      isOpen: true,
      postId: reel.postId,
      userName: reel.user?.userName || reel.userId,
      postMessage: reel.caption,
      commentCount: reel.comments,
      contentType: 'reel'
    });
  }, [localReels]);

  const handleShare = (index: number) => {
    setShareReel(localReels[index]);
  };

  const handleNewComment = useCallback((postId: string) => {
    setLocalReels(prev => prev.map(reel =>
      reel.postId === postId ? {
        ...reel,
        comments: (reel.comments || 0) + 1
      } : reel
    ));

    const currentStats = contentManager.getContentStats(postId);
    if (currentStats) {
      contentManager.initializeContentStats(postId, {
        ...currentStats,
        commentCount: currentStats.commentCount + 1
      });
    }
  }, []);

  const handleDeleteComment = useCallback((postId: string) => {
    setLocalReels(prev => prev.map(reel =>
      reel.postId === postId ? {
        ...reel,
        comments: Math.max(0, (reel.comments || 1) - 1)
      } : reel
    ));

    const currentStats = contentManager.getContentStats(postId);
    if (currentStats) {
      contentManager.initializeContentStats(postId, {
        ...currentStats,
        commentCount: Math.max(0, currentStats.commentCount - 1)
      });
    }
  }, []);

  // Video ref handler with priority loading
  const handleVideoRef = (index: number) => (el: HTMLVideoElement | null) => {
    videoRefs.current[index] = el;
    if (el) {
      mutedStatesRef.current[index] = false;

      if (loadingPriorityRef.current.has(index)) {
        el.preload = "auto";
      } else {
        el.preload = "metadata";
      }

      const playbackState = videoPlaybackStates.get(index);
      if (playbackState && playbackState.currentTime > 0) {
        el.currentTime = playbackState.currentTime;
      }
    }
  };

  // Helper functions
  const handleCloseCommentModal = () => setCommentModal(null);
  const handleCloseShareModal = () => setShareReel(null);

  // Render reels with ads
  const getReelsWithAds = useCallback(() => {
    const items: React.ReactNode[] = [];

    localReels.forEach((reel, index) => {
      items.push(
        <ReelItem
          key={reel.postId}
          reel={reel}
          index={index}
          isPlaying={currentPlayingIndex === index}
          isMuted={mutedStatesRef.current[index]}
          showDoubleTap={doubleTapLike.index === index && doubleTapLike.active}
          isExpanded={expandedDescriptions.has(index)}
          onVideoClick={handleVideoClick}
          onDoubleTap={handleDoubleTap}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onCaptionClick={handleCaptionClick}
          onVideoRef={handleVideoRef}
          onVideoEnded={handleVideoEnded}
          onVideoError={handleVideoError}
          onVideoLoaded={handleVideoLoaded}
          onVideoTimeUpdate={handleVideoTimeUpdate}
        />
      );

      if (APP_CONFIG.ads && (index + 1) % 2 === 0) {
        items.push(
          <div key={`ad-${index}`} className="reel-ad-wrapper">
            <AdUnit />
          </div>
        );
      }
    });

    return items;
  }, [localReels, currentPlayingIndex, expandedDescriptions, doubleTapLike]);

  if (error) {
    return (
      <div className="reels-error">
        <div className="reels-error-content">
          <p>Failed to load reels</p>
          <button onClick={retry}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="reels-feed-container">
        <div className="reels-list">
          {getReelsWithAds()}
        </div>

        {loading && (
          <div className="reels-loading">
            <div className="reels-loading-spinner"></div>
          </div>
        )}

        {!hasMore && localReels.length > 0 && (
          <div className="reels-end">
            <p>No more reels to show</p>
          </div>
        )}
      </div>

      {commentModal && (
        <CommentModal
          postId={commentModal.postId}
          isOpen={commentModal.isOpen}
          onClose={handleCloseCommentModal}
          userName={commentModal.userName}
          postMessage={commentModal.postMessage}
          commentCount={commentModal.commentCount}
          contentType={commentModal.contentType}
          currentUserId={userId}
          accessToken={accessToken}
          onNewComment={handleNewComment}
          onDeleteComment={handleDeleteComment}
        />
      )}

      {shareReel && (
        <ShareComponent
          postId={shareReel.postId}
          userName={shareReel.user?.userName || shareReel.userId || 'unknown'}
          message={shareReel.caption}
          timestamp={shareReel.timestamp || Date.now()}
          likeCount={shareReel.likes}
          commentCount={shareReel.comments}
          isOpen={true}
          onClose={handleCloseShareModal}
          contentType="reel"
          mediaUrl={shareReel.files[0]?.presignedUrl}
        />
      )}
    </>
  );
}

export default ReelsFeed;