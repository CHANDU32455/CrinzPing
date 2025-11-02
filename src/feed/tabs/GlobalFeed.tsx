import React, { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useCrinzMessages } from "../hooks/useCrinzMessages";
import { batchSyncer } from "../utils/msgsBatchSyncer";
import UserAvatar from "../utils/UserAvatar";
import ShareComponent from "../ShareComponent";
import CommentModal from "../commentModal";
import SyncStatusIndicator from "../utils/SyncStatusIndicator";
import "../css/GlobalFeed.css";

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

  const [localPosts, setLocalPosts] = useState(crinzPosts);
  const [selectedPost, setSelectedPost] = useState<{
    id: string;
    userName: string;
    message: string;
    timestamp: string;
    likeCount: number;
    commentCount: number;
  } | null>(null);
  const [sharePost, setSharePost] = useState<{
    id: string;
    userName: string;
    message: string;
    timestamp: string;
    likeCount: number;
    commentCount: number;
  } | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const networkErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Prevent body scrolling when modals are open
  useEffect(() => {
    if (selectedPost || sharePost) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
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
        commentCount: post.commentCount
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
        commentCount: post.commentCount
      });
    }
  };

  const handleCloseCommentModal = () => {
    setSelectedPost(null);
  };

  const handleCloseShareModal = () => {
    setSharePost(null);
  };

  const handleNewComment = (postId: string) => {
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
  };

  const handleDeleteComment = (postId: string) => {
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
  };

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

  return (
      <div className="global-feed">
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
                <div className="post-header">
                  <div className="user-avatar">
                    <UserAvatar userName={post.userName} size={40} className="avatar-image" />
                  </div>
                  <div className="user-info">
                    <div 
                      className="username" 
                      style={{
                        cursor: "pointer",
                        color: "#00aaff",
                        fontWeight: 600,
                        textDecoration: "underline",
                      }}
                      onClick={() => navigate(`/profile/${post.userId}`)}
                    >
                      @{post.userName}
                    </div>
                    <div className="timestamp">{formatTime(post.timestamp)}</div>
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

        <SyncStatusIndicator />

        {selectedPost && (
          <CommentModal
            postId={selectedPost.id}
            isOpen={true}
            onClose={handleCloseCommentModal}
            userName={selectedPost.userName}
            postMessage={selectedPost.message}
            currentUserId={userId}
            accessToken={accessToken}
            onNewComment={handleNewComment}
            onDeleteComment={handleDeleteComment}
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
          />
        )}
      </div>
  );
};

export default GlobalFeed;