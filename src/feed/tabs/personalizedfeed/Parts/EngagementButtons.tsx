import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { contentManager } from '../../../../utils/Posts_Reels_Stats_Syncer';

interface EngagementButtonsProps {
  item: any;
  onLike: () => void;
  onShare: () => void;
  onComment: () => void;
  onLikeUpdate?: (contentId: string, newLikeCount: number, isLiked: boolean) => void; // ✅ NEW: Like callback
  centered?: boolean;
}

const EngagementButtons: React.FC<EngagementButtonsProps> = ({
  item,
  onLike,
  onShare,
  onComment,
  onLikeUpdate, // ✅ NEW: Like callback prop
  centered = false
}) => {
  const auth = useAuth();
  const userId = auth.user?.profile?.sub;

  // Handle both field name variations
  const [liked, setLiked] = useState(item.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(
    item.likeCount !== undefined ? item.likeCount :
      item.likes !== undefined ? item.likes : 0
  );
  const [commentCount, setCommentCount] = useState(
    item.commentCount !== undefined ? item.commentCount :
      item.comments !== undefined ? item.comments : 0
  );
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);

  useEffect(() => {
    setLocalCommentCount(commentCount);
  }, [commentCount]);

  // Update state when item prop changes
  useEffect(() => {
    setLiked(item.isLikedByUser || false);
    setLikeCount(
      item.likeCount !== undefined ? item.likeCount :
        item.likes !== undefined ? item.likes : 0
    );
    setCommentCount(
      item.commentCount !== undefined ? item.commentCount :
        item.comments !== undefined ? item.comments : 0
    );
  }, [item.isLikedByUser, item.likeCount, item.likes, item.commentCount, item.comments]);

  // ✅ UPDATED: Handle like with parent callback
  const handleLike = useCallback(() => {
    if (!userId) return;

    const newLikedState = !liked;
    const newLikeCount = newLikedState ? likeCount + 1 : Math.max(0, likeCount - 1);

    // Optimistic UI update
    setLiked(newLikedState);
    setLikeCount(newLikeCount);

    console.log('🔄 EngagementButtons - Liking content:', {
      id: item.id,
      type: item.type,
      userId: userId,
      currentlyLiked: liked,
      newLikeCount: newLikeCount
    });

    // Use centralized content manager
    contentManager.likeContent(item.id, item.type, userId, liked);

    // ✅ NEW: Notify parent component of like update
    if (onLikeUpdate) {
      onLikeUpdate(item.id, newLikeCount, newLikedState);
    }

    onLike();
  }, [liked, likeCount, userId, item.id, item.type, onLike, onLikeUpdate]);

  const handleComment = useCallback(() => {
    onComment();
  }, [onComment]);

  const handleShare = useCallback(() => {
    onShare();
  }, [onShare]);

  return (
    <div className={`flex items-center mt-4 pt-4 border-t border-gray-700 w-full ${centered ? 'justify-center' : 'justify-between'}`}>
      <div className={`flex items-center gap-6 ${centered ? 'justify-center w-auto' : 'justify-between w-full'}`}>
        {/* Like Button */}
        <button
          onClick={handleLike}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-800/50 transition-all duration-200 group"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <div className={`p-2 rounded-full transition-all duration-200 ${liked
            ? 'bg-red-500/20 text-red-500 scale-110'
            : 'bg-gray-700/30 text-gray-400'
            }`}>
            {liked ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path d="M10 18.35L8.55 17.03C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0 7.24 0 8.91 0.81 10 2.09 11.09 0.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.54L10 18.35z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path d="M10 18.35L8.55 17.03C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0 7.24 0 8.91 0.81 10 2.09 11.09 0.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.54L10 18.35z" />
              </svg>
            )}
          </div>
          <span className={`text-sm font-semibold min-w-[24px] text-center ${liked ? 'text-red-500' : 'text-gray-400'
            }`}>
            {likeCount}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={handleComment}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-800/50 transition-all duration-200 group"
          aria-label="Comment"
        >
          <div className="p-2 rounded-full bg-gray-700/30 text-gray-400 transition-all duration-200 group-hover:bg-blue-500/20 group-hover:text-blue-400">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
              <path d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm4 0H9v2h2V8zm4 0h-2v2h2V8z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-400 min-w-[24px] text-center">
            {localCommentCount}
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-800/50 transition-all duration-200 group"
          aria-label="Share"
        >
          <div className="p-2 rounded-full bg-gray-700/30 text-gray-400 transition-all duration-200 group-hover:bg-green-500/20 group-hover:text-green-400">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-400 hidden sm:inline">
            Share
          </span>
        </button>
      </div>
    </div>
  );
};

export default EngagementButtons;