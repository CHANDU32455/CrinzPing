import React, { useState, useEffect, useCallback, useRef } from "react";
import { encodePostData } from "../utils/encodeDecode";
import "./css/ShareModal.css";

interface ShareComponentProps {
  postId: string;
  userName: string;
  message: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
  isOpen: boolean;
  onClose: () => void;
}

const ShareComponent: React.FC<ShareComponentProps> = ({
  postId,
  userName,
  message,
  timestamp,
  likeCount,
  commentCount,
  isOpen,
  onClose
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [availableApps, setAvailableApps] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

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
      if (typeof navigator.share === "function") {
        apps.push("External Apps", "Copy Link");
      } else {
        apps.push("Copy Link", "Email");
      }
      setAvailableApps(apps);
    };
    detectShareApps();
  }, []);

  const handleCloseModal = useCallback(() => {
    if (isClosing) return;
    
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Match the animation duration
  }, [isClosing, onClose]);

  const handleCopy = useCallback(async () => {
    try {
      const encodedData = encodePostData({ id: postId, userName, message, timestamp });
      const shareUrl = `${window.location.origin}/post/${encodedData}`;
      await navigator.clipboard.writeText(shareUrl);

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

      handleCloseModal();
    } catch (err) {
      console.error('Failed to copy:', err);
      const textArea = document.createElement('textarea');
      textArea.value = `${window.location.origin}/post/${encodePostData({ id: postId, userName, message, timestamp })}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      alert('Link copied to clipboard!');
      handleCloseModal();
    }
  }, [postId, userName, message, timestamp, handleCloseModal]);

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
        handleCloseModal();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Share failed:", err);
          handleCopy();
        }
      }
    } else if (app === "Email") {
      window.open(`mailto:?subject=Check out this post by ${userName}&body=${encodeURIComponent(message + '\n\n' + shareUrl)}`);
      handleCloseModal();
    } else {
      handleCopy();
    }
  }, [postId, userName, message, timestamp, likeCount, commentCount, handleCopy, handleCloseModal]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isClosing) {
        handleCloseModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isClosing, handleCloseModal]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && isOpen && !isClosing) {
        handleCloseModal();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isClosing, handleCloseModal]);

  if (!isOpen) return null;

  return (
    <div className={`share-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleCloseModal}>
      <div 
        ref={modalRef}
        className={`share-modal ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="share-modal-header">
          <h3>Share Post</h3>
          <button 
            className="share-close-button" 
            onClick={handleCloseModal} 
            aria-label="Close"
            disabled={isClosing}
          >
            &times;
          </button>
        </div>

        <div className="share-post-preview">
          <div className="share-post-author">@{userName}</div>
          <div className="share-post-content">{message}</div>
          <div className="share-timestamp">
            {formatTime(timestamp)}
          </div>
          <div className="share-stats">
            <span>❤️ {likeCount}</span>
            <span>💬 {commentCount}</span>
          </div>
        </div>

        <hr className="share-divider" />

        <div className="share-apps-grid">
          {availableApps.map(app => (
            <button
              key={app}
              onClick={() => handleAppShare(app)}
              className="share-app-button"
              disabled={isClosing}
            >
              {app}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShareComponent;