import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { decodePostData } from "../utils/encodeDecode";
import "../styles/crinz-feed.css";

interface CrinzPost {
  crinzId: string;
  userName: string;
  category: string;
  message: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
}

const SharedCrinzFeedPost: React.FC = () => {
  const { encoded } = useParams<{ encoded: string }>();
  const decoded = encoded ? decodePostData<CrinzPost>(encoded) : null;

  const auth = useAuth();
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated && decoded?.crinzId) {
      // redirect to feed with highlight query param
      navigate(`/feed?highlight=${decoded.crinzId}`);
    }
  }, [auth.isAuthenticated, decoded?.crinzId, navigate]);

  const handleLogin = () => {
    localStorage.setItem("post_redirect", window.location.pathname);
    auth.signinRedirect();
  };

  if (!decoded) return <div className="error-message">Invalid post link</div>;

  return (
    <div className="crinz-feed-container">
      <div className="crinz-post shared-post">
        <div className="post-header">
          <span className="user-name">@{decoded.userName}</span>
        </div>
        <div className="post-message-container">
          <p className="post-message">{decoded.message}</p>
          <div className="post-meta">{new Date(decoded.timestamp).toLocaleString()}</div>
        </div>
        <div className="post-actions">
          <button onClick={() => setShowLoginPrompt(true)}>💬 Login to comment</button>
          <button onClick={() => setShowLoginPrompt(true)}>❤️ Login to like</button>
        </div>
      </div>

      {showLoginPrompt && (
        <div className="login-modal">
          <div className="modal-content">
            <p>🔐 You must log in to perform actions.</p>
            <button onClick={handleLogin}>Login</button>
            <button onClick={() => setShowLoginPrompt(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedCrinzFeedPost;
