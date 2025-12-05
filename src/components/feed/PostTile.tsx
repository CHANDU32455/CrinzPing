import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInViewport } from '../../hooks/useInViewPort';
import { useAudioPlayer, useMediaManager } from '../../hooks/useMediaManager';
import ProfilePicture from '../shared/ProfilePicture';
import ImageCarousel from './personalized/ImageCarousel';
import EngagementButtons from './personalized/EngagementButtons';

interface PostFile {
  type: string;
  url: string;
  id?: string;
  name?: string;
}

interface PostUser {
  profilePic?: string;
  userName?: string;
  tagline?: string;
}

interface PostItem {
  id: string;
  userId?: string;
  user?: PostUser;
  timestamp: string;
  content?: string;
  files?: PostFile[];
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  isLiked?: boolean;
}

interface PostTileProps {
  item: PostItem;
  onComment: () => void;
  onShare: () => void;
  onLikeUpdate?: (contentId: string, newLikeCount: number, isLiked: boolean) => void;
}

const PostTile: React.FC<PostTileProps> = ({ item, onComment, onShare, onLikeUpdate }) => {
  const navigate = useNavigate();
  const { ref, isInViewport, hasBeenInViewport } = useInViewport({ threshold: 0.7 });
  const { playAudio, stopAudio } = useAudioPlayer();
  const { activateMedia, deactivateMedia } = useMediaManager();

  const audioFile = item.files?.find((f: PostFile) => f.type.startsWith('audio/'));
  const imageFiles = item.files?.filter((f: PostFile) => f.type.startsWith('image/')) || [];

  // Handle audio based on viewport
  React.useEffect(() => {
    if (isInViewport && audioFile) {
      playAudio(item.id, audioFile.url);
      activateMedia(item.id);
    } else {
      stopAudio(item.id);
      deactivateMedia(item.id);
    }
  }, [isInViewport, audioFile, item.id, playAudio, stopAudio, activateMedia, deactivateMedia]);

  // Handle like with callback
  const handleLike = React.useCallback(() => {
    // This will be handled by EngagementButtons with the callback
  }, []);

  return (
    <div
      ref={ref}
      className="bg-gray-900 border border-gray-700 rounded-2xl p-4 md:p-6 w-full hover:border-blue-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <ProfilePicture
            src={item.user?.profilePic}
            alt={item.user?.userName || 'User'}
            fallbackText={item.user?.userName || 'U'}
            borderColor="border-blue-500"
          />
          <div className="min-w-0 flex-1">
            <p
              className="text-white font-semibold text-base truncate underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (item.userId) navigate(`/profile/${item.userId}`);
              }}
            >
              {item.user?.userName || 'Anonymous'}
            </p>
            {item.user?.tagline && (
              <p className="text-gray-400 text-sm italic truncate">"{item.user.tagline}"</p>
            )}
            <p className="text-gray-400 text-sm">
              {new Date(item.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-blue-900 bg-opacity-50 rounded-full text-xs font-medium border border-blue-700 flex-shrink-0 ml-2">
          POST
        </span>
      </div>

      {/* Content */}
      {item.content && (
        <p className="text-gray-200 text-base mb-4 leading-relaxed">{item.content}</p>
      )}

      {/* Images */}
      <ImageCarousel images={imageFiles} />

      {/* Audio Indicator */}
      {audioFile && (
        <div className="flex items-center gap-3 text-green-400 text-sm mb-3">
          <div className={`w-3 h-3 rounded-full ${isInViewport ? 'bg-green-400 animate-pulse' : 'bg-green-600'}`} />
          <span className="font-medium">
            {isInViewport ? '🎵 Playing...' : hasBeenInViewport ? '🔊 Ready' : '🔊 Audio'}
          </span>
        </div>
      )}

      {/* Engagement Buttons */}
      <EngagementButtons
        item={item}
        onLike={handleLike}
        onShare={onShare}
        onComment={onComment}
        onLikeUpdate={onLikeUpdate}
      />
    </div>
  );
};

export default PostTile;