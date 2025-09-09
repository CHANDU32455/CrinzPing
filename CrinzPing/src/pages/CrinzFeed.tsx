import React, { useState, useEffect, useRef } from "react";
import DynamicSeo from "../components/Seo";
import "../css/CrinzFeed.css";
import CommentModal from "../components/CommentModal";
import { useCrinzMessages } from "../hooks/useCrinzMessages";
import { useNavigate, useLocation } from "react-router-dom";
import { useCrinzActions } from "../utils/useCrinzActions";
import { usePendingActions } from "../utils/usePendingActions";
import { getAuthItem } from "../utils/useAuthStore";
import { usePendingSync, usePendingSyncOnUnload } from "../hooks/usePendingSync";
import { encodePostData } from "../utils/encodeDecode";
import { FeedHighlightHandler } from "../components/FeedHighlightHandler";


const CrinzFeed: React.FC = () => {
  const { crinzPosts, fetchMessages, loading, error, hasMore, crinzNotFoundInResponse } = useCrinzMessages();

  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const highlightId = params.get("highlight");
  const currentUserId = getAuthItem("sub") ?? "";
  const userAccessToken = getAuthItem("access_token") ?? "";
  const [sharedLink, setSharedLink] = useState<string | null>(null);

  useEffect(() => {
    if (crinzNotFoundInResponse) {
      console.warn(`🚨 Crinz with ID ${crinzNotFoundInResponse} seems missing or deleted.`);
    }
  }, [crinzNotFoundInResponse]);

  const {
    likes,
    likeCounts,
    commentCounts,
    fetchedCommentPosts,
    fetchCommentsForPost,
    handleLike,
    handleAddComment,
    handleRemoveComment,
    handleBatchSync,
    getCombinedComments,
  } = useCrinzActions(crinzPosts, currentUserId, fetchMessages);

  const { pendingActions, hydrated } = usePendingActions();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [fetchingComments, setFetchingComments] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const didMountSync = useRef(false);
  usePendingSync(pendingActions, userAccessToken);
  usePendingSyncOnUnload();

  useEffect(() => {
    if (!activeModal || fetchedCommentPosts.has(activeModal) || !userAccessToken) return;
    setFetchingComments(true);
    fetchCommentsForPost(activeModal, userAccessToken).finally(() =>
      setFetchingComments(false)
    );
  }, [activeModal, fetchedCommentPosts, fetchCommentsForPost, userAccessToken]);

  useEffect(() => {
    if (hydrated && !didMountSync.current && pendingActions.length > 0) {
      didMountSync.current = true;
      handleBatchSync();
    }
  }, [hydrated, pendingActions, handleBatchSync]);

  // 🔹 If highlightId is present but not in current posts, fetch specifically
  useEffect(() => {
    if (highlightId && !crinzPosts.find(p => p.crinzId === highlightId)) {
      fetchMessages(false, highlightId);
      if (error) console.error("❌ Crinz feed error:", error);
    }
  }, [highlightId, crinzPosts, fetchMessages, error]);

  // 🔹 Always fetch fresh data on mount
  {/**  useEffect(() => {
    fetchMessages(true);
  }, []);
 */}

  const normalizeTimestamp = (ts: string) => {
    const match = ts.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})/);
    return match ? match[1] : ts;
  };

  const formatDate = (timestamp: string) => {
    if (!timestamp) return "Invalid date";
    const normalized = normalizeTimestamp(timestamp);
    const dateObj = new Date(normalized);
    return isNaN(dateObj.getTime()) ? "Invalid date" : dateObj.toLocaleString();
  };

  return (
    <div className="crinz-feed-container">
      <DynamicSeo
        title="Your Crinz Feed"
        description="Browse your personalized Crinzping feed full of funny roast-style messages, entertaining content, and laugh-worthy posts every day."
        slug="/feed"
      />

      <FeedHighlightHandler
        onHighlight={setHighlightedId}
        ready={crinzPosts.length > 0}
      />

      <button
        onClick={() => fetchMessages(true)}
        style={{
          position: "fixed",
          top: "10%",
          left: "10%",
          zIndex: 5,
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "50%",
          padding: "8px",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
        }}
        disabled={loading}
      >
        <span
          style={{
            display: "inline-block",
            animation: loading ? "spin 1s linear infinite" : "none"
          }}
        >
          🔄
        </span>
      </button>

      <style>
        {`
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`}
      </style>

      {crinzPosts.map((post) => (
        <div
          key={post.crinzId}
          id={`post-${post.crinzId}`}
          className={`crinz-post ${post.crinzId === highlightedId ? "highlighted" : ""}`}
        >
          <div className="post-header">
            <span
              className="user-name"
              style={{
                cursor: "pointer",
                color: "#00aaff",
                fontWeight: 600,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              onClick={() => navigate(`/profile/${post.userId}`)}
            >
              @{post.userName} <br />
            </span>
          </div>
          <div className="post-message-container">
            <p className="post-message">{post.message}</p>
            <div className="post-meta">
              <span>{formatDate(post.timestamp)}</span>
            </div>
          </div>
          <div className="post-actions">
            <button
              onClick={() =>
                userAccessToken ? handleLike(post.crinzId) : alert("Log in to like")
              }
              className={likes[post.crinzId] ? "liked" : ""}
            >
              {likes[post.crinzId]
                ? `❤️ (${likeCounts[post.crinzId] || 0})`
                : `🤍 (${likeCounts[post.crinzId] || 0})`}
            </button>
            <button
              onClick={() =>
                userAccessToken
                  ? setActiveModal(post.crinzId)
                  : alert("Log in to comment")
              }
            >
              💬 ({commentCounts[post.crinzId] || 0})
            </button>

            <button
              onClick={() => {
                const encoded = encodePostData(post);
                const shareUrl = `${window.location.origin}/post/${encoded}`;
                navigator.clipboard.writeText(shareUrl);

                setSharedLink(shareUrl);
                setTimeout(() => setSharedLink(null), 2500);
              }}
            >
              {sharedLink === `${window.location.origin}/post/${encodePostData(post)}`
                ? "✅ linkCopied"
                : "🔗 Share"}
            </button>
          </div>
        </div>
      ))}

      {!loading && crinzPosts.length > 0 && (
        <>
          {hasMore ? (
            <div
              className="load-more-text"
              onClick={() => fetchMessages()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fetchMessages();
              }}
            >
              Load More Crinz 🔥
            </div>
          ) : (
            <p className="all-fetched-text">🎉 All Crinzes fetched!</p>
          )}
        </>
      )}

      {loading && <p className="loading-text">Loading...</p>}

      {activeModal && (
        <CommentModal
          crinzId={activeModal}
          comments={activeModal ? getCombinedComments(activeModal) : []}
          currentUserId={currentUserId}
          onClose={() => setActiveModal(null)}
          onAddComment={handleAddComment}
          onRemoveComment={handleRemoveComment}
          fetchingComments={fetchingComments}
        />
      )}
    </div>
  );
};

export default CrinzFeed;


