import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "react-oidc-context";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useUserDetails, type CrinzMessage } from "../hooks/UserInfo";
import { usePostActions } from "../hooks/useEditDeletePosts";
import UserAvatar from "../feed/utils/UserAvatar";
import ShareComponent from "../feed/ShareComponent";
import CommentModal from "../feed/commentModal";
import EditPostModal from "../components/EditPostModal";
import "../css/CrinzFeed.css";
import SyncStatusIndicator from "../feed/utils/SyncStatusIndicator";
import { contentManager } from "../utils/Posts_Reels_Stats_Syncer";
import { batchSyncer, useBatchSync } from "../feed/utils/msgsBatchSyncer";

// Extended interface to include missing properties
interface ExtendedCrinzMessage extends CrinzMessage {
  userId?: string;
  userProfilePic?: string;
  userTagline?: string;
  isLiked?: boolean;
}

const ProfileMorePosts: React.FC = () => {
  const auth = useAuth();
  const accessToken = auth.user?.access_token;
  const currentUserId = auth.user?.profile?.sub;
  const { userSub } = useParams<{ userSub: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const highlightIdFromUrl = new URLSearchParams(location.search).get("highlight");

  const { crinzMessages, lastKey, loadingCrinz, loadMoreCrinz, fetchCrinzMessages, crinzError, userError, fetchUserDetails, userDetails } = useUserDetails(userSub);

  // Use the post actions hook ONLY for editing/deleting
  const {
    addPendingAction,
    executePendingActions,
    hasPendingActions,
    pendingActionsCount,
    clearPendingActionFor,
    getPendingActions
  } = usePostActions();

  // ✅ ADD BATCH SYNC FOR LIKES
  const { syncState, pendingCount } = useBatchSync();

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
  const [editModal, setEditModal] = useState<ExtendedCrinzMessage | null>(null);
  const [tempHighlight, setTempHighlight] = useState<string | null>(highlightIdFromUrl);
  const [localPosts, setLocalPosts] = useState<ExtendedCrinzMessage[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-sync states (for edit/delete actions only)
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const autoSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isOwnPost = userSub === currentUserId;

  // ✅ LISTEN FOR SYNC COMPLETION (FOR LIKES)
  useEffect(() => {
    if (syncState.syncStatus === 'success' && syncState.lastSyncTime) {
      console.log('🔄 Sync completed, refreshing posts...');
      fetchCrinzMessages();
    }
  }, [syncState.syncStatus, syncState.lastSyncTime, fetchCrinzMessages]);

  // Sync local posts with fetched crinzMessages and add user details
  useEffect(() => {
    const enhancedPosts: ExtendedCrinzMessage[] = crinzMessages.map(post => ({
      ...post,
      userId: userSub,
      userProfilePic: userDetails?.profilePic,
      userTagline: userDetails?.Tagline,
      isLiked: post.isLikedByUser,
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      timestamp: post.timestamp || new Date().toISOString(),
      userName: post.userName || userDetails?.displayName || "User"
    }));
    setLocalPosts(enhancedPosts);
  }, [crinzMessages, userSub, userDetails]);

  // Auto-sync functionality (for edit/delete actions only)
  useEffect(() => {
    if (hasPendingActions && !isAutoSyncing && !isSaving) {
      if (autoSyncTimeoutRef.current) {
        clearTimeout(autoSyncTimeoutRef.current);
      }

      autoSyncTimeoutRef.current = setTimeout(async () => {
        if (hasPendingActions) {
          await handleAutoSync();
        }
      }, 2000);
    }

    return () => {
      if (autoSyncTimeoutRef.current) {
        clearTimeout(autoSyncTimeoutRef.current);
      }
    };
  }, [hasPendingActions, isAutoSyncing, isSaving]);

  // Auto-sync when coming online (for edit/delete actions only)
  useEffect(() => {
    const handleOnline = async () => {
      if (hasPendingActions && !isAutoSyncing) {
        console.log("Connection restored - auto-syncing pending actions");
        await handleAutoSync();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [hasPendingActions, isAutoSyncing]);

  // Auto-sync function (for edit/delete actions only)
  const handleAutoSync = async () => {
    if (!hasPendingActions || isAutoSyncing || isSaving) return;

    setIsAutoSyncing(true);
    setSaveError(null);

    try {
      console.log("Auto-syncing pending actions:", getPendingActions());
      await executePendingActions();
      await fetchCrinzMessages();
      console.log("Auto-sync completed successfully");
    } catch (error) {
      console.error("Auto-sync failed:", error);
      setSaveError(error instanceof Error ? error.message : "Auto-sync failed");
    } finally {
      setIsAutoSyncing(false);
    }
  };

  // Show network error notifications
  useEffect(() => {
    if (crinzError) {
      let errorMessage = crinzError.message;

      if (errorMessage?.includes("Failed to fetch") || errorMessage?.includes("net::ERR_INTERNET_DISCONNECTED")) {
        errorMessage = "Network connection lost. Showing cached posts.";
      }

      setNetworkError(errorMessage);
      const timer = setTimeout(() => setNetworkError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [crinzError]);

  // Remove highlight from URL after processing
  useEffect(() => {
    if (highlightIdFromUrl) {
      setTempHighlight(highlightIdFromUrl);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      const timer = setTimeout(() => setTempHighlight(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightIdFromUrl, navigate]);

  // Scroll to highlighted post when it's available
  useEffect(() => {
    if (tempHighlight && localPosts.length > 0) {
      const timer = setTimeout(() => {
        const highlightedElement = document.getElementById(`post-${tempHighlight}`);
        if (highlightedElement) {
          highlightedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [tempHighlight, localPosts]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpen) setMenuOpen(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  // ✅ FIXED: Toggle like function using batchSyncer (like GlobalFeed)
  const toggleLike = useCallback((postId: string, currentlyLiked: boolean) => {
    if (!currentUserId) {
      console.error('No user ID available for like action');
      return;
    }

    const actionType = currentlyLiked ? 'unlike' : 'like';

    // ✅ ADD TO BATCH SYNCER FOR SERVER SYNC
    batchSyncer.addAction({
      type: actionType,
      crinzId: postId,
      userId: currentUserId,
    });

    const currentPost = localPosts.find(p => p.crinzId === postId);
    const currentLikeCount = currentPost?.likeCount || 0;
    
    const newLikeCount = currentlyLiked 
      ? Math.max(0, currentLikeCount - 1)
      : currentLikeCount + 1;
    
    const isLiked = !currentlyLiked;

    console.log('✅ ProfileMorePosts: Like action:', {
      postId,
      action: actionType,
      currentLikeState: currentlyLiked,
      currentCount: currentLikeCount,
      newCount: newLikeCount,
      willBeLiked: isLiked
    });

    // Update local state
    setLocalPosts(prevPosts => prevPosts.map(post =>
      post.crinzId === postId
        ? {
            ...post,
            isLiked: isLiked,
            likeCount: newLikeCount
          }
        : post
    ));

    // Update content manager stats
    const currentStats = contentManager.getContentStats(postId);
    if (currentStats) {
      contentManager.initializeContentStats(postId, {
        ...currentStats,
        likeCount: newLikeCount,
        isLikedByUser: isLiked
      });
    }
  }, [localPosts, currentUserId]);

  // ✅ ADD MANUAL SYNC TRIGGER FOR LIKES
  const handleForceSync = () => {
    batchSyncer.forceSync();
  };

  // Handle comment modal
  const handleComment = (postId: string) => {
    const post = localPosts.find(p => p.crinzId === postId);
    if (post) {
      setSelectedPost({
        id: post.crinzId,
        userName: post.userName || "User",
        message: post.message,
        timestamp: post.timestamp || new Date().toISOString(),
        likeCount: post.likeCount || 0,
        commentCount: post.commentCount || 0,
        userProfilePic: post.userProfilePic,
        userTagline: post.userTagline
      });
    }
  };

  // Handle share modal
  const handleShare = (postId: string) => {
    const post = localPosts.find(p => p.crinzId === postId);
    if (post) {
      setSharePost({
        id: post.crinzId,
        userName: post.userName || "User",
        message: post.message,
        timestamp: post.timestamp || new Date().toISOString(),
        likeCount: post.likeCount || 0,
        commentCount: post.commentCount || 0,
        userProfilePic: post.userProfilePic,
        userTagline: post.userTagline
      });
    }
  };

  const handleNewComment = useCallback((postId: string) => {
    console.log('✅ ProfileMorePosts: New comment added to post:', postId);

    // Update local state
    setLocalPosts(prevPosts =>
      prevPosts.map(post =>
        post.crinzId === postId
          ? {
              ...post,
              commentCount: (post.commentCount || 0) + 1
            }
          : post
      )
    );

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
    console.log('✅ ProfileMorePosts: Comment deleted from post:', postId);

    // Update local state
    setLocalPosts(prevPosts =>
      prevPosts.map(post =>
        post.crinzId === postId
          ? {
              ...post,
              commentCount: Math.max(0, (post.commentCount || 1) - 1)
            }
          : post
      )
    );

    // Update content manager stats
    const currentStats = contentManager.getContentStats(postId);
    if (currentStats) {
      contentManager.initializeContentStats(postId, {
        ...currentStats,
        commentCount: Math.max(0, currentStats.commentCount - 1)
      });
    }
  }, []);

  const handleCloseCommentModal = () => {
    setSelectedPost(null);
  };

  const handleCloseShareModal = () => {
    setSharePost(null);
  };

  const handleEditPost = (post: ExtendedCrinzMessage) => {
    setEditModal(post);
    setMenuOpen(null);
  };

  // Use usePostActions for editing (this is correct)
  const handleSaveEdit = (updatedPost: ExtendedCrinzMessage) => {
    addPendingAction({
      type: 'update',
      postId: updatedPost.crinzId,
      data: {
        message: updatedPost.message,
        tags: updatedPost.tags ?? []
      }
    });

    // Update local state immediately (optimistic update)
    setLocalPosts(prev => prev.map(post =>
      post.crinzId === updatedPost.crinzId ? {
        ...post,
        message: updatedPost.message,
        tags: updatedPost.tags ?? []
      } : post
    ));

    setEditModal(null);
    setSaveError(null);
  };

  // Use usePostActions for deleting (this is correct)
  const handleDeletePost = (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    // Clear any pending actions for this post first
    const actionTypes = ['like', 'unlike', 'add_comment', 'remove_comment', 'update'];
    actionTypes.forEach(type => {
      clearPendingActionFor({
        type: type as any,
        postId: postId
      });
    });

    // Add delete action using usePostActions
    addPendingAction({
      type: 'delete',
      postId: postId
    });

    // Update local state immediately (optimistic update)
    setLocalPosts(prev => prev.filter(post => post.crinzId !== postId));
    setMenuOpen(null);
    setSaveError(null);
  };

  // Manual save all pending changes (for edit/delete actions only)
  const handleSaveChanges = async () => {
    if (!hasPendingActions) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await executePendingActions();
      await fetchCrinzMessages();
    } catch (error) {
      console.error("Failed to save changes:", error);
      setSaveError(error instanceof Error ? error.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMenu = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === postId ? null : postId);
  };

  const handleRetry = async () => {
    try {
      await fetchCrinzMessages();
    } catch (error) {
      console.log("Refresh failed:", error);
    }
  };

  const dismissNetworkError = () => {
    setNetworkError(null);
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="crinz-feed-container">
      {/* ✅ SYNC STATUS BANNER FOR LIKES */}
      {pendingCount > 0 && (
        <div className="sync-status-banner">
          <div className="sync-status-content">
            <span className="sync-status-icon">🔄</span>
            <span className="sync-status-message">
              {pendingCount} pending action{pendingCount !== 1 ? 's' : ''}
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

      {/* Network Error Display */}
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

      {/* Minimal Save Indicator - Dev Mode Only (for edit/delete actions) */}
      {process.env.NODE_ENV === 'development' && hasPendingActions && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#3b82f6',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          minWidth: '200px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🤪 {pendingActionsCount} pending</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSaveChanges}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                disabled={isSaving || isAutoSyncing}
              >
                {isSaving ? '⏳' : isAutoSyncing ? '🔄' : '💾'}
              </button>
            </div>
          </div>

          {saveError && (
            <div style={{
              background: '#ef4444',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              marginTop: '4px'
            }}>
              ❌ {saveError}
            </div>
          )}

          {isAutoSyncing && (
            <div style={{
              background: '#f59e0b',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              textAlign: 'center'
            }}>
              Auto-saving...
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {userError && (
        <div className="error-banner">
          <h3>Error loading user profile</h3>
          <p>{userError.message || "Failed to load user information"}</p>
          <button onClick={() => fetchUserDetails()}>Retry</button>
        </div>
      )}

      {crinzError && !networkError && (
        <div className="error-banner">
          <h3>Error loading posts</h3>
          <p>{crinzError.message || "Failed to load posts"}</p>
          <button onClick={() => fetchCrinzMessages()}>Retry</button>
        </div>
      )}

      {loadingCrinz && localPosts.length === 0 && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading posts...</p>
        </div>
      )}

      {!loadingCrinz && localPosts.length === 0 && !crinzError && (
        <div className="empty-state">
          <p>No posts found</p>
          <button onClick={handleRetry} className="retry-button">
            Refresh Posts
          </button>
        </div>
      )}

      {localPosts.map(post => {
        const isHighlighted = post.crinzId === tempHighlight;
        const isMenuOpen = menuOpen === post.crinzId;

        return (
          <div
            key={post.crinzId}
            id={`post-${post.crinzId}`}
            className={`crinz-post ${isHighlighted ? "highlighted" : ""}`}
          >
            <div
              className="post-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                width: '100%',
                gap: '12px',
                marginBottom: '10px',
                flexWrap: 'nowrap',
                position: 'relative'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  flex: 1,
                  minWidth: 0
                }}
              >
                <div className="user-avatar">
                  <UserAvatar
                    userName={post.userName || "User"}
                    profilePic={post.userProfilePic}
                    size={40}
                    className="avatar-image"
                  />
                </div>
                <div
                  className="user-info"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minWidth: 0,
                    gap: '4px'
                  }}
                >
                  <div
                    style={{
                      cursor: "pointer",
                      color: "#00aaff",
                      fontWeight: 600,
                      fontSize: '1rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    @{post.userName || "User"}
                  </div>
                  {post.userTagline && (
                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: '#999',
                        fontStyle: 'italic',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {post.userTagline}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#777'
                    }}
                  >
                    {formatTime(post.timestamp || new Date().toISOString())}
                  </div>
                </div>
              </div>

              {isOwnPost && (
                <div
                  className="post-menu-container"
                  style={{
                    position: 'relative',
                    flexShrink: 0,
                    marginLeft: 'auto'
                  }}
                >
                  <button
                    style={{
                      background: 'none',
                      color: '#ccc',
                      border: 'none',
                      fontSize: '18px',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '6px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={(e) => toggleMenu(e, post.crinzId)}
                  >
                    ⋮
                  </button>

                  {isMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        background: '#2d2d2d',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                        zIndex: 1000,
                        minWidth: '140px',
                        overflow: 'hidden',
                        marginTop: '4px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 16px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onClick={() => handleEditPost(post)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 16px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#ff6b6b',
                          borderTop: '1px solid #444',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onClick={() => handleDeletePost(post.crinzId)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="post-message">{post.message}</p>

            <div className="post-actions">
              <button
                className={`like-btn ${post.isLiked ? "liked" : ""}`}
                onClick={() => {
                  console.log('🖱️ Like button clicked:', {
                    postId: post.crinzId,
                    currentIsLiked: post.isLiked,
                    currentLikeCount: post.likeCount
                  });
                  toggleLike(post.crinzId, !!post.isLiked);
                }}
              >
                {post.isLiked ? "❤️" : "🤍"} {post.likeCount || 0}
              </button>
              <button
                className="comment-btn"
                onClick={() => handleComment(post.crinzId)}
              >
                💬 {post.commentCount || 0}
              </button>
              <button
                className="share-btn"
                onClick={() => handleShare(post.crinzId)}
              >
                📤 Share
              </button>
            </div>
          </div>
        );
      })}

      {lastKey && !loadingCrinz && (
        <div className="load-more-container">
          <button className="see-more-link" onClick={loadMoreCrinz}>
            Load More
          </button>
        </div>
      )}

      {lastKey && loadingCrinz && (
        <div className="loading-container">
          <div className="loading-spinner small"></div>
          <p>Loading more posts…</p>
        </div>
      )}

      {process.env.NODE_ENV === 'development' && <SyncStatusIndicator />}

      {/* Comment Modal */}
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
          currentUserId={currentUserId}
          accessToken={accessToken}
          onNewComment={handleNewComment}
          onDeleteComment={handleDeleteComment}
          contentType="crinz_message"
        />
      )}

      {/* Share Modal */}
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

      {editModal && (
        <EditPostModal
          post={editModal}
          onClose={() => setEditModal(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default ProfileMorePosts;