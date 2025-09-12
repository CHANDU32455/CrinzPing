import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useComments } from "../../hooks/useComments";
import type { Comment } from "../../hooks/useComments";
import UserAvatar from "./UserAvatar";
import { usePendingActions } from "../utils/pendingActions";
import "../css/CommentModal.css";

interface CommentModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  userName: string;
  postMessage: string;
  currentUserId?: string;
  onCommentAdded?: () => void;
  onCommentRemoved?: () => void;
}

interface ProcessedItem {
  type: string;
  crinzId: string;
  commentId?: string;
  status?: string;
  error?: string;
  timestamp?: number;
}

const CommentModal: React.FC<CommentModalProps> = ({
  postId,
  isOpen,
  onClose,
  accessToken,
  userName,
  postMessage,
  currentUserId,
  onCommentAdded,
  onCommentRemoved
}) => {
  const [newComment, setNewComment] = useState("");
  const { pendingActions, addPendingAction, removePendingActions } = usePendingActions();
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);
  const [deletedCommentIds, setDeletedCommentIds] = useState<Set<string>>(new Set());
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { comments, loading, error, fetchComments, hasMore, addServerComment, removeServerComment } = useComments(
    isOpen ? postId : null,
    accessToken
  );

  const displayedComments = useMemo(() => {
    const realComments = comments.filter(comment => !deletedCommentIds.has(comment.commentId));
    const allComments = [...optimisticComments, ...realComments];

    const pendingDeleteActions = pendingActions.filter(
      action => action.type === 'remove_comment' && action.crinzId === postId
    );

    return allComments
      .filter(comment =>
        !pendingDeleteActions.some(action => action.payload?.commentId === comment.commentId)
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [comments, optimisticComments, deletedCommentIds, pendingActions, postId]);

  // Handle sync completion events
  useEffect(() => {
    const handleSyncComplete = (event: CustomEvent) => {
      const { processed } = event.detail;
      
      processed.forEach((item: ProcessedItem) => {
        if (item.type === "add_comment" && item.status === "comment_added" && item.commentId) {
          // Find the original action to get the comment text
          const originalAction = pendingActions.find(action => 
            action.type === "add_comment" && 
            action.crinzId === item.crinzId &&
            action.timestamp === item.timestamp
          );
          
          if (originalAction) {
            const serverComment: Comment = {
              commentId: item.commentId,
              crinzId: item.crinzId,
              comment: originalAction.payload?.comment || '',
              timestamp: item.timestamp || Date.now(),
              userId: currentUserId || ''
            };
            
            // Remove the optimistic comment and add the server comment
            setOptimisticComments(prev => 
              prev.filter(c => !(c.crinzId === item.crinzId && c.comment === originalAction.payload?.comment))
            );
            
            addServerComment(serverComment);
          }
        } else if (item.type === "remove_comment" && item.status === "comment_removed") {
          // Remove the comment from deleted set since it's confirmed
          setDeletedCommentIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.commentId!);
            return newSet;
          });
          
          removeServerComment(item.commentId!, item.crinzId);
        }
      });
    };

    window.addEventListener('syncComplete', handleSyncComplete as EventListener);
    
    return () => {
      window.removeEventListener('syncComplete', handleSyncComplete as EventListener);
    };
  }, [pendingActions, currentUserId, addServerComment, removeServerComment]);

  // Immediate sync when modal closes
  const handleClose = useCallback(async () => {
    if (pendingActions.length > 0) {
      setIsSyncing(true);
      try {
        // Trigger immediate sync for comments when modal closes
        window.dispatchEvent(new CustomEvent('forceImmediateSync'));
        // Small delay to allow sync to start
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error during immediate sync:', error);
      } finally {
        setIsSyncing(false);
      }
    }
    onClose();
  }, [pendingActions.length, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      setLocalError(null);

      if (postId && accessToken) {
        fetchComments(true);
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
      setOptimisticComments([]);
      setDeletedCommentIds(new Set());
      setLocalError(null);
    };
  }, [isOpen, handleClose, postId, accessToken, fetchComments]);


  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loading) {
      fetchComments(false);
    }
  }, [hasMore, loading, fetchComments]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) {
      setLocalError("Please enter a comment");
      return;
    }

    const tempCommentId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      commentId: tempCommentId,
      crinzId: postId,
      comment: newComment.trim(),
      timestamp: Date.now(),
      userId: currentUserId
    };

    setOptimisticComments(prev => [optimisticComment, ...prev]);
    setNewComment("");
    setLocalError(null);

    addPendingAction({
      type: "add_comment",
      crinzId: postId,
      timestamp: Date.now(),
      payload: { 
        comment: newComment.trim() // Only send comment text, no temp ID
      }
    });

    onCommentAdded?.();
  };

  const handleDeleteComment = (commentId: string) => {
    if (!currentUserId) return;

    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    // For unsynced comments (temp IDs) - remove immediately and neutralize
    if (commentId.startsWith('temp-')) {
      setOptimisticComments(prev => prev.filter(c => c.commentId !== commentId));
      
      // Find and remove the corresponding pending action
      const pendingAction = pendingActions.find(action =>
        action.type === 'add_comment' &&
        action.crinzId === postId &&
        action.payload?.comment === optimisticComments.find(c => c.commentId === commentId)?.comment
      );
      
      if (pendingAction) {
        removePendingActions([pendingAction]);
      }
      
      onCommentRemoved?.();
      return;
    }

    // For synced comments (real IDs) - mark for deletion and send to server
    setDeletedCommentIds(prev => new Set(prev).add(commentId));

    addPendingAction({
      type: "remove_comment",
      crinzId: postId,
      timestamp: Date.now(),
      payload: { commentId } // Send actual comment ID for deletion
    });

    onCommentRemoved?.();
  };

  const formatTime = useCallback((timestamp: number) => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="comment-modal-overlay" onClick={handleClose}>
      <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comment-modal-header">
          <h3>Comments {isSyncing ? "(Syncing...)" : ""}</h3>
          <button className="close-button" onClick={handleClose} aria-label="Close" disabled={isSyncing}>
            &times;
          </button>
        </div>

        <div className="post-preview">
          <div className="post-author">@{userName}</div>
          <div className="post-content-preview">{postMessage}</div>
        </div>

        <div className="comments-container" onScroll={handleScroll}>
          {loading && displayedComments.length === 0 ? (
            <div className="loading-comments">Loading comments...</div>
          ) : error ? (
            <div className="error-message">Error loading comments: {error}</div>
          ) : displayedComments.length === 0 ? (
            <div className="no-comments">No comments yet. Be the first to comment!</div>
          ) : (
            displayedComments.map((comment) => (
              <div key={comment.commentId} className="comment-item">
                <div className="comment-header">
                  <div className="comment-user-info">
                    <UserAvatar userName={comment.userId} size={32} className="comment-avatar" />
                    <div className="comment-meta">
                      <span className="comment-author">@{comment.userId}</span>
                      <span className="comment-time">{formatTime(comment.timestamp)}</span>
                    </div>
                  </div>
                  {currentUserId === comment.userId && (
                    <button
                      className="delete-comment-btn"
                      onClick={() => handleDeleteComment(comment.commentId)}
                      title="Delete comment"
                      disabled={isSyncing}
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <div className="comment-text">{comment.comment}</div>
                {comment.commentId.startsWith('temp-') && (
                  <div className="optimistic-indicator">Posting...</div>
                )}
              </div>
            ))
          )}
          {loading && displayedComments.length > 0 && (
            <div className="loading-more">Loading more comments...</div>
          )}
        </div>

        <form onSubmit={handleSubmitComment} className="comment-form">
          {localError && <div className="error-message">{localError}</div>}
          <div className="input-container">
            <input
              type="text"
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setLocalError(null);
              }}
              placeholder="Add a comment..."
              disabled={!currentUserId || isSyncing}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || !currentUserId || isSyncing}
              className="submit-button"
            >
              Post
            </button>
          </div>
        </form>

        {pendingActions.filter(action =>
          action.crinzId === postId &&
          (action.type === 'add_comment' || action.type === 'remove_comment')
        ).length > 0 && (
            <div className="sync-indicator">
              <p>Comments will sync when closed...</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default CommentModal;