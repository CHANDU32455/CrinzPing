import { useNavigate } from "react-router-dom";

interface ReelItemProps {
  reel: {
    postId: string;
    userId: string;
    caption: string;
    likes: number;
    comments: number;
    files: Array<{ presignedUrl: string }>;
    timestamp?: string | number;
    tags?: string[];
    isLiked?: boolean;
    user?: {
      userName: string;
      profilePic: string;
      tagline: string;
    };
  };
  index: number;
  isPlaying: boolean;
  isMuted: boolean;
  showDoubleTap: boolean;
  isExpanded: boolean;
  onVideoClick: (index: number) => void;
  onDoubleTap: (index: number, event: React.MouseEvent) => void;
  onLike: (index: number) => void;
  onComment: (index: number) => void;
  onShare: (index: number) => void;
  onCaptionClick: (index: number, event: React.MouseEvent) => void;
  onVideoRef: (index: number) => (el: HTMLVideoElement | null) => void;
  onVideoEnded: (index: number) => void;
  onVideoError: (index: number) => void;
  onVideoLoaded: (index: number) => void;
  onVideoTimeUpdate: (index: number) => void;
}

const ReelItem: React.FC<ReelItemProps> = ({
  reel,
  index,
  isPlaying,
  isMuted,
  showDoubleTap,
  isExpanded,
  onVideoClick,
  onDoubleTap,
  onLike,
  onComment,
  onShare,
  onCaptionClick,
  onVideoRef,
  onVideoEnded,
  onVideoError,
  onVideoLoaded,
  onVideoTimeUpdate,
}) => {
  const navigate = useNavigate();

  const truncateCaption = (caption: string, maxLength: number = 20): string => {
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + '...';
  };

  return (
    <div key={reel.postId} className="reel-item" data-reel-index={index}>
      <div className="reel-video-container">
        {reel.files[0]?.presignedUrl && (
          <>
            <div
              className="reel-tap-area"
              onDoubleClick={(e) => onDoubleTap(index, e)}
              onClick={() => onVideoClick(index)}
            >
              <video
                ref={onVideoRef(index)}
                className="reel-video"
                src={reel.files[0].presignedUrl}
                loop
                muted={isMuted}
                playsInline
                onEnded={() => onVideoEnded(index)}
                onError={() => onVideoError(index)}
                onLoadedData={() => onVideoLoaded(index)}
                onTimeUpdate={() => onVideoTimeUpdate(index)}
                preload="auto"
              />
            </div>

            {/* Double Tap Like Animation */}
            <div className={`reel-double-tap-overlay ${showDoubleTap ? 'active' : ''}`}>
              <div className="reel-double-tap-heart">❤️</div>
            </div>

            {!isPlaying && (
              <div className="reel-play-overlay" onClick={() => onVideoClick(index)}>
                <div className="reel-play-button">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                {isMuted && (
                  <div className="reel-muted-indicator">🔇</div>
                )}
              </div>
            )}

            {isPlaying && isMuted && (
              <div className="reel-muted-badge">Muted</div>
            )}
          </>
        )}

        <div className="reel-info-overlay">
          <div className="reel-user-info">
            <div className="reel-user-avatar" onClick={() => navigate(`/profile/${reel.userId}`)}>
              {reel.user?.profilePic ? (
                <img
                  src={reel.user.profilePic}
                  alt={reel.user.userName}
                  className="reel-user-avatar-img"
                />
              ) : (
                <span>{reel.user?.userName?.charAt(0)?.toUpperCase() || reel.userId?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
            </div>

            <div className="reel-caption-container" onClick={(e) => onCaptionClick(index, e)}>
              <p className="reel-username">@{reel.user?.userName || reel.userId?.slice(0, 8) || 'unknown'}</p>
              {reel.user?.tagline && (
                <p className="reel-user-tagline">"{reel.user.tagline}"</p>
              )}
              <p className={`reel-caption ${isExpanded ? 'expanded' : ''}`}>
                {isExpanded ? reel.caption : truncateCaption(reel.caption)}
              </p>

              {isExpanded && reel.tags && reel.tags.length > 0 && (
                <div className="reel-tags">
                  {reel.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="reel-tag">#{tag}</span>
                  ))}
                </div>
              )}

              {reel.caption.length > 20 && (
                <div className="reel-read-more">
                  {isExpanded ? 'Show less' : 'Read more'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="reel-actions-right">
          <div className="reel-action-buttons">
            <div className="reel-action-item">
              <div className={`reel-action-button ${reel.isLiked ? 'liked' : ''}`} onClick={() => onLike(index)}>
                <svg fill={reel.isLiked ? "#ff0000" : "currentColor"} viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
                </svg>
              </div>
              <span className="reel-action-count">{reel.likes}</span>
            </div>

            <div className="reel-action-item">
              <div className="reel-action-button" onClick={() => onComment(index)}>
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM8 15h2.5l1.5 1.5 1.5-1.5H16v-2.5l1.5-1.5-1.5-1.5V8h-2.5L13 6.5 11.5 8H9v2.5L7.5 12 9 13.5V15z" />
                </svg>
              </div>
              <span className="reel-action-count">{reel.comments}</span>
            </div>

            <div className="reel-action-item">
              <div className="reel-action-button" onClick={() => onShare(index)}>
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                </svg>
              </div>
              <span className="reel-action-count">Share</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelItem;