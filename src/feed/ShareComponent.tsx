import React, { useState, useEffect, useCallback, useRef } from "react";
import "./css/ShareModal.css";

interface ShareComponentProps {
  postId: string;
  userName: string;
  message: string;
  timestamp: string | number; // Accept both string and number
  likeCount: number;
  commentCount: number;
  isOpen: boolean;
  onClose: () => void;
  contentType?: 'post' | 'reel' | 'crinz_message';
  mediaUrl?: string;
}

const ShareComponent: React.FC<ShareComponentProps> = ({
  postId,
  userName,
  message,
  timestamp,
  likeCount,
  commentCount,
  isOpen,
  onClose,
  contentType = 'post',
  mediaUrl
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [availableApps, setAvailableApps] = useState<string[]>([]);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Generate direct share URL based on content type
  const generateShareUrl = useCallback(() => {
    const baseUrl = window.location.origin;

    switch (contentType) {
      case 'reel':
        return `${baseUrl}/shared/reel/${postId}`;
      case 'crinz_message':
        return `${baseUrl}/shared/crinz/${postId}`;
      case 'post':
      default:
        return `${baseUrl}/shared/post/${postId}`;
    }
  }, [postId, contentType]);

  const formatTime = useCallback((timestamp: string | number) => {
    // Convert to Date object - handle both string and number timestamps
    const postTime = typeof timestamp === 'number'
      ? new Date(timestamp)
      : new Date(timestamp);

    const now = new Date();
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
        apps.push("External Apps", "Copy Link", "WhatsApp", "Twitter");
      } else {
        apps.push("Copy Link", "WhatsApp", "Twitter", "Email", "Telegram");
      }
      setAvailableApps(apps);
    };
    detectShareApps();
  }, []);

  // Handle video loading for reels
  useEffect(() => {
    if (contentType === 'reel' && mediaUrl && videoRef.current) {
      const video = videoRef.current;
      const handleLoad = () => setIsVideoLoaded(true);

      video.addEventListener('loadeddata', handleLoad);
      video.src = mediaUrl;
      video.load();

      return () => {
        video.removeEventListener('loadeddata', handleLoad);
      };
    }
  }, [contentType, mediaUrl]);

  const handleCloseModal = useCallback(() => {
    if (isClosing) return;

    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsVideoLoaded(false);
      setIsClosing(false);
    }, 300);
  }, [isClosing, onClose]);

  const handleCopy = useCallback(async () => {
    try {
      const shareUrl = generateShareUrl();
      await navigator.clipboard.writeText(shareUrl);

      // Show success notification
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
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generateShareUrl();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      alert('Link copied to clipboard!');
      handleCloseModal();
    }
  }, [generateShareUrl, handleCloseModal]);

  const handleAppShare = useCallback(async (app: string) => {
    const shareUrl = generateShareUrl();
    const shareText = `Check out this ${contentType} by ${userName}`;
    const fullMessage = `${message}\n\nLikes: ${likeCount} | Comments: ${commentCount}\n\n${shareUrl}`;

    if (app === "Copy Link") {
      handleCopy();
      return;
    }

    // Platform-specific sharing
    switch (app) {
      case "WhatsApp":
        window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
        handleCloseModal();
        break;

      case "Twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullMessage)}`, '_blank');
        handleCloseModal();
        break;

      case "Telegram":
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`, '_blank');
        handleCloseModal();
        break;

      case "Email":
        window.open(`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(fullMessage)}`, '_blank');
        handleCloseModal();
        break;

      case "External Apps":
        if (typeof navigator.share === "function") {
          try {
            await navigator.share({
              title: shareText,
              text: message,
              url: shareUrl,
            });
            handleCloseModal();
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.error("Share failed:", err);
              handleCopy(); // Fallback to copy
            }
          }
        } else {
          handleCopy();
        }
        break;

      default:
        handleCopy();
    }
  }, [generateShareUrl, contentType, userName, message, likeCount, commentCount, handleCopy, handleCloseModal]);

  // Close modal on escape key and outside click
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
          <h3>Share {contentType === 'reel' ? 'Reel' : contentType === 'crinz_message' ? 'Crinz' : 'Post'}</h3>
          <button
            className="share-close-button"
            onClick={handleCloseModal}
            aria-label="Close"
            disabled={isClosing}
          >
            &times;
          </button>
        </div>

        <div className="share-content-preview">
          {/* Show video for reels */}
          {contentType === 'reel' && mediaUrl && (
            <div className="share-reel-preview">
              <video
                ref={videoRef}
                className="share-reel-video"
                muted
                playsInline
                preload="metadata"
                style={{ display: isVideoLoaded ? 'block' : 'none' }}
              />
              {!isVideoLoaded && (
                <div className="share-reel-loading">Loading reel preview...</div>
              )}
            </div>
          )}

          <div className="share-post-info">
            <div className="share-post-author">@{userName}</div>
            <div className="share-post-content">
              {message || `Check out this ${contentType}`}
            </div>
            <div className="share-timestamp">
              {formatTime(timestamp)}
            </div>
            <div className="share-stats">
              <span>❤️ {likeCount}</span>
              <span>💬 {commentCount}</span>
            </div>
          </div>
        </div>

        <hr className="share-divider" />

        <div className="share-apps-grid">
          {availableApps.map(app => (
            <button
              key={app}
              data-app={app}
              onClick={() => handleAppShare(app)}
              className="share-app-button"
              disabled={isClosing}
            >
              {app}
            </button>
          ))}
        </div>

        <div className="share-url-preview">
          <small>Share URL: {generateShareUrl()}</small>
        </div>
      </div>
    </div>
  );
};

export default ShareComponent;