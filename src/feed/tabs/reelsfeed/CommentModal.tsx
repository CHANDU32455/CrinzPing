import React, { useState, useCallback, useEffect } from "react";
import UserAvatar from "../../utils/UserAvatar";
import "./CommentModal.css";

interface Comment {
    commentId: string;
    userId: string;
    comment: string;
    timestamp: number;
}

interface CommentModalProps {
    postId: string;
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    postMessage: string;
    currentUserId?: string;
    onNewComment: (postId: string, commentText: string) => void;
    onDeleteComment: (postId: string) => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
    postId,
    isOpen,
    onClose,
    userName,
    postMessage,
    currentUserId,
    onNewComment,
    onDeleteComment
}) => {
    const [newComment, setNewComment] = useState("");
    const [localComments, setLocalComments] = useState<Comment[]>([]);
    const [isClosing, setIsClosing] = useState(false);

    const handleCloseModal = useCallback(() => {
        if (isClosing) return;

        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    }, [isClosing, onClose]);

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

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserId) return;

        // Optimistically add comment to UI
        const newCommentObj: Comment = {
            commentId: `temp-${Date.now()}`,
            userId: currentUserId,
            comment: newComment.trim(),
            timestamp: Date.now()
        };

        setLocalComments(prev => [newCommentObj, ...prev]);
        setNewComment("");

        // Notify parent component
        onNewComment(postId, newComment.trim());
    };

    const handleDeleteComment = (commentId: string) => {
        const commentToDelete = localComments.find(c => c.commentId === commentId);

        // Optimistically remove comment from UI
        setLocalComments(prev => prev.filter(c => c.commentId !== commentId));

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

    // In CommentModal.tsx, replace the return statement with this:
    return (
        <div
            className={`reels-comment-modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={handleCloseModal}
        >
            <div
                className={`reels-comment-modal ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="reels-comment-modal-header">
                    <div className="reels-comment-modal-drag-handle"></div>
                    <h3>Reel Comments</h3>
                    <button className="reels-comment-close-button" onClick={handleCloseModal} aria-label="Close">
                        &times;
                    </button>
                </div>

                {/* Post Preview */}
                <div className="reels-post-preview">
                    <div className="reels-post-author">@{userName}</div>
                    <div className="reels-post-content-preview">{postMessage}</div>
                </div>

                {/* Comments Container */}
                <div className="reels-comments-container">
                    {localComments.length === 0 ? (
                        <div className="reels-no-comments">No comments yet. Be the first to comment!</div>
                    ) : (
                        localComments.map((comment) => (
                            <div key={comment.commentId} className="reels-comment-item">
                                <div className="reels-comment-header">
                                    <UserAvatar userName={comment.userId} size={32} className="reels-comment-avatar" />
                                    <div className="reels-comment-meta">
                                        <span className="reels-comment-author">@{comment.userId.slice(0, 3)}...{comment.userId.slice(-3)}</span>
                                        <span className="reels-comment-time">{formatTime(comment.timestamp)}</span>
                                    </div>
                                    {currentUserId === comment.userId && (
                                        <button
                                            className="reels-delete-comment-btn"
                                            onClick={() => handleDeleteComment(comment.commentId)}
                                            title="Delete comment"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                                <div className="reels-comment-text">{comment.comment}</div>
                            </div>
                        ))
                    )}
                </div>

                {/* Comment Form */}
                <form onSubmit={handleSubmitComment} className="reels-comment-form">
                    <div className="reels-input-container">
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
                            className="reels-submit-button"
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