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
  currentUserId?: string;
  accessToken?: string;
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
      // Save the current scroll position
      const scrollY = window.scrollY;

      // Add styles to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      // Cleanup function to restore scrolling when modal closes
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Fetch REAL comments when modal opens
  useEffect(() => {
    if (isOpen && postId && accessToken) {
      // Check cache first
      if (commentsCache.has(postId)) {
        setLocalComments(commentsCache.get(postId)!);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Use the non-hook comments service
      fetchComments(postId, accessToken)
        .then(({ comments }) => {
          console.log("Fetched LIVE comments for post:", postId, comments);

          // Update cache and local state with REAL data
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
    }
  }, [isOpen, postId, accessToken]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    // Send to batch syncer with correct payload structure
    batchSyncer.addAction({
      type: 'add_comment',
      crinzId: postId,
      userId: currentUserId,
      payload: {
        comment: newComment.trim(), // Send as 'comment' not 'text'
        commentId: `temp-${Date.now()}`
      }
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

    setNewComment("");

    // Notify parent component
    onNewComment(postId, newComment);
  };

  
  const handleDeleteComment = (commentId: string) => {
    // Check if this is a temp ID and get the real ID if available
    const realCommentId = batchSyncer.getRealCommentId(commentId) || commentId;

    // Send to batch syncer with the real ID
    batchSyncer.addAction({
      type: 'remove_comment',
      crinzId: postId,
      userId: currentUserId!,
      payload: { commentId: realCommentId }
    });

    // Optimistically remove comment from UI
    const commentToDelete = localComments.find(c => c.commentId === commentId);
    setLocalComments(prev => prev.filter(c => c.commentId !== commentId));

    // Update cache
    if (commentsCache.has(postId)) {
      const cachedComments = commentsCache.get(postId)!.filter(c => c.commentId !== commentId);
      commentsCache.set(postId, cachedComments);
    }

    // Notify parent component
    if (commentToDelete) {
      onDeleteComment(postId);
    }
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