import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInViewport } from '../../hooks/useInViewPort';
import ProfilePicture from '../shared/ProfilePicture';
import EngagementButtons from './personalized/EngagementButtons';
import "../../styles/global-feed.css";

interface CrinzMessageUser {
  profilePic?: string;
  userName?: string;
}

interface CrinzMessageItem {
  userId?: string;
  user?: CrinzMessageUser;
  timestamp: string;
  content: string;
  id?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  isLiked?: boolean;
  type?: string;
}

interface CrinzTileProps {
  item: CrinzMessageItem;
  onComment: () => void;
  onShare: () => void;
  onLikeUpdate?: (contentId: string, newLikeCount: number, isLiked: boolean) => void;
}

const CrinzTile: React.FC<CrinzTileProps> = ({ item, onComment, onShare, onLikeUpdate }) => {
  const navigate = useNavigate();
  const { ref } = useInViewport();

  // ✅ UPDATED: Handle like with callback
  const handleLike = React.useCallback(() => {
    // This will be handled by EngagementButtons with the callback
  }, []);

  const formatRelativeTime = React.useCallback((iso: string) => {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - then);
    const minutes = Math.floor(diffMs / (60 * 1000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  const relative = formatRelativeTime(item.timestamp);

  return (
    <div ref={ref} className="feed-post">
      {/* Header */}
      <div className="post-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div className="user-avatar">
            <ProfilePicture
              src={item.user?.profilePic}
              alt={item.user?.userName || 'User'}
              fallbackText={item.user?.userName || 'U'}
              borderColor="border-cyan-500"
            />
          </div>
          <div className="user-info">
            <span
              className="username"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                if (item.userId) navigate(`/profile/${item.userId}`);
              }}
            >
              {item.user?.userName || 'Anonymous'}
            </span>
            <span className="timestamp">
              {new Date(item.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            border: '1px solid rgba(0, 255, 204, 0.3)',
            background: 'rgba(0, 255, 204, 0.08)',
            color: '#00ffcc',
            whiteSpace: 'nowrap'
          }}
          aria-label="Crinz tag and relative time"
        >
          CRINZ • {relative}
        </span>
      </div>

      {/* Content */}
      <div className="post-content">
        <p>"{item.content}"</p>
      </div>

      {/* Engagement Buttons */}
      <div style={{ justifyContent: 'center' }}>
        <EngagementButtons
          item={item}
          onLike={handleLike}
          onShare={onShare}
          onComment={onComment}
          onLikeUpdate={onLikeUpdate} // ✅ NEW: Pass like callback
          centered
        />
      </div>
    </div>
  );
};

export default CrinzTile;