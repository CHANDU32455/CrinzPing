// ProfileMorePosts.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "react-oidc-context";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useUserDetails, type CrinzMessage } from "../hooks/UserInfo";
import { usePostActions } from "../hooks/useEditDeletePosts";
import { encodePostData } from "../utils/encodeDecode";
import HandleCommentsView from "./HandleCommentsView";
import EditPostModal from "../components/EditPostModal";
import "../css/CrinzFeed.css";

interface Comment {
  commentId: string;
  crinzId: string;
  userId: string;
  comment: string;
  timestamp: number;
  userDisplayName?: string;
}

const ProfileMorePosts: React.FC = () => {
  const auth = useAuth();
  const currentUserId = auth.user?.profile?.sub;
  const { userSub } = useParams<{ userSub: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const highlightIdFromUrl = new URLSearchParams(location.search).get("highlight");

  const { crinzMessages, lastKey, loadingCrinz, loadMoreCrinz, fetchCrinzMessages, crinzError, userError, fetchUserDetails } = useUserDetails(userSub);

  const {
    addPendingAction,
    executePendingActions,
    hasPendingActions,
    clearPendingActions,
    pendingActionsCount,
    clearPendingActionFor
  } = usePostActions();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<CrinzMessage | null>(null);
  const [sharedLink, setSharedLink] = useState<string | null>(null);
  const [tempHighlight, setTempHighlight] = useState<string | null>(highlightIdFromUrl);
  const [localPosts, setLocalPosts] = useState<CrinzMessage[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [localActions, setLocalActions] = useState<Map<string, 'update' | 'delete'>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Add states for temporary like and comment handling
  const [tempLikes, setTempLikes] = useState<Map<string, { liked: boolean; count: number }>>(new Map());
  const [tempComments, setTempComments] = useState<Map<string, Comment[]>>(new Map());

  const isOwnPost = userSub === currentUserId;

  // Sync local posts with fetched crinzMessages
  useEffect(() => {
    setLocalPosts(crinzMessages);
  }, [crinzMessages]);

  // Create a memoized version of posts with temporary like states applied
  const postsWithTempLikes = useMemo(() => {
    return localPosts.map(post => {
      const tempLikeData = tempLikes.get(post.crinzId);
      if (tempLikeData) {
        return {
          ...post,
          isLikedByUser: tempLikeData.liked,
          likeCount: tempLikeData.count
        };
      }
      return post;
    });
  }, [localPosts, tempLikes]);


  // Add this useEffect to detect offline/online status
  useEffect(() => {
    const handleOnline = () => {
      console.log("Connection restored");
      // Optionally auto-retry failed requests
      if (userError) fetchUserDetails();
      if (crinzError) fetchCrinzMessages();
    };

    const handleOffline = () => {
      console.log("Connection lost");
      setSaveError("You are offline. Changes will be saved when connection is restored.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userError, crinzError, fetchUserDetails, fetchCrinzMessages]);


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
    if (tempHighlight && postsWithTempLikes.length > 0) {
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
  }, [tempHighlight, postsWithTempLikes]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpen) setMenuOpen(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  // Toggle like function with temporary state
  const toggleLike = (postId: string, liked: boolean) => {
    const post = localPosts.find(p => p.crinzId === postId);
    if (!post) return;

    const tempLikeData = tempLikes.get(postId);
    const effectiveLiked = tempLikeData ? tempLikeData.liked : post.isLikedByUser;

    if (effectiveLiked === liked) return; // no state change

    const currentLikeCount = tempLikeData ? tempLikeData.count : (post.likeCount || 0);
    const newLikeCount = liked ? currentLikeCount + 1 : currentLikeCount - 1;

    setTempLikes(prev => {
      const newMap = new Map(prev);
      newMap.set(postId, { liked, count: Math.max(0, newLikeCount) });
      return newMap;
    });

    addPendingAction({
      type: liked ? "like" : "unlike",
      postId,
      crinzId: postId,
      timestamp: Date.now().toString()
    });
  };


  // Add comment function
  const addComment = (postId: string, commentText: string) => {
    const newComment: Comment = {
      commentId: `temp-${Date.now()}`,
      crinzId: postId,
      userId: currentUserId!,
      comment: commentText,
      timestamp: Date.now(),
      userDisplayName: auth.user?.profile?.given_name || "You"
    };

    // Update temporary comments state
    setTempComments(prev => {
      const newMap = new Map(prev);
      const existingComments = newMap.get(postId) || [];
      newMap.set(postId, [newComment, ...existingComments]);
      return newMap;
    });

    // Update post comment count
    const post = localPosts.find(p => p.crinzId === postId);
    if (post) {
      setLocalPosts(prev => prev.map(p =>
        p.crinzId === postId
          ? { ...p, commentCount: (p.commentCount || 0) + 1 }
          : p
      ));
    }

    // Add to pending actions for batch processing
    addPendingAction({
      type: "add_comment",
      postId: postId,
      crinzId: postId,
      payload: commentText,
      timestamp: Date.now().toString()
    });
  };

  // Delete comment function
  const deleteComment = (postId: string, commentId: string) => {
    const isTemp = commentId.startsWith('temp-');

    // Find the comment text to match with add action
    const tempComment = tempComments.get(postId)?.find(c => c.commentId === commentId);
    const commentText = tempComment?.comment;

    setTempComments(prev => {
      const newMap = new Map(prev);
      const existingComments = newMap.get(postId) || [];

      if (isTemp) {
        // Remove temp comment completely
        const updatedComments = existingComments.filter(c => c.commentId !== commentId);
        newMap.set(postId, updatedComments);

        // Try to find and remove the corresponding add_comment action
        if (commentText) {
          clearPendingActionFor({
            type: "add_comment",
            postId,
            payload: commentText
          });
        }
      } else {
        // For server comments, mark as deleted
        const deletedComment: Comment = {
          commentId: `deleted-${commentId}`,
          crinzId: postId,
          userId: currentUserId!,
          comment: "[deleted]",
          timestamp: Date.now(),
          userDisplayName: "You"
        };
        newMap.set(postId, [deletedComment, ...existingComments]);

        // Add remove_comment action
        addPendingAction({
          type: "remove_comment",
          postId,
          crinzId: postId,
          commentId
        });
      }
      return newMap;
    });

    // Update post comment count
    setLocalPosts(prev => prev.map(p =>
      p.crinzId === postId
        ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) }
        : p
    ));
  };

  const handleEditPost = (post: CrinzMessage) => {
    setEditModal(post);
    setMenuOpen(null);
  };

  const handleSaveEdit = (updatedPost: CrinzMessage) => {
    // Add to pending actions - include tags in the data
    addPendingAction({
      type: 'update',
      postId: updatedPost.crinzId,
      data: {
        message: updatedPost.message,
        tags: updatedPost.tags ?? []  // Changed from category to tags
      }
    });

    // Update local state immediately
    setLocalPosts(prev => prev.map(post =>
      post.crinzId === updatedPost.crinzId ? {
        ...post,
        message: updatedPost.message,
        tags: updatedPost.tags ?? []
      } : post
    ));

    // REMOVE THIS LINE: Don't mark the post as pending for editing
    // setLocalActions(prev => new Map(prev).set(updatedPost.crinzId, 'update'));
    setEditModal(null);
    setSaveError(null);
  };

  // Add this function inside your component
  const clearAllActionsForPost = (postId: string) => {
    const actionTypes = ['like', 'unlike', 'add_comment', 'remove_comment', 'update'];

    actionTypes.forEach(type => {
      clearPendingActionFor({
        type: type as any,
        postId: postId
      });
    });
  };

  // Then use it in handleDeletePost:
  const handleDeletePost = (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    // Clear ALL pending actions for this post first
    clearAllActionsForPost(postId);

    // Then add the delete action
    addPendingAction({
      type: 'delete',
      postId: postId
    });

    // Update local state immediately (optimistic update)
    setLocalPosts(prev => prev.filter(post => post.crinzId !== postId));

    // REMOVE THIS LINE: Don't mark the post as pending for deletion
    // setLocalActions(prev => new Map(prev).set(postId, 'delete'));
    setMenuOpen(null);
    setSaveError(null);
  };

  const handleSaveChanges = async () => {
    if (!hasPendingActions) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await executePendingActions();

      // Clear all local states first
      setLocalActions(new Map());
      setTempLikes(new Map());
      setTempComments(new Map());
      clearPendingActions();

      // Refetch data without clearing the current display
      if (userSub) {
        try {
          await fetchCrinzMessages();
        } catch (error) {
          console.error("Refresh failed after save:", error);
          // Don't throw here - the main action succeeded, just the refresh failed
          // You could show a warning instead
          setSaveError("Changes saved but failed to refresh: " +
            (error instanceof Error ? error.message : "Unknown error"));
        }
      }

    } catch (error) {
      console.error("Failed to save changes:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save changes";
      setSaveError(errorMessage);

      // Optional: Revert optimistic updates on error
      setLocalPosts(crinzMessages);

    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (window.confirm("Are you sure you want to discard all unsaved changes?")) {
      clearPendingActions();
      setLocalActions(new Map());
      setTempLikes(new Map());
      setTempComments(new Map());
      // Reload the original data
      setLocalPosts(crinzMessages);
      setSaveError(null);
    }
  };

  const toggleMenu = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === postId ? null : postId);
  };

  const isPostPending = (postId: string) => localActions.has(postId);

  return (
    <div className="crinz-feed-container">
      {/* Error Display */}
      {userError && (
        <div className="error-banner">
          <h3>Error loading user profile</h3>
          <p>{userError.message || "Failed to load user information"}</p>
          <button onClick={() => fetchUserDetails()}>Retry</button>
        </div>
      )}

      {crinzError && (
        <div className="error-banner">
          <h3>Error loading posts</h3>
          <p>{crinzError.message || "Failed to load posts"}</p>
          <button onClick={() => fetchCrinzMessages()}>Retry</button>
        </div>
      )}

      {loadingCrinz && crinzMessages.length === 0 && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading posts...</p>
        </div>
      )}

      {!loadingCrinz && crinzMessages.length === 0 && !crinzError && (
        <div className="empty-state">
          <p>No posts found</p>
        </div>
      )}
      
      {/* Save Changes Button */}
      {hasPendingActions && (
        <div className="save-changes-bar">
          <div className="save-changes-content">
            <span>You have {pendingActionsCount} unsaved change{pendingActionsCount !== 1 ? 's' : ''}</span>
            <div className="save-actions">
              <button
                onClick={handleDiscardChanges}
                className="btn-discard"
                disabled={isSaving}
              >
                Discard
              </button>
              <button
                onClick={handleSaveChanges}
                className="btn-save"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          {saveError && (
            <div className="save-error">
              Error: {saveError}
            </div>
          )}
        </div>
      )}

      {postsWithTempLikes.map(post => {
        const shareUrl = `${window.location.origin}/post/${encodePostData(post)}`;
        const isHighlighted = post.crinzId === tempHighlight;
        const isMenuOpen = menuOpen === post.crinzId;
        const isPending = isPostPending(post.crinzId);

        return (
          <div
            key={post.crinzId}
            id={`post-${post.crinzId}`}
            className={`crinz-post ${isHighlighted ? "highlighted" : ""} ${isPending ? "pending" : ""}`}
          >
            {isPending && (
              <div className="pending-indicator">
                {localActions.get(post.crinzId) === 'update' ? '✏️ Edited' : '🗑️ Deleted'}
              </div>
            )}

            <div className="post-header">
              <div className="post-user-info">
                <span className="user-name">@{post.userName || "user"}</span>
              </div>

              {isOwnPost && (
                <div className="post-menu-container">
                  <button
                    className="post-menu-button"
                    onMouseEnter={(e) => !isPending && (e.currentTarget.style.background = '#f0f0f0')}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    onClick={(e) => !isPending && toggleMenu(e, post.crinzId)}
                    disabled={isPending}
                  >
                    ⋮
                  </button>

                  {isMenuOpen && (
                    <div
                      className="post-menu-dropdown"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="menu-item"
                        onClick={() => handleEditPost(post)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="menu-item delete"
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
                onClick={() => toggleLike(post.crinzId, !post.isLikedByUser)}
                className={`like-button ${post.isLikedByUser ? "liked" : ""}`}
                title={isPending ? "Changes pending save" : ""}
              >
                {post.isLikedByUser ? "❤️" : "🤍"} {post.likeCount || 0}
              </button>

              <button
                onClick={() => setActiveModal(post.crinzId)}
                className="comments-button"
              >
                💬 {post.commentCount || 0}
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  setSharedLink(shareUrl);
                }}
              >
                {sharedLink === shareUrl ? "✅ link_copied" : "🔗 Share"}
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

      {activeModal && (
        <HandleCommentsView
          postId={activeModal}
          initialCommentCount={postsWithTempLikes.find(p => p.crinzId === activeModal)?.commentCount || 0}
          comments={tempComments.get(activeModal) || []}
          onClose={() => setActiveModal(null)}
          onAddComment={addComment}
          onDeleteComment={deleteComment}
          currentUserId={currentUserId}
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