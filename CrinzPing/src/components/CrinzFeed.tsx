import React, { useState, useEffect, useRef } from "react";
import "../css/CrinzFeed.css";
import CommentModal from "./CommentModal";
import { useCrinzMessages } from "../hooks/useCrinzMessages";
import { useNavigate } from "react-router-dom";
import { useCrinzActions } from "../utils/useCrinzActions";
import { usePendingActions } from "../utils/usePendingActions";
import { jwtDecode } from "jwt-decode";

const CrinzFeed: React.FC = () => {
  const { crinzPosts, fetchMessages, loading, error, hasMore } = useCrinzMessages();
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("cognito_username") ?? "";
  const userAccessToken = localStorage.getItem("access_token");

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
  const didMountSync = useRef(false);

  // Fetch comments when modal opens
  useEffect(() => {
    if (!activeModal || fetchedCommentPosts.has(activeModal) || !userAccessToken) return;
    setFetchingComments(true);
    fetchCommentsForPost(activeModal, userAccessToken).finally(() =>
      setFetchingComments(false)
    );
  }, [activeModal, fetchedCommentPosts, fetchCommentsForPost, userAccessToken]);

  // ✅ Sync once on mount if pending actions exist
  useEffect(() => {
    if (hydrated && !didMountSync.current && pendingActions.length > 0) {
      didMountSync.current = true;
      console.log("🚀 Batch sync executed on mount");
      handleBatchSync();
    }
  }, [hydrated, pendingActions, handleBatchSync]);

  // ✅ Sync once on unload (tab close, reload, SPA route change)
  useEffect(() => {
    const sendPendingActions = () => {
      if (pendingActions.length === 0) return;

      const token = localStorage.getItem("access_token");
      if (!token) return;

      const decoded = jwtDecode<{ "cognito:username"?: string; sub: string }>(token);
      const userId = decoded["cognito:username"] ?? decoded.sub;

      const payload = JSON.stringify({ userId, actions: pendingActions });
      const blob = new Blob([payload], { type: "application/json" });

      navigator.sendBeacon(import.meta.env.VITE_BATCH_PROCESS_API_URL, blob);
      console.log("📡 Beacon sent with pending actions on unload");
    };

    // Hard reloads & tab close
    window.addEventListener("beforeunload", sendPendingActions);

    // SPA navigation changes
    const pushState = history.pushState;
    history.pushState = function (...args) {
      sendPendingActions();
      // @ts-ignore
      return pushState.apply(this, args);
    };

    const replaceState = history.replaceState;
    history.replaceState = function (...args) {
      sendPendingActions();
      // @ts-ignore
      return replaceState.apply(this, args);
    };

    return () => {
      window.removeEventListener("beforeunload", sendPendingActions);
      history.pushState = pushState;
      history.replaceState = replaceState;
    };
  }, [pendingActions]);

  const combinedCommentsForActiveModal = activeModal
    ? getCombinedComments(activeModal)
    : [];

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

  const handleAddCrinz = () => navigate("/contributeCrinz");

  return (
    <div className="crinz-feed-container">
      {error && <div className="error-message">{error}</div>}

      {crinzPosts.map(post => (
        <div key={post.crinzId} className="crinz-post">
          <div className="post-header">
            <span className="user-name">@{post.userName}</span>
            {/**
                           * <span 
                className="user-name" 
                onClick={() => navigate(`/user/${post.userId}`)}
              >
                @{post.userName} <small>({post.userId.slice(0,3)}...{post.userId.slice(-3)})</small>
              </span>
             */}
            <span className="post-category">#{post.category}</span>
          </div>
          <p className="post-message">{post.message}</p>
          <div className="post-meta">
            <span className="timestamp">{formatDate(post.timestamp.toString())}</span>
          </div>
          <div className="post-actions">
            <button
              onClick={() => handleLike(post.crinzId)}
              className={likes[post.crinzId] ? "liked" : ""}
            >
              {likes[post.crinzId]
                ? `❤️ Unlike (${likeCounts[post.crinzId] || 0})`
                : `🤍 Like (${likeCounts[post.crinzId] || 0})`}
            </button>
            <button onClick={() => setActiveModal(post.crinzId)}>
              💬 Comments ({commentCounts[post.crinzId] || 0})
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
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") fetchMessages();
              }}
            >
              Load More Crinz 🔥
            </div>
          ) : (
            <p className="all-fetched-text">🎉 All Crinzes fetched!</p>
          )}

          <div className="crinz-buttons-container">
            <button className="add-crinz-button" onClick={handleAddCrinz}>
              ➕ Add Your Crinz
            </button>
            {/**
             * <button className="clear-actions-button" onClick={clearActions}>
              Clear Pending Actions
            </button>
             */}
          </div>
        </>
      )}

      {loading && <p className="loading-text">Loading...</p>}

      {activeModal && (
        <CommentModal
          crinzId={activeModal}
          comments={combinedCommentsForActiveModal}
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
