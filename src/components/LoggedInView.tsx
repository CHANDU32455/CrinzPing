import { Link } from "react-router-dom";
import type { CrinzResponse } from "../hooks/useCrinzLogic";
import ShareComponent from "../feed/ShareComponent";
import { useState } from "react";

interface Props {
  crinzData: CrinzResponse | null;
  showTile: boolean;
  isFetching: boolean;
  getCrinzMessage: () => Promise<CrinzResponse | null>;
  autoMode: boolean;
  toggleAutoMode: () => void;
}

function LoggedInView({
  crinzData,
  showTile,
  isFetching,
  getCrinzMessage,
  autoMode,
  toggleAutoMode,
}: Props) {
  const [shareModal, setShareModal] = useState<{isOpen: boolean} | null>(null);
  
  if (!showTile || !crinzData) return null;

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
          {/* Profile Picture */}
          <div className="profile-pic" style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: crinzData.user.profilePic 
              ? `url(${crinzData.user.profilePic}) center/cover`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "1.2rem",
            fontWeight: "bold"
          }}>
            {!crinzData.user.profilePic && crinzData.userName.charAt(0)}
          </div>

          {/* User Info */}
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
                @{crinzData.userName}
              </Link>
              {crinzData.user.tagline && (
                <span style={{ 
                  color: "#888", 
                  fontSize: "0.9rem",
                  fontStyle: "italic"
                }}>
                  {crinzData.user.tagline}
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
              color: crinzData.isLiked ? "#00ffcc" : "#666",
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
              e.currentTarget.style.background = "rgba(0, 255, 204, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            👍 <span>{crinzData.likeCount || 0}</span>
          </button>
          
          {/* Comment Button */}
          {crinzData.commentCount !== undefined && (
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 170, 255, 0.1)";
                e.currentTarget.style.color = "#00aaff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "#666";
              }}
            >
              💬 <span>{crinzData.commentCount}</span>
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
            📤 <span>Share</span>
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
          🔄
        </button>
      </div>

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
          userName={crinzData.userName}
          message={crinzData.message}
          timestamp={crinzData.timestamp}
          likeCount={crinzData.likeCount}
          commentCount={crinzData.commentCount}
          isOpen={shareModal.isOpen}
          onClose={handleCloseShareModal}
          contentType="crinz_message"
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
        `}
      </style>
    </div>
  );
}

export default LoggedInView;