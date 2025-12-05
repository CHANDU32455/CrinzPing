import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import { useUserReels } from "../../hooks/useUserPosts_Reels";
import { useState, useCallback, useRef, useEffect } from "react";
import CreateReel from "../feed/CreateReel";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";

interface UserReelsProps {
  userId?: string;
  previewMode?: boolean;
  currentUserId?: string;
}

interface FileItem {
  url: string;
  type: string;
  isCustom?: boolean;
  fileName?: string;
}

interface ThumbnailPost {
  postId: string;
  reelId?: string;
  userId: string;
  files: FileItem[];
  caption?: string;
  tags?: string[];
  visibility?: string;
  thumbnailUrl?: string;
  existingThumbnail?: FileItem;
}

// Match the CreateReel component's EditData interface
interface EditModalData {
  postId?: string;
  reelId?: string;
  caption?: string;
  tags?: string[];
  visibility?: "public" | "private";
  videoUrl?: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileType?: string;
  isEditMode?: boolean;
  existingVideo?: FileItem | null;
  existingThumbnail?: FileItem | null;
  allFiles?: FileItem[];
}

interface DeleteResult {
  success: boolean;
  message: string;
  details?: {
    filesDeleted?: number;
    likesDeleted?: number;
    commentsDeleted?: number;
  };
}

// Align with CreateReel's onSave parameter type
interface SaveData {
  postId?: string;
  reelId?: string;
  caption: string;
  tags: string[];
  visibility: "public" | "private";
  thumbnail?: File | null;
  thumbnailAction: "keep" | "remove" | "replace";
}

