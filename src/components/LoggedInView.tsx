import { Link } from "react-router-dom";
import type { CrinzResponse } from "../hooks/useCrinzLogic";
import ShareComponent from "../feed/ShareComponent";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "react-oidc-context";
import CommentModal from "../feed/commentModal";
import { contentManager } from "../utils/Posts_Reels_Stats_Syncer";
import SyncStatusIndicator from "../feed/utils/SyncStatusIndicator";

interface Props {
  crinzData: CrinzResponse | null;
  showTile: boolean;
  isFetching: boolean;
  getCrinzMessage: () => Promise<CrinzResponse | null>;
  autoMode: boolean;
  toggleAutoMode: () => void;
}

// Simple profile cache
const profileCache = new Map<string, { profilePic?: string; displayName: string; tagline?: string }>();

// Professional SVG Icons
const LikeIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" 
          fill={filled ? "currentColor" : "none"}/>
  </svg>
);

const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

function LoggedInView({
  crinzData,
  showTile,
  isFetching,
  getCrinzMessage,
  autoMode,
  toggleAutoMode,
}: Props) {
  const auth = useAuth();
  const userId = auth.user?.profile?.sub || "";

  const [shareModal, setShareModal] = useState<{isOpen: boolean} | null>(null);
  const [commentModal, setCommentModal] = useState<{ isOpen: boolean } | null>(null);

  // Stable key to detect when crinz changes
  const crinzKey = useMemo(() => crinzData?.crinzId ?? "none", [crinzData?.crinzId]);

  // Local optimistic state
  const [liked, setLiked] = useState<boolean>(crinzData?.isLiked ?? false);
  const [likeCount, setLikeCount] = useState<number>(crinzData?.likeCount ?? 0);
  const [localCommentCount, setLocalCommentCount] = useState<number>(crinzData?.commentCount ?? 0);

  // Cache user profile data when we get new crinz data
  useEffect(() => {
    if (crinzData) {
      const cacheKey = crinzData.userId;
      profileCache.set(cacheKey, {
        profilePic: crinzData.user.profilePic,
        displayName: crinzData.userName,
        tagline: crinzData.user.tagline
      });
    }
  }, [crinzData]);

  // Get cached user data if available
  const cachedUserData = useMemo(() => {
    if (!crinzData) return null;
    return profileCache.get(crinzData.userId);
  }, [crinzData]);

  // Use cached data if available, otherwise use fresh data
  const userProfilePic = cachedUserData?.profilePic || crinzData?.user.profilePic;
  const userDisplayName = cachedUserData?.displayName || crinzData?.userName;
  const userTagline = cachedUserData?.tagline || crinzData?.user.tagline;

  // Sync when a new crinz is shown
  useEffect(() => {
    setLiked(crinzData?.isLiked ?? false);
    setLikeCount(crinzData?.likeCount ?? 0);
    setLocalCommentCount(crinzData?.commentCount ?? 0);
  }, [crinzKey]);

  const formatDate = (ts: string) => {
    const match = ts.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})/);
    const dateObj = new Date(match ? match[1] : ts);
    return isNaN(dateObj.getTime()) ? "Invalid date" : dateObj.toLocaleString();
  };

  const handleShare = () => {
    setShareModal({ isOpen: true });
  };

  const handleCloseShareModal = () => {
    setShareModal(null);
  };

  const handleLikeClick = useCallback(() => {
    if (!crinzData || !userId) return;
    const prevLiked = liked;
    const newLiked = !prevLiked;
    const newLikeCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    // Optimistic UI
    setLiked(newLiked);
    setLikeCount(newLikeCount);

    // Queue like/unlike using previous liked state
    contentManager.likeContent(crinzData.crinzId, 'crinz_message', userId, prevLiked);

    // Persist to cache
    try {
      const raw = localStorage.getItem("crinz_cache");
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached?.crinzId === crinzData.crinzId) {
          localStorage.setItem("crinz_cache", JSON.stringify({
            ...cached,
            isLiked: newLiked,
            likeCount: newLikeCount
          }));
        }
      }
    } catch {}
  }, [crinzData, userId, liked, likeCount]);

  // Ensure hooks run every render before any early return
  if (!showTile || !crinzData) return null;

  return (
    <div style={{ width: "100%", maxWidth: "600px", margin: "1rem auto", padding: "0 1rem" }}>
      <div className="crinz-post" style={{ 
        position: "relative", 
        background: "rgba(0, 0, 0, 0.3)", 
        borderRadius: "12px", 
        padding: "1.5rem",
        border: "1px solid rgba(0, 255, 204, 0.2)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
      }}>
        {/* Post header with enhanced user info */}
        <div className="post-header" style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.75rem",
          marginBottom: "1rem"
        }}>
          {/* Profile Picture - Using cached data */}
          <div className="profile-pic" style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: userProfilePic 
              ? `url(${userProfilePic}) center/cover`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "1.2rem",
            fontWeight: "bold"
          }}>
            {!userProfilePic && userDisplayName?.charAt(0)}
          </div>

          {/* User Info - Using cached data */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <Link
                to={`/profile/${crinzData.userId}`}
                style={{
                  cursor: "pointer",
                  color: "#00aaff",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "1.1rem"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                @{userDisplayName}
              </Link>
              {userTagline && (
                <span style={{ 
                  color: "#888", 
                  fontSize: "0.9rem",
                  fontStyle: "italic"
                }}>
                  {userTagline}
                </span>
              )}
            </div>
            <div style={{ 
              color: "#666", 
              fontSize: "0.8rem",
              marginTop: "0.25rem"
            }}>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="post-message-container">
          <p className="post-message"> 
            {crinzData.message}
          </p>
          <div className="post-meta">
            <span>{formatDate(crinzData.timestamp)}</span>
          </div>
        </div>

        {/* Enhanced Post actions - 3 buttons equally spaced */}
        <div className="post-actions" style={{ 
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "0.75rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          {/* Like Button */}
          <button
            style={{
              background: "none",
              border: "none",
              color: liked ? "#00ffcc" : "#666",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.9rem",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              transition: "all 0.2s",
              flex: 1,
              justifyContent: "center",
              margin: "0 2px"
            }}
            onClick={handleLikeClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 255, 204, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            <LikeIcon filled={liked} />
            <span>{likeCount || 0}</span>
          </button>
          
          {/* Comment Button */}
          {localCommentCount !== undefined && (
            <button
              style={{
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.9rem",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                transition: "all 0.2s",
                flex: 1,
                justifyContent: "center",
                margin: "0 2px"
              }}
              onClick={() => setCommentModal({ isOpen: true })}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 170, 255, 0.1)";
                e.currentTarget.style.color = "#00aaff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "#666";
              }}
            >
              <CommentIcon />
              <span>{localCommentCount}</span>
            </button>
          )}
          
          {/* Share Button */}
          <button
            onClick={handleShare}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.9rem",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              transition: "all 0.2s",
              flex: 1,
              justifyContent: "center",
              margin: "0 2px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 193, 7, 0.1)";
              e.currentTarget.style.color = "#ffc107";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "#666";
            }}
          >
            <ShareIcon />
            <span>Share</span>
          </button>
        </div>

        {/* Refresh Button (absolute top-right) */}
        <button
          onClick={() => getCrinzMessage()}
          disabled={isFetching}
          className={isFetching ? "refresh-button spinning" : "refresh-button"}
          style={{
            position: "absolute",
            top: "-10px",
            right: "-10px",
            background: "rgba(0, 0, 0, 0.8)",
            border: "2px solid #00ffcc",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.1rem",
            color: "#00ffcc",
            transition: "all 0.2s",
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            if (!isFetching) {
              e.currentTarget.style.background = "rgba(0, 255, 204, 0.1)";
              e.currentTarget.style.transform = "scale(1.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isFetching) {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.8)";
              e.currentTarget.style.transform = "scale(1)";
            }
          }}
        >
          <RefreshIcon />
        </button>
      </div>

      {/* Dev-only: show sync indicator */}
      {process.env.NODE_ENV === 'development' && <SyncStatusIndicator />}

      {/* Auto Mode Toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "1.5rem",
          marginBottom: "1rem",
        }}
      >
        <label
          style={{
            fontSize: "0.9rem",
            color: "#00ffcc",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(0,0,0,0.3)",
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            border: "1px solid rgba(0, 255, 204, 0.3)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 255, 204, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.3)";
          }}
        >
          <input 
            type="checkbox" 
            checked={autoMode} 
            onChange={toggleAutoMode}
            style={{
              cursor: "pointer",
              accentColor: "#00ffcc"
            }}
          />
          Auto Mode (6 / 12 / 18 hrs)
        </label>
      </div>

      {/* Share Modal */}
      {shareModal && (
        <ShareComponent
          postId={crinzData.crinzId}
          userName={userDisplayName || crinzData.userName}
          message={crinzData.message}
          timestamp={crinzData.timestamp}
          likeCount={likeCount}
          commentCount={localCommentCount}
          isOpen={shareModal.isOpen}
          onClose={handleCloseShareModal}
          contentType="crinz_message"
        />
      )}

      {/* Comment Modal */}
      {commentModal && (
        <CommentModal
          postId={crinzData.crinzId}
          isOpen={commentModal.isOpen}
          onClose={() => setCommentModal(null)}
          userName={userDisplayName || crinzData.userName}
          postMessage={crinzData.message}
          commentCount={localCommentCount}
          accessToken={auth.user?.access_token}
          contentType="crinz_message"
          currentUserId={userId}
          onNewComment={() => {
            const next = localCommentCount + 1;
            setLocalCommentCount(next);
            try {
              const raw = localStorage.getItem("crinz_cache");
              if (raw) {
                const cached = JSON.parse(raw);
                if (cached?.crinzId === crinzData.crinzId) {
                  localStorage.setItem("crinz_cache", JSON.stringify({
                    ...cached,
                    commentCount: next
                  }));
                }
              }
            } catch {}
          }}
          onDeleteComment={() => {
            const next = Math.max(0, localCommentCount - 1);
            setLocalCommentCount(next);
            try {
              const raw = localStorage.getItem("crinz_cache");
              if (raw) {
                const cached = JSON.parse(raw);
                if (cached?.crinzId === crinzData.crinzId) {
                  localStorage.setItem("crinz_cache", JSON.stringify({
                    ...cached,
                    commentCount: next
                  }));
                }
              }
            } catch {}
          }}
        />
      )}

      {/* Inline styles for rotation */}
      <style>
        {`
          .refresh-button:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          .spinning {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Ensure buttons have equal width and proper spacing */
          .post-actions button {
            min-width: 0;
            white-space: nowrap;
          }

          /* Smooth icon transitions */
          .post-actions svg {
            transition: all 0.2s ease;
          }
        `}
      </style>
    </div>
  );
}

export default LoggedInView;