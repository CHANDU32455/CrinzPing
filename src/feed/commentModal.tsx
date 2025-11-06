import React, { useState, useCallback, useEffect } from "react";
import UserAvatar from "./utils/UserAvatar";
import { fetchComments, type Comment } from "./utils/commentsService";
import { batchSyncer } from "./utils/msgsBatchSyncer";
import "./css/CommentModal.css";

interface CommentModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  postMessage: string;
  commentCount?: number;
  currentUserId?: string;
  accessToken?: string;
  contentType?: 'post' | 'reel' | 'crinz_message';
  contentManager?: any;
  onNewComment: (postId: string, commentText: string) => void;
  onDeleteComment: (postId: string) => void;
}

// Cache for comments by post ID
const commentsCache = new Map<string, Comment[]>();

const CommentModal: React.FC<CommentModalProps> = ({
  postId,
  isOpen,
  onClose,
  userName,
  postMessage,
  commentCount,
  contentType = 'post', // ✅ DEFAULT to 'post' if not provided
  currentUserId,
  accessToken,
  onNewComment,
  onDeleteComment
}) => {
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && postId && accessToken && (commentCount ?? 0) > 0) {
      if (commentsCache.has(postId)) {
        setLocalComments(commentsCache.get(postId)!);
        return;
      }

      setIsLoading(true);
      setError(null);

      fetchComments(postId, accessToken)
        .then(({ comments }) => {
          console.log("Fetched LIVE comments for post:", postId, comments);
          commentsCache.set(postId, comments);
          setLocalComments(comments);
        })
        .catch((err) => {
          setError(err.message || "Failed to fetch comments");
          console.error("Error fetching comments:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (isOpen && (commentCount ?? 0) === 0) {
      setLocalComments([]);
    }
  }, [isOpen, postId, accessToken, commentCount]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    // ✅ IMPROVED: Proper payload with content type
    const payload: any = {
      comment: newComment.trim(),
      commentId: `temp-${Date.now()}`,
      contentType: contentType, // ✅ Always include content type
      isCrinzMessage: contentType === 'crinz_message'
    };

    console.log('📤 CommentModal - Sending comment with payload:', {
      postId,
      contentType,
      payload
    });

    // Send to batch syncer with proper content type
    batchSyncer.addAction({
      type: 'add_comment',
      crinzId: postId,
      userId: currentUserId,
      payload: payload
    });

    // Optimistically add comment to UI
    const newCommentObj: Comment = {
      commentId: `temp-${Date.now()}`,
      crinzId: postId,
      comment: newComment,
      timestamp: Date.now(),
      userId: currentUserId
    };

    setLocalComments(prev => [newCommentObj, ...prev]);

    // Update cache
    const cachedComments = commentsCache.get(postId) || [];
    commentsCache.set(postId, [newCommentObj, ...cachedComments]);

    // ✅ UPDATED: Notify parent to update comment count
    onNewComment(postId, newComment);

    setNewComment("");
  };

  // ✅ UPDATED: Proper delete comment with content type
  const handleDeleteComment = (commentId: string) => {
    console.log('🗑️ CommentModal - Deleting comment:', commentId);
    
    // ✅ FIXED: Use actual contentType from props instead of hardcoding
    const payload = {
      commentId: commentId,
      contentType: contentType, // ✅ Use the actual content type
      isCrinzMessage: contentType === 'crinz_message'
    };

    console.log('🗑️ CommentModal - Delete payload:', payload);

    batchSyncer.addAction({
      type: 'remove_comment',
      crinzId: postId,
      userId: currentUserId!,
      payload: payload
    });

    // Optimistic UI update
    setLocalComments(prev => prev.filter(c => c.commentId !== commentId));
    
    // Update cache
    if (commentsCache.has(postId)) {
      const cachedComments = commentsCache.get(postId)!.filter(c => c.commentId !== commentId);
      commentsCache.set(postId, cachedComments);
    }

    // ✅ UPDATED: Notify parent to update comment count
    onDeleteComment(postId);
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
    <div className="comment-modal-overlay" onClick={onClose}>
      <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comment-modal-header">
          <h3>Comments</h3>
          <button className="close-button" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="post-preview">
          <div className="post-author">@{userName}</div>
          <div className="post-content-preview">{postMessage}</div>
        </div>

        <div className="comments-container">
          {isLoading ? (
            <div className="loading-comments">Loading comments...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : localComments.length === 0 ? (
            <div className="no-comments">No comments yet. Be the first to comment!</div>
          ) : (
            localComments.map((comment) => (
              <div key={comment.commentId} className="comment-item">
                <div className="comment-header">
                  <UserAvatar userName={comment.userId} size={32} className="comment-avatar" />
                  <div className="comment-meta">
                    <span className="comment-author">@{comment.userId.slice(0, 3)}...{comment.userId.slice(-3)}</span>
                    <span className="comment-time">{formatTime(comment.timestamp)}</span>
                  </div>
                  {currentUserId === comment.userId && (
                    <button
                      className="delete-comment-btn"
                      onClick={() => handleDeleteComment(comment.commentId)}
                      title="Delete comment"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <div className="comment-text">{comment.comment}</div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmitComment} className="comment-form">
          <div className="input-container">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              disabled={!currentUserId}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || !currentUserId}
              className="submit-button"
            >
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentModal;