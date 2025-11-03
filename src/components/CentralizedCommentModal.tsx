import React, { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { contentManager } from '../utils/Posts_Reels_Stats_Syncer';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: number;
  userProfilePic?: string;
}

interface CentralizedCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentType: 'post' | 'reel' | 'crinz_message';
  content: {
    userName: string;
    message: string;
    timestamp: string;
  };
  onNewComment?: () => void;
  onDeleteComment?: () => void;
}

export default function CentralizedCommentModal({
  isOpen,
  onClose,
  contentId,
  contentType,
  content,
  onNewComment,
  onDeleteComment
}: CentralizedCommentModalProps) {
  const auth = useAuth();
  const userId = auth.user?.profile?.sub;
  const accessToken = auth.user?.access_token;

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Enhanced fetchComments function
  const fetchComments = async (loadMore = false) => {
    if (!contentId) return;

    setLoading(true);
    try {
      const GET_COMMENTS_API = `${import.meta.env.VITE_BASE_API_URL}/getComments`;

      const params = new URLSearchParams({
        contentId: contentId,
        limit: '15',
        sort: 'desc' // newest first
      });

      if (loadMore && lastKey) {
        params.append('lastKey', JSON.stringify(lastKey));
      }

      const response = await fetch(`${GET_COMMENTS_API}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (loadMore) {
          setComments(prev => [...prev, ...data.comments]);
        } else {
          setComments(data.comments || []);
        }
        setLastKey(data.lastKey || null);
        setHasMore(!!data.lastKey);
      } else {
        throw new Error(data.error || 'Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      // Show error state to user
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
      // Reset states when closing
      setComments([]);
      setLastKey(null);
      setHasMore(true);
    }, 300);
  };

  // Fetch comments when modal opens
  useEffect(() => {
    if (isOpen && contentId) {
      fetchComments();
    }
  }, [isOpen, contentId]);

  // Handle escape key and backdrop click
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userId || submitting) return;

    setSubmitting(true);
    const tempCommentId = `temp-${Date.now()}`;

    // Optimistically add comment
    const optimisticComment: Comment = {
      id: tempCommentId,
      userId: userId,
      userName: 'You',
      comment: newComment.trim(),
      timestamp: Date.now(),
    };

    setComments(prev => [optimisticComment, ...prev]);
    const previousComment = newComment;
    setNewComment('');

    try {
      // Use centralized content manager
      await contentManager.addComment(contentId, contentType, userId, previousComment, tempCommentId);

      // Refresh comments to get the actual comment from server
      fetchComments();
      
      // Notify parent component
      onNewComment?.();
    } catch (error) {
      console.error('Error adding comment:', error);
      // Remove optimistic comment on error
      setComments(prev => prev.filter(comment => comment.id !== tempCommentId));
      // Restore the comment text
      setNewComment(previousComment);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) return;

    // Store the comment being deleted for potential rollback
    const deletedComment = comments.find(comment => comment.id === commentId);
    
    // Optimistically remove comment
    setComments(prev => prev.filter(comment => comment.id !== commentId));

    try {
      // Use centralized content manager
      await contentManager.removeComment(contentId, contentType, userId, commentId);

      // Notify parent component
      onDeleteComment?.();
    } catch (error) {
      console.error('Error deleting comment:', error);
      // Restore comment on error
      if (deletedComment) {
        setComments(prev => [deletedComment, ...prev]);
      }
    }
  };

  const formatTime = (timestamp: number) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - commentTime.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isClosing ? 'bg-black bg-opacity-0' : 'bg-black bg-opacity-75'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`
          fixed left-0 right-0 bg-gray-900 rounded-t-3xl flex flex-col transition-transform duration-300
          ${isClosing ? 'translate-y-full' : 'translate-y-0'}
          h-[85vh] max-h-[85vh]
          sm:inset-auto sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2 
          sm:rounded-2xl sm:max-w-2xl sm:w-full sm:max-h-[80vh] sm:h-auto
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Mobile with drag handle */}
        <div className="sm:hidden pt-3 px-4">
          <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-3"></div>
        </div>
        
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Comments</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl p-1"
          >
            ×
          </button>
        </div>

        {/* Original Content */}
        <div className="p-4 sm:p-6 border-b border-gray-700">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">
                {content.userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-white font-semibold text-sm">{content.userName}</span>
                <span className="text-gray-400 text-xs">{formatTime(new Date(content.timestamp).getTime())}</span>
              </div>
              <p className="text-gray-200 text-sm break-words">{content.message}</p>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading && comments.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {comment.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-semibold text-sm">
                        {comment.userName}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {formatTime(comment.timestamp)}
                      </span>
                      {comment.userId === userId && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-400 hover:text-red-300 text-xs ml-auto"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-gray-200 text-sm break-words">{comment.comment}</p>
                  </div>
                </div>
              ))}
              
              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => fetchComments(true)}
                    disabled={loading}
                    className="text-purple-400 hover:text-purple-300 text-sm font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load more comments'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmitComment} className="p-4 sm:p-6 border-t border-gray-700 bg-gray-900">
          <div className="flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm sm:text-base"
              disabled={submitting}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
            >
              {submitting ? '...' : 'Post'}
            </button>
          </div>
          {newComment.length > 400 && (
            <div className="text-right mt-2">
              <span className={`text-xs ${newComment.length > 480 ? 'text-red-400' : 'text-gray-400'}`}>
                {newComment.length}/500
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}