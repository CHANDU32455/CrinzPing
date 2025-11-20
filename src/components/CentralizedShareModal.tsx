import { useState, useCallback, useEffect } from 'react';

interface CentralizedShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentType: 'post' | 'reel' | 'crinz_message';
  content: {
    userName: string;
    message: string;
  };
}

export default function CentralizedShareModal({
  isOpen,
  onClose,
  contentId,
  contentType,
  content
}: CentralizedShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragTranslateY, setDragTranslateY] = useState(0);
  const DRAG_CLOSE_THRESHOLD = 120;

  const shareUrl = `${window.location.origin}/share/${contentType}/${contentId}`;

  // Handle modal close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setDragTranslateY(0);
      onClose();
    }, 300);
  };

  // Handle escape key and backdrop click
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // kick off enter animation on mount
      setIsEntering(true);
      const t = requestAnimationFrame(() => setIsEntering(false));
      return () => cancelAnimationFrame(t);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleShare = useCallback((platform: string) => {
    const text = `Check out this ${contentType} by ${content.userName}: ${content.message}`;
    const url = shareUrl;
    
    let shareUrlPlatform = '';
    
    switch (platform) {
      case 'twitter':
        shareUrlPlatform = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrlPlatform = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrlPlatform = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrlPlatform = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrlPlatform = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrlPlatform, '_blank', 'width=600,height=400');
  }, [contentType, content.userName, content.message, shareUrl]);

  if (!isOpen && !isClosing) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isClosing ? 'bg-black bg-opacity-0' : 'bg-black bg-opacity-75'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`
          fixed left-0 right-0 bg-gray-900 rounded-t-3xl flex flex-col transition-transform duration-300
          ${isClosing || isEntering ? 'translate-y-full' : 'translate-y-0'}
          h-[70vh] max-h-[70vh]
          sm:inset-auto sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2 
          sm:rounded-2xl sm:max-w-md sm:w-full sm:max-h-[80vh] sm:h-auto
        `}
        onClick={(e) => e.stopPropagation()}
        style={{
          // Apply extra drag translate only on mobile layout
          transform: undefined,
        }}
      >
        {/* Mobile drag handle */}
        <div
          className="sm:hidden pt-3 px-4"
          onTouchStart={(e) => {
            const y = e.touches[0]?.clientY ?? 0;
            setDragStartY(y);
            setDragTranslateY(0);
          }}
          onTouchMove={(e) => {
            if (dragStartY === null) return;
            const currentY = e.touches[0]?.clientY ?? 0;
            const delta = Math.max(0, currentY - dragStartY);
            setDragTranslateY(delta);
            // Manually translate the sheet while dragging (mobile only)
            (e.currentTarget.parentElement as HTMLElement).style.transform = `translateY(${delta}px)`;
          }}
          onTouchEnd={(e) => {
            const parent = e.currentTarget.parentElement as HTMLElement;
            if (dragTranslateY > DRAG_CLOSE_THRESHOLD) {
              // snap closed
              parent.style.transform = ''; // let closing animation handle it
              setDragStartY(null);
              setDragTranslateY(0);
              handleClose();
              return;
            }
            // snap back
            parent.style.transform = 'translateY(0px)';
            setDragStartY(null);
            setDragTranslateY(0);
          }}
        >
          <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-3"></div>
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Share this {contentType}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl p-1"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Copy Link Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Copy link
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                  copied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social Platforms */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Share to
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleShare('twitter')}
                className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-blue-500/20 rounded-xl transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform">
                  𝕏
                </div>
                <span className="text-white text-sm font-medium">Twitter</span>
              </button>
              
              <button
                onClick={() => handleShare('facebook')}
                className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-blue-600/20 rounded-xl transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform">
                  f
                </div>
                <span className="text-white text-sm font-medium">Facebook</span>
              </button>
              
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-green-500/20 rounded-xl transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform">
                  📱
                </div>
                <span className="text-white text-sm font-medium">WhatsApp</span>
              </button>

              <button
                onClick={() => handleShare('telegram')}
                className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-blue-400/20 rounded-xl transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform">
                  ✈️
                </div>
                <span className="text-white text-sm font-medium">Telegram</span>
              </button>

              <button
                onClick={() => handleShare('linkedin')}
                className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-blue-700/20 rounded-xl transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform">
                  in
                </div>
                <span className="text-white text-sm font-medium">LinkedIn</span>
              </button>

              {/* More share options can be added here */}
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-purple-600/20 rounded-xl transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                  📋
                </div>
                <span className="text-white text-sm font-medium">Copy Link</span>
              </button>
            </div>
          </div>

          {/* Share via native share API if available */}
          {navigator.share && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: `${contentType} by ${content.userName}`,
                      text: content.message,
                      url: shareUrl,
                    });
                  } catch (err) {
                    // User cancelled share or error
                    console.log('Share cancelled');
                  }
                }}
                className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all duration-200"
              >
                <span>📤</span>
                Share via Device
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}