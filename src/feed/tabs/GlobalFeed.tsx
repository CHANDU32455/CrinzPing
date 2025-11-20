import React, { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useCrinzMessages } from "../hooks/useCrinzMessages";
import { batchSyncer, useBatchSync } from "../utils/msgsBatchSyncer"; // Add useBatchSync
import UserAvatar from "../utils/UserAvatar";
import ShareComponent from "../ShareComponent";
import CommentModal from "../commentModal";
import SyncStatusIndicator from "../utils/SyncStatusIndicator";
import "../css/GlobalFeed.css";
import { contentManager } from "../../utils/Posts_Reels_Stats_Syncer";

const GlobalFeed: React.FC = () => {
  const auth = useAuth();
  const userId = auth.user?.profile?.sub;
  const accessToken = auth.user?.access_token;
  const navigate = useNavigate();
  const {
    crinzPosts,
    fetchMessages,
    loading,
    error,
    hasMore,
    refresh,
  } = useCrinzMessages();

  // Add batch sync hook
  const { syncState, pendingCount } = useBatchSync();

  const [localPosts, setLocalPosts] = useState(crinzPosts);
  const [selectedPost, setSelectedPost] = useState<{
    id: string;
    userName: string;
    message: string;
    timestamp: string;
    likeCount: number;
    commentCount: number;
    userProfilePic?: string;
    userTagline?: string;
  } | null>(null);
  const [sharePost, setSharePost] = useState<{
    id: string;
    userName: string;
    message: string;
    timestamp: string;
    likeCount: number;
    commentCount: number;
    userProfilePic?: string;
    userTagline?: string;
  } | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const networkErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // NEW: Listen for sync state changes and refresh data when sync completes
  useEffect(() => {
    if (syncState.syncStatus === 'success' && syncState.lastSyncTime) {
      // Refresh posts to get updated data from server
      console.log('🔄 Sync completed, refreshing posts...');
      refresh();
    }
  }, [syncState.syncStatus, syncState.lastSyncTime, refresh]);

  // Show network error notifications
  useEffect(() => {
    if (error) {
      let errorMessage = error;

      if (errorMessage?.includes("Failed to fetch") || errorMessage?.includes("net::ERR_INTERNET_DISCONNECTED")) {
        errorMessage = "Network connection lost. Showing cached posts.";
      }

      setNetworkError(errorMessage);

      if (networkErrorTimeoutRef.current) {
        clearTimeout(networkErrorTimeoutRef.current);
      }

      networkErrorTimeoutRef.current = setTimeout(() => {
        setNetworkError(null);
      }, 5000);
    }

    return () => {
      if (networkErrorTimeoutRef.current) {
        clearTimeout(networkErrorTimeoutRef.current);
      }
    };
  }, [error]);

  useEffect(() => {
    setLocalPosts(crinzPosts);
  }, [crinzPosts]);

  // Remove the problematic useEffect and add this instead:
  useEffect(() => {
    if (selectedPost || sharePost) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [selectedPost, sharePost]);

  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMessages(false);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchMessages]);

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleLike = (postId: string, currentlyLiked: boolean) => {
    const actionType = currentlyLiked ? 'unlike' : 'like';

    batchSyncer.addAction({
      type: actionType,
      crinzId: postId,
      userId: userId!,
    });

    setLocalPosts(prevPosts => prevPosts.map(post =>
      post.crinzId === postId
        ? {
          ...post,
          isLiked: !currentlyLiked,
          likeCount: currentlyLiked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1
        }
        : post
    ));
  };

  const handleComment = (postId: string) => {
    const post = localPosts.find(p => p.crinzId === postId);
    if (post) {
      setSelectedPost({
        id: post.crinzId,
        userName: post.userName,
        message: post.message,
        timestamp: post.timestamp,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        userProfilePic: post.userProfilePic,
        userTagline: post.userTagline
      });
    }
  };

  const handleShare = (postId: string) => {
    const post = localPosts.find(p => p.crinzId === postId);
    if (post) {
      setSharePost({
        id: post.crinzId,
        userName: post.userName,
        message: post.message,
        timestamp: post.timestamp,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        userProfilePic: post.userProfilePic,
        userTagline: post.userTagline
      });
    }
  };

  const handleCloseCommentModal = () => {
    setSelectedPost(null);
  };

  const handleCloseShareModal = () => {
    setSharePost(null);
  };

  const handleNewComment = useCallback((postId: string) => {
    console.log('✅ GlobalFeed: New comment added to post:', postId);

    setLocalPosts(prevPosts =>
      prevPosts.map(post =>
        post.crinzId === postId
          ? {
            ...post,
            commentCount: post.commentCount + 1
          }
          : post
      )
    );

    // ✅ Also update the batch syncer if needed
    const currentStats = contentManager.getContentStats(postId);
    if (currentStats) {
      contentManager.initializeContentStats(postId, {
        ...currentStats,
        commentCount: currentStats.commentCount + 1
      });
    }
  }, []);

  const handleDeleteComment = useCallback((postId: string) => {
    console.log('✅ GlobalFeed: Comment deleted from post:', postId);

    setLocalPosts(prevPosts =>
      prevPosts.map(post =>
        post.crinzId === postId
          ? {
            ...post,
            commentCount: Math.max(0, post.commentCount - 1)
          }
          : post
      )
    );

    // ✅ Also update the batch syncer if needed
    const currentStats = contentManager.getContentStats(postId);
    if (currentStats) {
      contentManager.initializeContentStats(postId, {
        ...currentStats,
        commentCount: Math.max(0, currentStats.commentCount - 1)
      });
    }
  }, []);

  const handleRetry = async () => {
    try {
      await refresh();
    } catch (error) {
      console.log("Refresh failed:", error);
    }
  };

  const dismissNetworkError = () => {
    setNetworkError(null);
    if (networkErrorTimeoutRef.current) {
      clearTimeout(networkErrorTimeoutRef.current);
    }
  };

  // NEW: Manual sync trigger
  const handleForceSync = () => {
    batchSyncer.forceSync();
  };

  return (
    <div className="global-feed">
      {/* NEW: Sync Status Indicator */}
      {pendingCount > 0 && (
        <div className="sync-status-banner">
          <div className="sync-status-content">
            <span className="sync-status-icon">🔄</span>
            <span className="sync-status-message">
              {pendingCount} pending action{syncState.pendingActions.length !== 1 ? 's' : ''}
            </span>
            <button
              className="sync-now-button"
              onClick={handleForceSync}
              disabled={syncState.syncStatus === 'syncing'}
            >
              {syncState.syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>
      )}

      {networkError && (
        <div className="network-error-chip">
          <div className="network-error-content">
            <span className="network-error-icon">⚠️</span>
            <span className="network-error-message">{networkError}</span>
            <button
              className="network-error-dismiss"
              onClick={dismissNetworkError}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="feed-posts">
        {localPosts.length === 0 && !loading ? (
          <div className="no-posts">
            <p>No posts found</p>
            <button onClick={handleRetry} className="retry-button">
              Refresh Feed
            </button>
          </div>
        ) : (
          localPosts.map((post, index) => (
            <div
              key={post.crinzId}
              className="feed-post"
              ref={index === localPosts.length - 1 ? lastPostElementRef : null}
            >
              <div
                className="post-header"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                  width: "100%"
                }}
              >
                {/* Left: Avatar + Username + Tagline (stacked) */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
                  <div className="user-avatar">
                    <UserAvatar
                      userName={post.userName}
                      profilePic={post.userProfilePic}
                      size={40}
                      className="avatar-image"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                    <div
                      className="username"
                      style={{
                        cursor: "pointer",
                        color: "#00aaff",
                        fontWeight: 600,
                        textDecoration: "underline",
                        fontSize: "14px",
                        lineHeight: "1.2",
                        marginBottom: "2px"
                      }}
                      onClick={() => navigate(`/profile/${post.userId}`)}
                    >
                      @{post.userName}
                    </div>
                    {post.userTagline && (
                      <div
                        className="user-tagline"
                        style={{
                          width: "100%",
                          fontSize: "12px",
                          color: "#888",
                          lineHeight: "1.3",
                          wordWrap: "break-word",
                          overflowWrap: "break-word",
                          whiteSpace: "normal"
                        }}
                      >
                        {post.userTagline}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Timestamp */}
                <div
                  className="timestamp"
                  style={{
                    flexShrink: 0,
                    fontSize: "11px",
                    color: "#666",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    alignSelf: "flex-start"
                  }}
                >
                  {formatTime(post.timestamp)}
                </div>
              </div>

              <div className="post-content">
                <p>{post.message}</p>
              </div>

              <div className="post-actions">
                <button
                  className={`like-btn ${post.isLiked ? "liked" : ""}`}
                  onClick={() => handleLike(post.crinzId, post.isLiked || false)}
                >
                  {post.isLiked ? "❤️" : "🤍"} {post.likeCount}
                </button>
                <button
                  className="comment-btn"
                  onClick={() => handleComment(post.crinzId)}
                >
                  💬 {post.commentCount}
                </button>
                <button
                  className="share-btn"
                  onClick={() => handleShare(post.crinzId)}
                >
                  📤 Share
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {loading && (
        <div className="loading-indicator" ref={loadingRef}>
          <div className="loading-spinner"></div>
          <p>Loading more posts...</p>
        </div>
      )}

      {!hasMore && localPosts.length > 0 && (
        <div className="end-of-feed">
          <p>You've reached the end of the feed</p>
        </div>
      )}

      {/* Sync Status Indicator - Only show in development */}
      {process.env.NODE_ENV === 'development' && <SyncStatusIndicator />}

      {selectedPost && (
        <CommentModal
          postId={selectedPost.id}
          isOpen={true}
          onClose={handleCloseCommentModal}
          userName={selectedPost.userName}
          userProfilePic={selectedPost.userProfilePic}
          userTagline={selectedPost.userTagline}
          postMessage={selectedPost.message}
          commentCount={selectedPost.commentCount}
          currentUserId={userId}
          accessToken={accessToken}
          onNewComment={handleNewComment}
          onDeleteComment={handleDeleteComment}
          contentType="crinz_message" // ✅ ADD THIS
        />
      )}

      {sharePost && (
        <ShareComponent
          postId={sharePost.id}
          userName={sharePost.userName}
          message={sharePost.message}
          timestamp={sharePost.timestamp}
          likeCount={sharePost.likeCount}
          commentCount={sharePost.commentCount}
          isOpen={true}
          onClose={handleCloseShareModal}
          contentType="crinz_message"
        />
      )}
    </div>
  );
};

export default GlobalFeed;