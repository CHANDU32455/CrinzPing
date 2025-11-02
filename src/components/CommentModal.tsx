import React, { useState, useCallback, useEffect, type FormEvent } from "react";
import "../css/CommentModal.css";
import { useNavigate } from "react-router-dom";

interface Comment {
  commentId: string;
  crinzId: string;
  comment: string;
  timestamp: number | string; // allow string here
  userId: string;
}

interface CommentModalProps {
  crinzId: string;
  comments: Comment[];
  currentUserId: string;
  onClose: () => void;
  onAddComment: (crinzId: string, newComment: string) => void;
  onRemoveComment: (crinzId: string, commentId: string) => void;
  fetchingComments?: boolean;
}

const CommentModal: React.FC<CommentModalProps> = ({
  crinzId,
  comments,
  currentUserId,
  onClose,
  onAddComment,
  onRemoveComment,
  fetchingComments = false,
}) => {
  const [newComment, setNewComment] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (adding) return;

    const trimmed = newComment.trim();
    if (!trimmed) return;

    setAdding(true);
    try {
      onAddComment(crinzId, trimmed);
      setNewComment("");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (commentId: string) => {
    if (deletingIds.has(commentId)) return;
    setDeletingIds((prev) => new Set(prev).add(commentId));
    try {
      onRemoveComment(crinzId, commentId);
    } finally {
      setDeletingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(commentId);
        return copy;
      });
    }
  };

  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  const formatDate = (ts: number | string) => {
    const numericTs = typeof ts === "string" ? Number(ts) : ts;
    if (isNaN(numericTs) || numericTs <= 0) return "Invalid date";
    return new Date(numericTs).toLocaleString();
  };

  return (
    <div className="comment-modal-wrapper">
      <div
        className="comment-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comments-heading"
        onClick={onClose}
      >
        <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
          <button
            className="close-btn"
            aria-label="Close comments modal"
            onClick={onClose}
          >
            ✖
          </button>

          <h2 id="comments-heading">Comments</h2>

          {fetchingComments && comments.length === 0 ? (
            <p className="loading-text">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="no-comments">No comments yet. Be the first!</p>
          ) : (
            <div className="comments-container">
              {comments.map((comment) => (
                <div key={comment.commentId} className="comment-item">
                  <div className="comment-header">
                    <span
                      className="user-name"
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                      onClick={() => navigate(`/profile/${comment.userId}`)}
                    >
                      @{`${comment.userId.slice(0, 3)}...${comment.userId.slice(-3)}`}
                    </span>

                    <span className="comment-timestamp">
                      {formatDate(comment.timestamp)}
                    </span>
                  </div>

                  <div className="comment-body">
                    <p className="comment-text">{comment.comment}</p>

                    {comment.userId === currentUserId && (
                      <button
                        className="comment-delete-btn"
                        title="Remove comment"
                        aria-label="Remove comment"
                        disabled={deletingIds.has(comment.commentId)}
                        onClick={() => handleDelete(comment.commentId)}
                      >
                        {deletingIds.has(comment.commentId) ? "⏳" : "🗑"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!fetchingComments && (
            <form className="add-comment" onSubmit={handleSubmit}>
              <input
                type="text"
                value={newComment}
                placeholder="Write a comment..."
                onChange={(e) => setNewComment(e.target.value)}
                autoFocus
                aria-label="Write a comment"
                disabled={adding}
              />
              <button
                type="submit"
                disabled={adding || newComment.trim() === ""}
              >
                {adding ? "Posting..." : "Post"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