const ReelEditModal = ({ post, isOpen, onClose, onSave }: {
  post: EditModalData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveData) => void;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const getEditData = (): EditModalData => {
    const editData: EditModalData = {
      postId: post.postId,
      reelId: post.reelId,
      caption: post.caption || '',
      tags: post.tags || [],
      visibility: post.visibility || "public",
      thumbnailUrl: post.thumbnailUrl,
      isEditMode: true,
      existingThumbnail: post.existingThumbnail
    };

    return editData;
  };

  // Handle save - convert to SaveData format expected by CreateReel
  const handleSave = (updatedData: SaveData) => {
    console.log('💾 Saving updated data:', updatedData);
    onSave(updatedData);
  };

  // Handle modal close - wrapped in useCallback to fix useEffect dependency
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Prevent body scroll and handle outside click
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";

      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          handleClose();
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.body.style.overflow = "";
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100] p-4 pb-20 sm:pb-4">
      <div
        ref={modalRef}
        className="bg-gray-800 rounded-t-xl sm:rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-scale-in flex flex-col relative md:[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold">Edit Reel</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Edit Form */}
        <div className="p-0">
          <CreateReel
            editData={getEditData()}
            onSave={handleSave}
            onCancel={handleClose}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ isOpen, onCancel, onConfirm, isProcessing, deleteResult }: {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  deleteResult: DeleteResult | null;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        if (!isProcessing) onCancel();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isProcessing) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onCancel, isProcessing]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div
        ref={modalRef}
        className="bg-gray-800 rounded-xl max-w-sm w-full p-6 text-center animate-scale-in"
      >
        {/* Success State */}
        {deleteResult?.success && (
          <>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-green-400">Success!</h3>
            <p className="text-gray-300 mb-4">{deleteResult.message}</p>
            {deleteResult.details && (
              <div className="bg-gray-700/50 rounded-lg p-3 mb-4 text-left">
                <p className="text-sm text-gray-300">
                  <strong>Files deleted:</strong> {deleteResult.details.filesDeleted || 0}
                </p>
                <p className="text-sm text-gray-300">
                  <strong>Likes removed:</strong> {deleteResult.details.likesDeleted || 0}
                </p>
                <p className="text-sm text-gray-300">
                  <strong>Comments removed:</strong> {deleteResult.details.commentsDeleted || 0}
                </p>
              </div>
            )}
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-green-600 rounded-lg hover:bg-green-500 transition-colors w-full font-medium"
            >
              OK
            </button>
          </>
        )}

        {/* Error State */}
        {deleteResult && !deleteResult.success && (
          <>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-red-400">Delete Failed</h3>
            <p className="text-gray-300 mb-4">{deleteResult.message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors flex-1"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-500 transition-colors flex-1 font-medium"
              >
                Try Again
              </button>
            </div>
          </>
        )}

        {/* Confirmation State */}
        {!deleteResult && (
          <>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗑️</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Delete Reel?</h3>
            <p className="text-gray-300 mb-6">This action cannot be undone. The reel and all its associated data will be permanently deleted.</p>

            {/* Processing State */}
            {isProcessing ? (
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-300">Deleting...</span>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-500 transition-colors flex-1 font-medium"
                  disabled={isProcessing}
                >
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const UserReels = ({ userId, previewMode = false, currentUserId }: UserReelsProps) => {
  // Use the dedicated reels hook with pagination - only loading thumbnails
  const { posts, loading, hasMore, loadMore, refreshPosts } = useUserReels(userId);
  const navigate = useNavigate();
  const auth = useAuth();
  const access_token = auth.user?.access_token;

  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [loadingThumbnails, setLoadingThumbnails] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; post: EditModalData } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; post: ThumbnailPost } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteResult, setDeleteResult] = useState<DeleteResult | null>(null);

  const thumbnailQueue = useRef<Set<string>>(new Set());
  const isProcessingThumbnails = useRef(false);

  // Load more for non-preview mode
  const handleLoadMore = () => {
    if (!previewMode && hasMore && !loading) {
      loadMore();
    }
  };

  // Take only first 6 posts for preview
  const previewPosts = previewMode ? posts.slice(0, 6) : posts;

  // Check if current user owns this post
  const isOwnPost = (post: ThumbnailPost) => {
    return currentUserId && post.userId === currentUserId;
  };

  // Handle menu toggle
  const handleMenuToggle = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpen(menuOpen === postId ? null : postId);
  };

  const handleEdit = (post: ThumbnailPost) => {
    setMenuOpen(null);

    // Get the video file from post files
    const videoFile = post.files?.find((f: FileItem) => f.type.startsWith('video'));
    const thumbnailFile = post.files?.find((f: FileItem) => f.isCustom || f.type.startsWith('image'));

    // Prepare edit data with ALL necessary fields
    const editData: EditModalData = {
      postId: post.postId,
      reelId: post.reelId,
      caption: post.caption || '',
      tags: post.tags || [],
      visibility: (post.visibility as "public" | "private") || "public",
      // Video data
      videoUrl: videoFile?.url,
      fileName: videoFile?.fileName,
      fileType: videoFile?.type,
      // Thumbnail data
      thumbnailUrl: thumbnailFile?.url,
      isEditMode: true,
      // Pass the actual files for reference
      existingVideo: videoFile,
      existingThumbnail: thumbnailFile,
      allFiles: post.files || []
    };

    console.log('📝 Edit data prepared:', editData);
    setEditModal({ isOpen: true, post: editData });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
    setDeleteResult(null);
    setIsProcessing(false);
  };

  // Handle delete
  const handleDelete = (post: ThumbnailPost) => {
    setMenuOpen(null);
    setDeleteResult(null); // Reset any previous result
    setDeleteConfirm({ isOpen: true, post });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm || !access_token) return;

    setIsProcessing(true);
    setDeleteResult(null);

    try {
      const deletePayload = {
        action: "REELDELETE",
        postId: deleteConfirm.post.postId,
        reelId: deleteConfirm.post.reelId
      };

      console.log('🗑️ Deleting reel:', deletePayload);

      const deleteRes = await fetch(`${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.CREATE_POST}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(deletePayload),
      });

      const responseData = await deleteRes.json();

      if (!deleteRes.ok) {
        throw new Error(responseData.error || `HTTP ${deleteRes.status}: Failed to delete reel`);
      }

      console.log('✅ Reel deleted successfully:', responseData);

      // Set success result
      setDeleteResult({
        success: true,
        message: "Reel deleted successfully!",
        details: responseData
      });

      // Refresh the posts list after a short delay to show success message
      setTimeout(() => {
        refreshPosts();
        // Close modal after successful deletion
        setTimeout(() => {
          setDeleteConfirm(null);
          setDeleteResult(null);
        }, 1000);
      }, 1500);

    } catch (error: unknown) {
      console.error('Reel deletion failed:', error);

      // Set error result
      setDeleteResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete reel. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdit = async (updatedData: SaveData) => {
    if (!editModal || !access_token) return;

    setIsProcessing(true);

    try {
      console.log('💾 Starting reel metadata update...', updatedData);

      let thumbnailS3Key: string | null = null;
      const thumbnailRemoved = updatedData.thumbnailAction === 'remove';

      // Handle thumbnail changes
      if (updatedData.thumbnailAction === 'replace' && updatedData.thumbnail instanceof File) {
        console.log('🖼️ Uploading new thumbnail...');

        const safeThumbnailFilename = encodeURIComponent(updatedData.thumbnail.name.replace(/[^a-zA-Z0-9.-]/g, '_'));
        const thumbnailPresignRes = await fetch(`${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.REEL_CONTENT_UPLOADER}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            filename: safeThumbnailFilename,
            filetype: updatedData.thumbnail.type,
            purpose: "reel_thumbnail",
            reelId: updatedData.reelId
          }),
        });

        if (thumbnailPresignRes.ok) {
          const thumbnailPresignData = await thumbnailPresignRes.json();

          await fetch(thumbnailPresignData.url, {
            method: "PUT",
            headers: {
              "Content-Type": updatedData.thumbnail.type,
            },
            body: updatedData.thumbnail,
          });

          thumbnailS3Key = thumbnailPresignData.key;
        }
      }

      // Prepare update payload
      const updatePayload: {
        action: string;
        postId: string;
        metadata: {
          caption: string;
          tags: string[];
          visibility: "public" | "private";
          thumbnail?: {
            s3Key: string;
            fileName: string;
            type: string;
            isCustom: boolean;
          } | null;
        };
      } = {
        action: "REELUPDATE",
        postId: updatedData.postId!,
        metadata: {
          caption: updatedData.caption,
          tags: updatedData.tags,
          visibility: updatedData.visibility,
        }
      };

      // Handle thumbnail: new upload or removal
      if (thumbnailS3Key) {
        // New thumbnail uploaded
        updatePayload.metadata.thumbnail = {
          s3Key: thumbnailS3Key,
          fileName: updatedData.thumbnail?.name || "thumbnail.jpg",
          type: updatedData.thumbnail?.type || "image/jpeg",
          isCustom: true
        };
      } else if (thumbnailRemoved) {
        // Thumbnail was removed
        updatePayload.metadata.thumbnail = null;
      }
      // If neither, thumbnail remains unchanged

      console.log('📤 Sending metadata update to backend:', updatePayload);

      const updateRes = await fetch(`${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.CREATE_POST}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!updateRes.ok) {
        const errorText = await updateRes.text();
        throw new Error(`Update failed: ${errorText}`);
      }

      const result = await updateRes.json();
      console.log('✅ Reel metadata updated successfully:', result);

      // Refresh the posts list
      refreshPosts();
      setEditModal(null);

    } catch (error: unknown) {
      console.error('Reel metadata update failed:', error);
      alert(`Failed to update reel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpen) setMenuOpen(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const getThumbnail = useCallback((post: ThumbnailPost) => {
    const customThumbnail = post.files.find((file: FileItem) => file.isCustom);
    if (customThumbnail) return customThumbnail.url;

    const imageFile = post.files.find((file: FileItem) => file.type.startsWith("image"));
    if (imageFile) return imageFile.url;

    if (thumbnails[post.postId]) {
      return thumbnails[post.postId];
    }

    return null;
  }, [thumbnails]);

  const processThumbnailQueue = useCallback(async () => {
    if (isProcessingThumbnails.current || thumbnailQueue.current.size === 0) return;

    isProcessingThumbnails.current = true;

    const postId = Array.from(thumbnailQueue.current)[0];
    thumbnailQueue.current.delete(postId);

    const post = posts.find(p => p.postId === postId);
    if (!post) {
      isProcessingThumbnails.current = false;
      setTimeout(processThumbnailQueue, 100);
      return;
    }

    const videoFile = post.files.find((file: FileItem) => file.type.startsWith("video"));
    if (!videoFile || videoErrors[postId]) {
      isProcessingThumbnails.current = false;
      setTimeout(processThumbnailQueue, 100);
      return;
    }

    setLoadingThumbnails(prev => ({ ...prev, [postId]: true }));

    try {
      const thumbnailUrl = await generateThumbnail(videoFile.url);
      if (thumbnailUrl) {
        setThumbnails(prev => ({ ...prev, [postId]: thumbnailUrl }));
      }
    } catch (error) {
      console.warn(`Failed to generate thumbnail for ${postId}:`, error);
      setVideoErrors(prev => ({ ...prev, [postId]: true }));
    } finally {
      setLoadingThumbnails(prev => ({ ...prev, [postId]: false }));
      isProcessingThumbnails.current = false;
      setTimeout(processThumbnailQueue, 200);
    }
  }, [posts, videoErrors]);

  const generateThumbnail = (videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;
      video.currentTime = 0.5;
      video.muted = true;
      video.playsInline = true;

      const timeoutId: NodeJS.Timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Thumbnail generation timeout'));
      }, 10000);

      const cleanup = () => {
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('seeked', onSeeked);
        clearTimeout(timeoutId);
        URL.revokeObjectURL(video.src);
        video.remove();
      };

      const onSeeked = () => {
        captureFrame();
      };

      const onLoadedData = () => {
        video.addEventListener('seeked', onSeeked);
        video.currentTime = Math.min(0.5, video.duration / 2);
      };

      const onCanPlay = () => {
        video.currentTime = Math.min(0.5, video.duration / 2);
      };

      const captureFrame = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 568;
          const ctx = canvas.getContext('2d');

          if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
            cleanup();
            resolve(thumbnailUrl);
          } else {
            throw new Error('Video dimensions invalid');
          }
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      const onError = (e: ErrorEvent) => {
        cleanup();
        reject(new Error(`Video load error: ${e.message}`));
      };

      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('error', onError);
      video.addEventListener('canplay', onCanPlay);
    });
  };

  const handleReelClick = useCallback((post: ThumbnailPost) => {
    // Don't navigate if menu is open or modal is open
    if (menuOpen || editModal || deleteConfirm || isProcessing) return;

    if (userId && !videoErrors[post.postId]) {
      navigate(`/reels/${userId}/allreels`, {
        state: {
          posts: posts,
          highlightedPostId: post.postId,
          contentType: "reels" // Add contentType to identify
        }
      });
    }
  }, [userId, navigate, posts, menuOpen, editModal, deleteConfirm, isProcessing, videoErrors]);


  // Queue thumbnails for generation when posts change
  const queueThumbnails = useCallback(() => {
    posts.forEach(post => {
      const hasCustomThumb = post.files.find((file: FileItem) => file.isCustom);
      const hasImage = post.files.find((file: FileItem) => file.type.startsWith("image"));

      if (!hasCustomThumb && !hasImage && !thumbnails[post.postId] && !videoErrors[post.postId]) {
        thumbnailQueue.current.add(post.postId);
      }
    });

    if (!isProcessingThumbnails.current) {
      processThumbnailQueue();
    }
  }, [posts, thumbnails, videoErrors, processThumbnailQueue]);

  useEffect(() => {
    const timer = setTimeout(queueThumbnails, 500);
    return () => clearTimeout(timer);
  }, [queueThumbnails]);

  if (loading && posts.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 text-lg">Loading reels...</p>
    </div>
  );

  if (posts.length === 0) return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🎬</div>
      <p className="text-gray-400 text-lg">No reels yet.</p>
    </div>
  );

  return (
    <div className="w-full">
      {/* Processing Overlay */}
      {isProcessing && !deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white">Processing...</span>
          </div>
        </div>
      )}

      <div className={`grid gap-4 ${previewMode
        ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        }`}>
        {previewPosts.map((post) => {
          const thumbnail = getThumbnail(post);
          const isCorrupted = videoErrors[post.postId];
          const isLoading = loadingThumbnails[post.postId];
          const hasAudio = post.files.some((f: FileItem) => f.type.startsWith('audio'));

          return (
            <div
              key={post.postId}
              className={`aspect-[9/16] rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer group relative ${isCorrupted ? 'bg-red-900/20 border border-red-500/30' : 'bg-gray-800'
                } ${isLoading ? 'opacity-70' : ''}`}
              onClick={() => handleReelClick(post)}
            >
              {/* Audio indicator */}
              {hasAudio && (
                <div className="absolute top-2 left-2 bg-black/70 text-white p-1.5 rounded-lg backdrop-blur-sm z-10">
                  🎵
                </div>
              )}

              {/* 3-dot Menu Button */}
              {isOwnPost(post) && (
                <div className="absolute top-2 right-2 z-20">
                  <button
                    onClick={(e) => handleMenuToggle(e, post.postId)}
                    className="bg-black/70 text-white p-1.5 rounded-lg hover:bg-black/90 transition-colors backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 opacity-100"
                    disabled={isProcessing}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="6" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="18" r="1.5" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {menuOpen === post.postId && (
                    <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-30 min-w-32 animate-scale-in">
                      <button
                        onClick={() => handleEdit(post)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        disabled={isProcessing}
                      >
                        <span>✏️</span>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors flex items-center gap-2 text-red-400 disabled:opacity-50"
                        disabled={isProcessing}
                      >
                        <span>🗑️</span>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                  <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Thumbnail or Corrupted State */}
              {isCorrupted ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/10 p-4">
                  <div className="text-4xl mb-3">⚠️</div>
                  <div className="text-red-400 text-center">
                    <p className="font-semibold text-sm mb-1">Corrupted Video</p>
                    <p className="text-xs text-red-300 opacity-80">Unable to load</p>
                  </div>
                </div>
              ) : thumbnail ? (
                <img
                  src={thumbnail}
                  alt="Reel thumbnail"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <span className="text-gray-500 text-2xl">🎬</span>
                </div>
              )}

              {/* Reel indicator */}
              <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${isCorrupted
                ? 'bg-red-600/90 text-white'
                : isLoading
                  ? 'bg-blue-600/90 text-white'
                  : 'bg-black/70 text-white'
                }`}>
                {isCorrupted ? 'Error' : isLoading ? 'Loading...' : 'Reel'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More button for non-preview mode */}
      {!previewMode && hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </>
            ) : (
              'Load More Reels'
            )}
          </button>
        </div>
      )}

      {/* Show "See All Reels" button in preview mode if there are more than 6 posts or hasMore is true */}
      {previewMode && (posts.length > 6 || hasMore) && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => {
              navigate(`/reels/${userId}/allreels`, {
                state: {
                  initialPosts: posts,
                  highlightedPostId: null,
                  contentType: "reels"
                }
              });
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            See All Reels ({posts.length} {hasMore ? '+' : ''})
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <ReelEditModal
          post={editModal.post}
          isOpen={editModal.isOpen}
          onClose={() => setEditModal(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={deleteConfirm.isOpen}
          onCancel={handleCancelDelete}
          onConfirm={confirmDelete}
          isProcessing={isProcessing}
          deleteResult={deleteResult}
        />
      )}
    </div>
  );
};

export default UserReels;