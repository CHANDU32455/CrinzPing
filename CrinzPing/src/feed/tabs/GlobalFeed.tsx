import React, { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useAuth } from "react-oidc-context";
import { useCrinzMessages } from "../useCrinzMessages";
import { usePendingActions } from "../utils/pendingActions";
import syncBatchActions, { syncImmediately } from "../../hooks/useBatchSync";
import CommentModal from "../utils/commentModal";
import UserAvatar from "../utils/UserAvatar";
import ShareComponent from "../utils/ShareComponent";
import "../css/GlobalFeed.css";

interface GlobalFeedProps {
  searchTerm?: string;
}

const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

const GlobalFeed: React.FC<GlobalFeedProps> = ({ searchTerm }) => {
  const auth = useAuth();
  const userId = auth.user?.profile?.sub;
  const { crinzPosts, fetchMessages, loading, error, hasMore, updateLocalPost, addLocalComment, removeLocalComment } = useCrinzMessages();
  const { pendingActions, addPendingAction, removePendingActions, clearAllPendingActions } = usePendingActions();
  const [localPosts, setLocalPosts] = useState(crinzPosts);
  const [selectedPost, setSelectedPost] = useState<{ id: string; userName: string; message: string; } | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalPosts(crinzPosts);
  }, [crinzPosts]);

  const filteredPosts = useMemo(() => {
    if (!searchTerm) return localPosts;

    const term = searchTerm.toLowerCase();
    return localPosts.filter(post =>
      post.message.toLowerCase().includes(term) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(term))) ||
      post.userName.toLowerCase().includes(term)
    );
  }, [localPosts, searchTerm]);

  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMessages(false);
      }
    });

    if (node) {
      observer.current.observe(node);
    }
  }, [loading, hasMore, fetchMessages]);

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (searchTerm) {
      window.scrollTo(0, 0);
    }
  }, [searchTerm]);

  // Add this useEffect to GlobalFeed.tsx for immediate sync handling
  useEffect(() => {
    const handleImmediateSync = async () => {
      if (pendingActions.length === 0) return;

      setSyncError(null);
      const { remaining, originalProcessed } = await syncImmediately(pendingActions);

      if (originalProcessed.length > 0) {
        removePendingActions(originalProcessed);
      }

      if (remaining.length > 0) {
        setSyncError(`${remaining.length} action(s) failed to sync immediately.`);
      }
    };

    window.addEventListener('forceImmediateSync', handleImmediateSync);

    return () => {
      window.removeEventListener('forceImmediateSync', handleImmediateSync);
    };
  }, [pendingActions, removePendingActions]);

  const localTimeoutRef = useRef(0);
  // Add this useEffect to GlobalFeed.tsx
  useEffect(() => {
    console.log("[GlobalFeed] Sync useEffect triggered");
    if (pendingActions.length === 0) return;

    if (DEBUG_MODE) {
      console.log("[GlobalFeed] Processing pending actions:", pendingActions);
    }

    if (localTimeoutRef.current) {
      console.log("[GlobalFeed] Clearing existing timeout");
      clearTimeout(localTimeoutRef.current);
    }

    localTimeoutRef.current = setTimeout(async () => {
      console.log("[GlobalFeed] Sync timeout triggered");
      try {
        setSyncError(null);
        const { remaining, originalProcessed } = await syncBatchActions(pendingActions);

        if (DEBUG_MODE) {
          console.log("[GlobalFeed] Sync result - remaining:", remaining.length, "processed:", originalProcessed.length);
        }

        if (originalProcessed.length > 0) {
          removePendingActions(originalProcessed);
        }

        if (remaining.length > 0) {
          console.warn("[GlobalFeed] Some actions failed to process:", remaining);

          // Check if we're stuck in an infinite loop with the same actions
          const isSameAsPrevious = remaining.length === pendingActions.length &&
            remaining.every((action, index) =>
              action.type === pendingActions[index]?.type &&
              action.crinzId === pendingActions[index]?.crinzId
            );

          if (isSameAsPrevious) {
            console.error("[GlobalFeed] Infinite loop detected! Clearing failed actions");
            setSyncError("Sync failed. Please refresh the page.");
            clearAllPendingActions();
            return;
          }

          remaining.forEach(action => {
            const post = localPosts.find(p => p.crinzId === action.crinzId);
            if (!post) return;

            if (action.type === 'like') {
              updateLocalPost(action.crinzId, {
                isLiked: false,
                likeCount: Math.max(0, post.likeCount - 1)
              });
            } else if (action.type === 'unlike') {
              updateLocalPost(action.crinzId, {
                isLiked: true,
                likeCount: post.likeCount + 1
              });
            }
          });

          setSyncError(`${remaining.length} action(s) failed to sync. Retrying...`);
        }
      } catch (error: any) {
        console.error('Batch sync failed:', error);
        setSyncError('Sync failed. Please check your connection.');

        // Clear actions to prevent infinite loop
        clearAllPendingActions();
      }
    }, 2000);

    return () => {
      if (localTimeoutRef.current) {
        console.log("[GlobalFeed] Cleaning up timeout");
        clearTimeout(localTimeoutRef.current);
      }
    };
  }, [pendingActions, removePendingActions, clearAllPendingActions, localPosts, updateLocalPost]);

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    const actionType = currentlyLiked ? 'unlike' : 'like';
    const post = localPosts.find(p => p.crinzId === postId);
    if (!post) return;

    const hasPendingAction = pendingActions.some(action =>
      action.crinzId === postId && (action.type === 'like' || action.type === 'unlike')
    );

    if (hasPendingAction) {
      if (DEBUG_MODE) {
        console.log("[GlobalFeed] Already have pending action for post", postId);
      }
      return;
    }

    updateLocalPost(postId, {
      isLiked: !currentlyLiked,
      likeCount: currentlyLiked ? post.likeCount - 1 : post.likeCount + 1
    });

    addPendingAction({
      type: actionType,
      crinzId: postId,
      timestamp: Date.now()
    });
  };

  const handleComment = (postId: string) => {
    const post = localPosts.find(p => p.crinzId === postId);
    if (post) {
      setSelectedPost({
        id: post.crinzId,
        userName: post.userName,
        message: post.message
      });
    }
  };

  if (error) {
    return (
      <div className="global-feed error">
        <div className="error-message">
          <p>Error loading feed: {error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="global-feed">
      <div className="feed-posts">
        {filteredPosts.length === 0 && !loading ? (
          <div className="no-posts">
            <p>No posts found{searchTerm ? ` matching "${searchTerm}"` : ""}</p>
          </div>
        ) : (
          filteredPosts.map((post, index) => (
            <div
              key={post.crinzId}
              className="feed-post"
              ref={index === filteredPosts.length - 1 ? lastPostElementRef : null}
            >
              <div className="post-header">
                <div className="user-avatar">
                  <UserAvatar userName={post.userName} size={40} className="avatar-image" />
                </div>
                <div className="user-info">
                  <div className="username">@{post.userName}</div>
                  <div className="timestamp">{formatTime(post.timestamp)}</div>
                </div>
              </div>

              <div className="post-content">
                <p>{post.message}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="post-actions">
                <button
                  className={`like-btn ${post.isLiked ? 'liked' : ''}`}
                  onClick={() => handleLike(post.crinzId, post.isLiked || false)}
                  disabled={pendingActions.some(action =>
                    action.crinzId === post.crinzId && (action.type === 'like' || action.type === 'unlike')
                  )}
                >
                  {post.isLiked ? '❤️' : '🤍'} {post.likeCount}
                </button>
                <button
                  className="comment-btn"
                  onClick={() => handleComment(post.crinzId)}
                  disabled={pendingActions.some(action =>
                    action.crinzId === post.crinzId && (action.type === 'add_comment' || action.type === 'remove_comment')
                  )}
                >
                  💬 {post.commentCount}
                </button>
                <ShareComponent
                  postId={post.crinzId}
                  userName={post.userName}
                  message={post.message}
                  timestamp={post.timestamp}
                  likeCount={post.likeCount}
                  commentCount={post.commentCount}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {syncError && (
        <div className="sync-error">
          <p>{syncError}</p>
          <button onClick={() => setSyncError(null)} className="dismiss-button">
            Dismiss
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-indicator" ref={loadingRef}>
          <div className="loading-spinner"></div>
          <p>Loading more posts...</p>
        </div>
      )}

      {!hasMore && filteredPosts.length > 0 && (
        <div className="end-of-feed">
          <p>You've reached the end of the feed</p>
        </div>
      )}

      {selectedPost && (
        <CommentModal
          postId={selectedPost.id}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          accessToken={localStorage.getItem("access_token")}
          userName={selectedPost.userName}
          postMessage={selectedPost.message}
          currentUserId={userId}
          onCommentAdded={() => addLocalComment(selectedPost.id)}
          onCommentRemoved={() => removeLocalComment(selectedPost.id)}
        />
      )}

      {pendingActions.length > 0 && (
        <div className="sync-indicator">
          <div className="sync-spinner"></div>
          <p>Syncing {pendingActions.length} action(s)...</p>
        </div>
      )}
    </div>
  );
};

export default GlobalFeed;