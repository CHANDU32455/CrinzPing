import React from 'react';
import { useInViewport } from '../feed/tabs/personalizedfeed/Parts/useInViewPort';
import ProfilePicture from './ProfilePicture';
import EngagementButtons from '../feed/tabs/personalizedfeed/Parts/EngagementButtons';

interface CrinzTileProps {
  item: any;
  onComment: () => void;
  onShare: () => void;
  onLikeUpdate?: (contentId: string, newLikeCount: number, isLiked: boolean) => void; // ✅ NEW: Like callback
}

const CrinzTile: React.FC<CrinzTileProps> = ({ item, onComment, onShare, onLikeUpdate }) => {
  const { ref } = useInViewport();

  // ✅ UPDATED: Handle like with callback
  const handleLike = React.useCallback(() => {
    // This will be handled by EngagementButtons with the callback
  }, []);

  return (
    <div
      ref={ref}
      className="bg-gradient-to-r from-cyan-900 to-blue-900 border border-cyan-700 rounded-2xl p-4 md:p-6 w-full shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <ProfilePicture
            src={item.user?.profilePic}
            alt={item.user?.userName || 'User'}
            fallbackText={item.user?.userName || 'U'}
            borderColor="border-cyan-500"
          />
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-base truncate">
              {item.user?.userName || 'Anonymous'}
            </p>
            {item.user?.tagline && (
              <p className="text-cyan-200 text-sm italic truncate">"{item.user.tagline}"</p>
            )}
            <p className="text-cyan-300 text-sm">
              {new Date(item.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-cyan-800 bg-opacity-50 rounded-full text-xs font-medium border border-cyan-600 flex-shrink-0 ml-2">
          CRINZ
        </span>
      </div>

      {/* Content */}
      <p className="text-white text-base mb-4 leading-relaxed italic">"{item.content}"</p>

      {/* Engagement Buttons */}
      <EngagementButtons
        item={item}
        onLike={handleLike}
        onShare={onShare}
        onComment={onComment}
        onLikeUpdate={onLikeUpdate} // ✅ NEW: Pass like callback
      />
    </div>
  );
};

export default CrinzTile;