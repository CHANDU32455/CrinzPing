import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserReels } from "../hooks/useUserPosts_Reels";
import ShareComponent from "../components/shared/ShareComponent";
import CommentModal from "../components/feed/CommentModal";
import { contentManager } from "../utils/Posts_Reels_Stats_Syncer";
import { useAuth } from "react-oidc-context";
import "../styles/reels-feed.css";


interface LocalReel {
  postId: string;
  type: string;
  caption: string;
  tags: string[];
  timestamp: number;
  files: Array<{
    s3Key: string;
    type: string;
    url: string;
  }>;
  likes: number;
  comments: number;
  likedByUser: boolean;
  userId: string;
  isLiked?: boolean;
}

function UserReelsPage() {
  const navigate = useNavigate();
  const { userId: profileUserId } = useParams<{ userId: string }>();
  const auth = useAuth();
  const currentUserId = auth.user?.profile?.sub;
  const accessToken = auth.user?.access_token;

  // Use user-specific reels hook
  const { posts: reels, userDetails, loading, hasMore, loadMore } = useUserReels(profileUserId);
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

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Track muted state for each video individually
  const mutedStatesRef = useRef<boolean[]>([]);

  // Local reels state with user details
  const [localReels, setLocalReels] = useState<LocalReel[]>([]);

  useEffect(() => {
    // Transform API posts to local reels format with user details
    const updatedReels = reels.map(reel => ({
      ...reel,
      isLiked: reel.likedByUser || false
    }));
    setLocalReels(updatedReels);

    // Initialize content manager stats for each reel
    updatedReels.forEach(reel => {
      contentManager.initializeContentStats(reel.postId, {
        likeCount: reel.likes,
        commentCount: reel.comments,
        shareCount: 0,
        viewCount: 0,
        isLikedByUser: reel.likedByUser || false
      });
    });

    // Initialize muted states for all reels
    mutedStatesRef.current = new Array(reels.length).fill(false);
  }, [reels]);

  // Handle modals
  useEffect(() => {
    if (commentModal || shareReel) {
      document.body.classList.add('modal-open');
      if (currentPlayingIndex !== -1) {
        videoRefs.current[currentPlayingIndex]?.pause();
      }
    } else {
      document.body.classList.remove('modal-open');
      if (!isManuallyPaused && currentPlayingIndex !== -1) {
        playVideoSafely(currentPlayingIndex);
      }
    }
  }, [commentModal, shareReel, currentPlayingIndex, isManuallyPaused]);

  // Safe video playback with proper audio management
  const playVideoSafely = async (index: number) => {
    const video = videoRefs.current[index];
    if (!video || !video.paused) return;

    try {
      // Reset video state first
      video.currentTime = 0;

      // Try playing with audio first
      video.muted = false;
      await video.play();

      console.log(`✅ Video ${index} playing with audio`);

    } catch {
      console.log(`🔇 Video ${index} autoplay prevented, trying muted`);

      // If autoplay fails, try muted
      try {
        video.muted = true;
        await video.play();
        mutedStatesRef.current[index] = true;
        console.log(`✅ Video ${index} playing muted`);
      } catch {
        console.log(`❌ Video ${index} failed to play even muted`);
        // Video completely failed, show play button overlay
      }
    }
  };

  // Only play the most visible video
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most centered video
        const visibleVideos = entries.filter(entry => entry.isIntersecting);

        if (visibleVideos.length === 0) {
          // No videos visible, pause current
          if (currentPlayingIndex !== -1) {
            videoRefs.current[currentPlayingIndex]?.pause();
            setCurrentPlayingIndex(-1);
          }
          return;
        }

        // Find the most centered video
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

        // Only switch if we have a new centered video
        if (mostCenteredIndex !== -1 && mostCenteredIndex !== currentPlayingIndex && !isManuallyPaused && !commentModal && !shareReel) {
          // Pause current video
          if (currentPlayingIndex !== -1) {
            videoRefs.current[currentPlayingIndex]?.pause();
          }

          // Play new centered video
          setCurrentPlayingIndex(mostCenteredIndex);
          playVideoSafely(mostCenteredIndex);
        }
      },
      {
        threshold: 0.6,
        rootMargin: '0px 0px 0px 0px'
      }
    );

    observerRef.current = observer;
    videoRefs.current.forEach(video => video && observer.observe(video));

    return () => observer.disconnect();
  }, [localReels.length, isManuallyPaused, commentModal, shareReel, currentPlayingIndex]);

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

  // Video click handler with proper audio management
  const handleVideoClick = async (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      // Pause currently playing video if different
      if (currentPlayingIndex !== -1 && currentPlayingIndex !== index) {
        videoRefs.current[currentPlayingIndex]?.pause();
      }

      setIsManuallyPaused(false);
      setCurrentPlayingIndex(index);

      // If video was muted due to autoplay restrictions, try to unmute on user interaction
      if (mutedStatesRef.current[index]) {
        try {
          video.muted = false;
          await video.play();
          mutedStatesRef.current[index] = false;
          console.log(`🔊 Video ${index} unmuted by user click`);
        } catch {
          // If unmuting fails, keep it muted but play
          video.muted = true;
          await video.play();
          console.log(`🔇 Video ${index} still muted after click`);
        }
      } else {
        // Normal play
        await playVideoSafely(index);
      }
    } else {
      video.pause();
      setIsManuallyPaused(true);
      setCurrentPlayingIndex(-1);
    }
  };

  // Video error handler
  const handleVideoError = (index: number) => {
    console.error(`❌ Video ${index} failed to load`);
  };

  // Video loaded handler
  const handleVideoLoaded = (index: number) => {
    console.log(`📹 Video ${index} loaded successfully`);
  };

  // Caption click handler
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

  // Like handler using contentManager
  const handleLike = useCallback((index: number) => {
    if (!currentUserId) return;

    const reel = localReels[index];
    const newLikedState = !reel.isLiked;
    const newLikeCount = newLikedState ? reel.likes + 1 : Math.max(0, reel.likes - 1);

    // Optimistic UI update
    setLocalReels(prev => prev.map((item, i) =>
      i === index ? {
        ...item,
        isLiked: newLikedState,
        likes: newLikeCount
      } : item
    ));

    console.log('🔄 UserReelsPage - Liking reel:', {
      id: reel.postId,
      userId: currentUserId,
      currentlyLiked: reel.isLiked
    });

    // Use centralized content manager
    contentManager.likeContent(reel.postId, 'reel', currentUserId, !!reel.isLiked);
  }, [localReels, currentUserId]);

  // Comment handler using user details from API
  const handleComment = useCallback((index: number) => {
    const reel = localReels[index];
    console.log('🔍 Opening comment for reel:', {
      id: reel.postId,
      content: reel.caption,
      commentCount: reel.comments,
      contentType: 'reel',
      userName: userDetails?.userName || reel.userId
    });

    setCommentModal({
      isOpen: true,
      postId: reel.postId,
      userName: userDetails?.userName || reel.userId,
      postMessage: reel.caption,
      commentCount: reel.comments,
      contentType: 'reel'
    });
  }, [localReels, userDetails]);

  const handleShare = (index: number) => {
    setShareReel(localReels[index]);
  };

  // Comment modal callbacks to update local state
  const handleNewComment = useCallback((postId: string) => {
    console.log('✅ UserReelsPage: New comment added to reel:', postId);

    // Update local reels state
    setLocalReels(prev => prev.map(reel =>
      reel.postId === postId ? {
        ...reel,
        comments: (reel.comments || 0) + 1
      } : reel
    ));

    // Update content manager stats
    const currentStats = contentManager.getContentStats(postId);
    if (currentStats) {
      contentManager.initializeContentStats(postId, {
        ...currentStats,
        commentCount: currentStats.commentCount + 1
      });
    }
  }, []);

  const handleDeleteComment = useCallback((postId: string) => {
    console.log('✅ UserReelsPage: Comment deleted from reel:', postId);

    // Update local reels state
    setLocalReels(prev => prev.map(reel =>
      reel.postId === postId ? {
        ...reel,
        comments: Math.max(0, (reel.comments || 1) - 1)
      } : reel
    ));

    // Update content manager stats
    const currentStats = contentManager.getContentStats(postId);
    if (currentStats) {
      contentManager.initializeContentStats(postId, {
        ...currentStats,
        commentCount: Math.max(0, currentStats.commentCount - 1)
      });
    }
  }, []);

  // Video ref handler
  const handleVideoRef = (index: number) => (el: HTMLVideoElement | null) => {
    videoRefs.current[index] = el;
    if (el) {
      // Reset muted state when new video element is created
      mutedStatesRef.current[index] = false;
    }
  };

  // Video ended - auto play next with proper audio handling
  const handleVideoEnded = async (index: number) => {
    if (index < localReels.length - 1) {
      const nextIndex = index + 1;
      const nextVideo = videoRefs.current[nextIndex];

      if (nextVideo && nextVideo.paused) {
        // Pause current video
        videoRefs.current[index]?.pause();

        // Play next video
        setCurrentPlayingIndex(nextIndex);
        await playVideoSafely(nextIndex);

        // Scroll next video into view smoothly
        setTimeout(() => {
          const nextReelElement = containerRef.current?.querySelector(`[data-reel-index="${nextIndex}"]`);
          nextReelElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  };

  // Helper function
  const truncateCaption = (caption: string, maxLength: number = 20): string => {
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + '...';
  };

  // Modal handlers
  const handleCloseCommentModal = () => setCommentModal(null);
  const handleCloseShareModal = () => setShareReel(null);

  return (
    <>
      <div className="user-reels-page">

        <div ref={containerRef} className="reels-feed-container">
          <div className="reels-list">
            {localReels.map((reel, index) => (
              <div key={reel.postId} className="reel-item" data-reel-index={index}>
                <div className="reel-video-container">
                  {reel.files[0]?.url && (
                    <>
                      <video
                        ref={handleVideoRef(index)}
                        className="reel-video"
                        src={reel.files[0].url}
                        loop
                        muted={mutedStatesRef.current[index]}
                        playsInline
                        onClick={() => handleVideoClick(index)}
                        onEnded={() => handleVideoEnded(index)}
                        onError={() => handleVideoError(index)}
                        onLoadedData={() => handleVideoLoaded(index)}
                        preload="metadata"
                      />

                      {currentPlayingIndex !== index && (
                        <div className="reel-play-overlay" onClick={() => handleVideoClick(index)}>
                          <div className="reel-play-button">
                            <svg fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                          {mutedStatesRef.current[index] && (
                            <div className="reel-muted-indicator">🔇</div>
                          )}
                        </div>
                      )}

                      {/* Show muted indicator when video is playing but muted */}
                      {currentPlayingIndex === index && mutedStatesRef.current[index] && (
                        <div className="reel-muted-badge">Muted</div>
                      )}
                    </>
                  )}

                  <div className="reel-info-overlay">
                    <div className="reel-user-info">
                      <div className="reel-user-avatar" onClick={() => navigate(`/profile/${profileUserId}`)}>
                        {userDetails?.userProfilePic ? (
                          <img
                            src={userDetails.userProfilePic}
                            alt={userDetails.userName}
                            className="reel-user-avatar-img"
                          />
                        ) : (
                          <span>{userDetails?.userName?.charAt(0)?.toUpperCase() || 'U'}</span>
                        )}
                      </div>

                      <div className="reel-caption-container" onClick={(e) => handleCaptionClick(index, e)}>
                        <p className="reel-username">@{userDetails?.userName || profileUserId?.slice(0, 8) || 'unknown'}</p>
                        {userDetails?.userTagline && (
                          <p className="reel-user-tagline">"{userDetails.userTagline}"</p>
                        )}
                        <p className={`reel-caption ${expandedDescriptions.has(index) ? 'expanded' : ''}`}>
                          {expandedDescriptions.has(index) ? reel.caption : truncateCaption(reel.caption)}
                        </p>

                        {expandedDescriptions.has(index) && reel.tags && reel.tags.length > 0 && (
                          <div className="reel-tags">
                            {reel.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="reel-tag">#{tag}</span>
                            ))}
                          </div>
                        )}

                        {reel.caption.length > 20 && (
                          <div className="reel-read-more">
                            {expandedDescriptions.has(index) ? 'Show less' : 'Read more'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="reel-actions-right">
                    <div className="reel-action-buttons">
                      <div className="reel-action-item">
                        <div className={`reel-action-button ${reel.isLiked ? 'liked' : ''}`} onClick={() => handleLike(index)}>
                          <svg fill={reel.isLiked ? "#ff0000" : "currentColor"} viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
                          </svg>
                        </div>
                        <span className="reel-action-count">{reel.likes}</span>
                      </div>

                      <div className="reel-action-item">
                        <div className="reel-action-button" onClick={() => handleComment(index)}>
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM8 15h2.5l1.5 1.5 1.5-1.5H16v-2.5l1.5-1.5-1.5-1.5V8h-2.5L13 6.5 11.5 8H9v2.5L7.5 12 9 13.5V15z" />
                          </svg>
                        </div>
                        <span className="reel-action-count">{reel.comments}</span>
                      </div>

                      <div className="reel-action-item">
                        <div className="reel-action-button" onClick={() => handleShare(index)}>
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

          {!loading && localReels.length === 0 && (
            <div className="reels-empty">
              <p>No reels found for this user</p>
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {commentModal && (
        <CommentModal
          postId={commentModal.postId}
          isOpen={commentModal.isOpen}
          onClose={handleCloseCommentModal}
          userName={commentModal.userName}
          postMessage={commentModal.postMessage}
          commentCount={commentModal.commentCount}
          contentType={commentModal.contentType}
          currentUserId={currentUserId}
          accessToken={accessToken}
          onNewComment={handleNewComment}
          onDeleteComment={handleDeleteComment}
        />
      )}

      {/* Share Modal */}
      {shareReel && (
        <ShareComponent
          postId={shareReel.postId}
          userName={userDetails?.userName || profileUserId || 'unknown'}
          message={shareReel.caption}
          timestamp={shareReel.timestamp}
          likeCount={shareReel.likes}
          commentCount={shareReel.comments}
          isOpen={true}
          onClose={handleCloseShareModal}
          contentType="reel"
          mediaUrl={shareReel.files[0]?.url}
        />
      )}
    </>
  );
}

export default UserReelsPage;