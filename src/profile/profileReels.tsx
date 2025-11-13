import { useUserPosts } from "../hooks/useUserPosts_Reels";
import { useNavigate } from "react-router-dom";
import { useState, useCallback, useRef } from "react";

interface UserReelsProps {
  userId?: string;
  previewMode?: boolean;
  currentUserId?: string; // Add current user ID to check ownership
}

// Edit Modal Component for Reels
const ReelEditModal = ({ post, isOpen, onClose, onSave }: { 
  post: any; 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void;
}) => {
  const [formData, setFormData] = useState({
    caption: post.caption || '',
    tags: post.tags?.join(', ') || '',
    template: post.template || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">Edit Reel</h3>
        
        <form onSubmit={handleSubmit}>
          {/* Video/Thumbnail Preview */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Reel Preview</label>
            <div className="aspect-[9/16] bg-gray-700 rounded-lg overflow-hidden">
              {post.files.find((f: any) => f.type.startsWith('video')) ? (
                <video 
                  src={post.files.find((f: any) => f.type.startsWith('video')).url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl">🎬</span>
                </div>
              )}
            </div>
          </div>

          {/* Template */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Template</label>
            <input
              type="text"
              value={formData.template}
              onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              placeholder="Template name (if any)"
            />
          </div>

          {/* Caption */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Caption</label>
            <textarea
              value={formData.caption}
              onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              rows={3}
              maxLength={500}
              placeholder="Add a caption..."
            />
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              placeholder="tag1, tag2, tag3"
            />
            <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserReels = ({ userId, previewMode = false, currentUserId }: UserReelsProps) => {
  const { posts, loading } = useUserPosts("crinzpostsreels", userId);
  const navigate = useNavigate();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [loadingThumbnails, setLoadingThumbnails] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; post: any } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; post: any } | null>(null);
  
  const thumbnailQueue = useRef<Set<string>>(new Set());
  const isProcessing = useRef(false);

  // Check if current user owns this post
  const isOwnPost = (post: any) => {
    return currentUserId && post.userId === currentUserId;
  };

  // Handle menu toggle
  const handleMenuToggle = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === postId ? null : postId);
  };

  // Handle edit
  const handleEdit = (post: any) => {
    setEditModal({ isOpen: true, post });
    setMenuOpen(null);
  };

  // Handle delete
  const handleDelete = (post: any) => {
    setDeleteConfirm({ isOpen: true, post });
    setMenuOpen(null);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteConfirm) {
      const deletePayload = {
        postId: deleteConfirm.post.postId,
        userId: deleteConfirm.post.userId
      };
      console.log('Delete payload:', deletePayload);
      // Here you would call your delete API
      setDeleteConfirm(null);
    }
  };

  // Handle save edit
  const handleSaveEdit = (updatedData: any) => {
    if (editModal) {
      const editPayload = {
        postId: editModal.post.postId,
        userId: editModal.post.userId,
        caption: updatedData.caption,
        tags: updatedData.tags,
        template: updatedData.template,
        // Include other editable fields as needed
        files: editModal.post.files // Keep original files
      };
      console.log('Edit payload:', editPayload);
      // Here you would call your update API
      setEditModal(null);
    }
  };

  const getThumbnail = useCallback((post: any) => {
    // First try to find custom thumbnail
    const customThumbnail = post.files.find((file: any) => file.isCustom);
    if (customThumbnail) return customThumbnail.url;
    
    // Then try any image file
    const imageFile = post.files.find((file: any) => file.type.startsWith("image"));
    if (imageFile) return imageFile.url;
    
    // Check if we have a generated thumbnail
    if (thumbnails[post.postId]) {
      return thumbnails[post.postId];
    }
    
    return null;
  }, [thumbnails]);

  const processThumbnailQueue = useCallback(async () => {
    if (isProcessing.current || thumbnailQueue.current.size === 0) return;
    
    isProcessing.current = true;
    
    // Process one at a time to prevent lag
    const postId = Array.from(thumbnailQueue.current)[0];
    thumbnailQueue.current.delete(postId);
    
    const post = posts.find(p => p.postId === postId);
    if (!post) {
      isProcessing.current = false;
      setTimeout(processThumbnailQueue, 100);
      return;
    }

    const videoFile = post.files.find((file: any) => file.type.startsWith("video"));
    if (!videoFile || videoErrors[postId]) {
      isProcessing.current = false;
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
      isProcessing.current = false;
      setTimeout(processThumbnailQueue, 200); // Add delay between processing
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

      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
        video.removeEventListener('canplay', onCanPlay);
        clearTimeout(timeoutId);
        video.remove();
      };

      const onLoadedData = () => {
        // Wait for video to be ready to play
        video.addEventListener('canplay', onCanPlay);
        video.play().catch(() => {
          // If autoplay fails, try to capture anyway
          captureFrame();
        });
      };

      const onCanPlay = () => {
        captureFrame();
      };

      const captureFrame = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 568;
          const ctx = canvas.getContext('2d');
          
          if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7); // Lower quality for performance
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

      const onError = () => {
        cleanup();
        reject(new Error('Video load error'));
      };

      // Timeout after 5 seconds
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Thumbnail generation timeout'));
      }, 5000);

      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('error', onError);
    });
  };

  const handleReelClick = useCallback((post: any) => {
    if (userId && !videoErrors[post.postId]) {
      // Pass the entire posts data to ReelsAllPage via state
      navigate(`/reels/${userId}/allreels`, { 
        state: { 
          posts: posts,
          highlightedPostId: post.postId 
        } 
      });
    }
  }, [userId, videoErrors, navigate, posts]);

  // Queue thumbnails for generation when posts change
  const queueThumbnails = useCallback(() => {
    posts.forEach(post => {
      const hasCustomThumb = post.files.find((file: any) => file.isCustom);
      const hasImage = post.files.find((file: any) => file.type.startsWith("image"));
      
      if (!hasCustomThumb && !hasImage && !thumbnails[post.postId] && !videoErrors[post.postId]) {
        thumbnailQueue.current.add(post.postId);
      }
    });
    
    if (!isProcessing.current) {
      processThumbnailQueue();
    }
  }, [posts, thumbnails, videoErrors, processThumbnailQueue]);

  // Only process a few thumbnails at a time
  useState(() => {
    const timer = setTimeout(queueThumbnails, 500); // Delay initial processing
    return () => clearTimeout(timer);
  });

  if (loading) return (
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
      <div className={`grid gap-4 ${
        previewMode 
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" 
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      }`}>
        {posts.map((post) => {
          const thumbnail = getThumbnail(post);
          const isCorrupted = videoErrors[post.postId];
          const isLoading = loadingThumbnails[post.postId];

          return (
            <div 
              key={post.postId} 
              className={`aspect-[9/16] rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer group relative ${
                isCorrupted ? 'bg-red-900/20 border border-red-500/30' : 'bg-gray-800'
              } ${isLoading ? 'opacity-70' : ''}`}
              onClick={() => handleReelClick(post)}
            >
              {/* 3-dot Menu Button - Only show if user owns the post */}
              {isOwnPost(post) && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <button
                    onClick={(e) => handleMenuToggle(e, post.postId)}
                    className="bg-black/70 text-white p-1.5 rounded-lg hover:bg-black/90 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="6" r="1.5"/>
                      <circle cx="12" cy="12" r="1.5"/>
                      <circle cx="12" cy="18" r="1.5"/>
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {menuOpen === post.postId && (
                    <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-30 min-w-32">
                      <button
                        onClick={() => handleEdit(post)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors flex items-center gap-2 text-red-400"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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

              {/* Play button overlay - Only show if not corrupted and not loading */}
              {!isCorrupted && !isLoading && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-green-600 text-white p-3 rounded-full">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Reel indicator */}
              <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg text-xs font-medium ${
                isCorrupted 
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold mb-2">Delete Reel</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this reel? This action cannot be undone.</p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReels;