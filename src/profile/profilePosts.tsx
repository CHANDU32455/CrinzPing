import { useUserPosts } from "../hooks/useUserPosts_Reels";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface UserMemesProps {
  userId?: string;
  previewMode?: boolean;
  onPostClick?: (post: any) => void;
  currentUserId?: string; // Add current user ID to check ownership
}

// Edit Modal Component for Memes
const MemeEditModal = ({ post, isOpen, onClose, onSave }: { 
  post: any; 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void;
}) => {
  const [formData, setFormData] = useState({
    caption: post.caption || '',
    tags: post.tags?.join(', ') || ''
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
        <h3 className="text-xl font-bold mb-4">Edit Post</h3>
        
        <form onSubmit={handleSubmit}>
          {/* Images Preview */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Images ({post.files.filter((f: any) => f.type.startsWith('image')).length})</label>
            <div className="grid grid-cols-3 gap-2">
              {post.files.filter((file: any) => file.type.startsWith('image')).map((file: any, index: number) => (
                <img key={index} src={file.url} alt="" className="w-full h-20 object-cover rounded" />
              ))}
            </div>
          </div>

          {/* Audio Preview */}
          {post.files.some((f: any) => f.type.startsWith('audio')) && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Audio</label>
              <div className="bg-gray-700 p-3 rounded flex items-center">
                <span className="text-2xl mr-3">🎵</span>
                <span className="text-sm">Audio file attached</span>
              </div>
            </div>
          )}

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

const UserMemes = ({ userId, previewMode = false, onPostClick, currentUserId }: UserMemesProps) => {
  const { posts, loading } = useUserPosts("crinzpostsmeme", userId);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; post: any } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; post: any } | null>(null);

  const handlePostClick = (post: any) => {
    if (onPostClick) {
      onPostClick(post);
    } else if (userId) {
      navigate(`/posts/${userId}/allposts`, { 
        state: { 
          posts: posts,
          highlightedPostId: post.postId 
        } 
      });
    }
  };

  const getFirstImage = (post: any) => {
    return post.files.find((file: any) => 
      file.type.startsWith("image") && !file.isCustom
    );
  };

  const hasMultipleImages = (post: any) => {
    const imageFiles = post.files.filter((file: any) => 
      file.type.startsWith("image") && !file.isCustom
    );
    return imageFiles.length > 1;
  };

  const hasAudio = (post: any) => {
    return post.files.some((file: any) => file.type.startsWith("audio"));
  };

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
        // Include other editable fields as needed
        files: editModal.post.files // Keep original files
      };
      console.log('Edit payload:', editPayload);
      // Here you would call your update API
      setEditModal(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 text-lg">Loading posts...</p>
    </div>
  );

  if (posts.length === 0) return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📷</div>
      <p className="text-gray-400 text-lg">No posts yet.</p>
    </div>
  );

  return (
    <div className="w-full">
      <div className={`grid gap-4 ${
        previewMode 
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" 
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      }`}>
        {posts.map(post => {
          const firstImage = getFirstImage(post);
          const multipleImages = hasMultipleImages(post);
          const audioAvailable = hasAudio(post);

          return (
            <div 
              key={post.postId} 
              className="aspect-square bg-gray-800 rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer group relative"
              onClick={() => handlePostClick(post)}
            >
              {/* Image */}
              {firstImage ? (
                <img 
                  src={firstImage.url} 
                  alt="Post" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <span className="text-gray-500 text-2xl">📷</span>
                </div>
              )}

              {/* 3-dot Menu Button - Only show if user owns the post */}
              {isOwnPost(post) && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                    <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-32">
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

              {/* Overlay with indicators */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300">
                {/* Multiple images indicator */}
                {multipleImages && (
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs">
                    📸 {post.files.filter((f: any) => f.type.startsWith("image")).length}
                  </div>
                )}

                {/* Audio indicator */}
                {audioAvailable && (
                  <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-lg text-xs">
                    🎵
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <MemeEditModal
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
            <h3 className="text-xl font-bold mb-2">Delete Post</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
            
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

export default UserMemes;