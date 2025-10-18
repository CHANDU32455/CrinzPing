import React, { useState, useCallback, useEffect, useRef } from "react";
import "./ShareModal.css";

interface ShareModalProps {
  postId: string;
  userName: string;
  message: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
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
    }, 300);
  }, [isClosing, onClose]);

  const handleCopy = useCallback(async () => {
    try {
      const shareUrl = `${window.location.origin}/reel/${postId}`;
      await navigator.clipboard.writeText(shareUrl);

      const notification = document.createElement("div");
      notification.textContent = "Reel link copied to clipboard!";
      notification.style.position = "fixed";
      notification.style.top = "20px";
      notification.style.right = "20px";
      notification.style.backgroundColor = "#4CAF50";
      notification.style.color = "white";
      notification.style.padding = "10px 15px";
      notification.style.borderRadius = "4px";
      notification.style.zIndex = "10000";
      document.body.appendChild(notification);

      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 2000);

      handleCloseModal();
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = `${window.location.origin}/reel/${postId}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      alert("Reel link copied to clipboard!");
      handleCloseModal();
    }
  }, [postId, handleCloseModal]);

  const handleAppShare = useCallback(
    async (app: string) => {
      const shareUrl = `${window.location.origin}/reel/${postId}`;

      if (app === "Copy Link") {
        handleCopy();
        return;
      }

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: `Reel by ${userName}`,
            text: `Check out this reel: ${message}`,
            url: shareUrl
          });
          handleCloseModal();
        } catch (err: any) {
          if (err.name !== "AbortError") {
            handleCopy();
          }
        }
      } else if (app === "Email") {
        window.open(
          `mailto:?subject=Check out this reel by ${userName}&body=${encodeURIComponent(
            message + "\n\n" + shareUrl
          )}`
        );
        handleCloseModal();
      } else {
        handleCopy();
      }
    },
    [postId, userName, message, handleCopy, handleCloseModal]
  );

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && !isClosing) {
        handleCloseModal();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isClosing, handleCloseModal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        isOpen &&
        !isClosing
      ) {
        handleCloseModal();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isClosing, handleCloseModal]);

  if (!isOpen) return null;

  return (
    <div
      className={`reels-share-modal-overlay ${isClosing ? "closing" : ""}`}
      onClick={handleCloseModal}
    >
      <div
        ref={modalRef}
        className={`reels-share-modal ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="reels-share-modal-header">
          <div className="reels-share-modal-drag-handle"></div>
          <h3>Share Reel</h3>
          <button
            className="reels-share-close-button"
            onClick={handleCloseModal}
            aria-label="Close"
            disabled={isClosing}
          >
            &times;
          </button>
        </div>

        {/* Post Preview */}
        <div className="reels-share-post-preview">
          <div className="reels-share-post-author">@{userName}</div>
          <div className="reels-share-post-content">{message}</div>
          <div className="reels-share-timestamp">{formatTime(timestamp)}</div>
          <div className="reels-share-stats">
            <span>❤️ {likeCount}</span>
            <span>💬 {commentCount}</span>
          </div>
        </div>

        <hr className="reels-share-divider" />

        {/* Share Options */}
        <div className="reels-share-apps-grid">
          {availableApps.map((app) => (
            <button
              key={app}
              onClick={() => handleAppShare(app)}
              className="reels-share-app-button"
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

export default ShareModal;
