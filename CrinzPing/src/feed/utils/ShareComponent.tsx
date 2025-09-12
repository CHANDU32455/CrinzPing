import React, { useState, useEffect, useCallback } from "react";
import { encodePostData } from "../../utils/encodeDecode";
import "../css/CommentModal.css";

interface ShareComponentProps {
  postId: string;
  userName: string;
  message: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
}

const ShareComponent: React.FC<ShareComponentProps> = ({ 
  postId, 
  userName, 
  message, 
  timestamp, 
  likeCount, 
  commentCount 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableApps, setAvailableApps] = useState<string[]>([]);

  const formatTime = useCallback((timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }, []);

  useEffect(() => {
    const detectShareApps = () => {
      const apps = [];
      // Check if navigator.share is a function (Web Share API support)
      if (typeof navigator.share === "function") {
        // Native Web Share API available (mobile)
        apps.push("WhatsApp", "Telegram", "Email", "Copy Link");
      } else {
        // Fallback for desktop or browsers without Web Share API
        apps.push("Copy Link", "Email");
      }
      setAvailableApps(apps);
    };
    
    detectShareApps();
  }, []);

  const handleShareClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      const encodedData = encodePostData({ id: postId, userName, message, timestamp });
      const shareUrl = `${window.location.origin}/post/${encodedData}`;
      
      // Use the modern Clipboard API with proper error handling
      await navigator.clipboard.writeText(shareUrl);
      
      // Show a more user-friendly notification
      const notification = document.createElement('div');
      notification.textContent = 'Link copied to clipboard!';
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.backgroundColor = '#4CAF50';
      notification.style.color = 'white';
      notification.style.padding = '10px 15px';
      notification.style.borderRadius = '4px';
      notification.style.zIndex = '10000';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 2000);
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for browsers that don't support Clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = `${window.location.origin}/post/${encodePostData({ id: postId, userName, message, timestamp })}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      alert('Link copied to clipboard!');
      setIsModalOpen(false);
    }
  }, [postId, userName, message, timestamp]);

  const handleAppShare = useCallback(async (app: string) => {
    const encodedData = encodePostData({ id: postId, userName, message, timestamp });
    const shareUrl = `${window.location.origin}/post/${encodedData}`;
    
    if (app === "Copy Link") {
      handleCopy();
      return;
    }

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `Post by ${userName}`,
          text: `${message} (Likes: ${likeCount}, Comments: ${commentCount})`,
          url: shareUrl,
        });
        setIsModalOpen(false);
      } catch (err:any) {
        if (err.name !== 'AbortError') {
          console.error("Share failed:", err);
          // Fallback to copy if share fails
          handleCopy();
        }
      }
    } else if (app === "Email") {
      // Open email client
      window.open(`mailto:?subject=Check out this post by ${userName}&body=${encodeURIComponent(message + '\n\n' + shareUrl)}`);
      setIsModalOpen(false);
    } else {
      // For other apps that aren't supported by Web Share API
      handleCopy();
    }
  }, [postId, userName, message, timestamp, likeCount, commentCount, handleCopy]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, handleCloseModal]);

  return (
    <>
      <button
        className="share-btn"
        onClick={handleShareClick}
      >
        🔗 Share
      </button>

      {isModalOpen && (
        <div className="comment-modal-overlay" onClick={handleCloseModal}>
          <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="comment-modal-header">
              <h3>Share Post</h3>
              <button className="close-button" onClick={handleCloseModal} aria-label="Close">
                &times;
              </button>
            </div>
            
            <div className="post-preview">
              <div className="post-author">@{userName}</div>
              <div className="post-content-preview">{message}</div>
              <div className="timestamp" style={{ color: '#888', fontSize: '12px', marginTop: '8px' }}>
                {formatTime(timestamp)}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', color: '#888', fontSize: '12px' }}>
                <span>❤️ {likeCount}</span>
                <span>💬 {commentCount}</span>
              </div>
            </div>
            
            <hr style={{ border: "1px solid #3f4a4b", margin: "16px 0" }} />
            
            <div className="share-apps" style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: "10px", 
              padding: "8px 0",
              justifyContent: "center"
            }}>
              {availableApps.map(app => (
                <button
                  key={app}
                  onClick={() => handleAppShare(app)}
                  style={{
                    padding: "12px 20px",
                    background: "#2a2f31",
                    border: "none",
                    borderRadius: "24px",
                    color: "#e6e6e6",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    minWidth: "100px",
                    transition: "background-color 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#3a3f41"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2a2f31"}
                >
                  {app}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareComponent;