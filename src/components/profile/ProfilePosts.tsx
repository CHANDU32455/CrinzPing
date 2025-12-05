import { useState, useRef, useEffect, type Key } from "react";
import { useNavigate } from "react-router-dom";
import { useUserPosts } from "../../hooks/useUserPosts_Reels";
import { useAuth } from "react-oidc-context";
import PostCompressionUtility from "../../utils/postsCompressionUtil";
import { type CompressionStats } from "../../utils/postsCompressionUtil";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import { VisibilityToggle } from "../shared/VisibilityToggle";

interface UserMemesProps {
  userId?: string;
  previewMode?: boolean;
  onPostClick?: (post: Post) => void;
  currentUserId?: string;
}

interface FileItem {
  url: string;
  type: string;
  fileName?: string;
  s3Key?: string;
  isNew?: boolean;
  file?: File;
  originalSize?: number;
  compressedSize?: number;
  contentBase64?: string;
}

interface Post {
  postId: string;
  userId: string;
  caption?: string;
  tags?: string[];
  files: FileItem[];
  visibility?: "public" | "private";
}

interface EditFormData {
  caption: string;
  tags: string;
  files: FileItem[];
  visibility: "public" | "private";
}

const AudioPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 1;
      setProgress((current / duration) * 100);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!audioRef.current) return;

    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();

    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;

    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setProgress((newTime / audioRef.current.duration) * 100);
  };

  return (
    <div className="flex flex-col gap-2 bg-gray-700 p-3 rounded-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <span className="text-sm text-gray-300">Audio</span>
      </div>

      <div
        className="w-full h-2 bg-gray-600 rounded cursor-pointer"
        onClick={handleSeek}
      >
        <div
          className="h-2 bg-blue-500 rounded"
          style={{ width: `${progress}%` }}
        />
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
      />
    </div>
  );
};

const TagsDisplay = ({ tags }: { tags: string[] }) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="px-2 py-1 bg-blue-600/80 text-white text-xs rounded-full backdrop-blur-sm"
        >
          #{tag.trim()}
        </span>
      ))}
    </div>
  );
};

const MemeEditModal = ({ post, isOpen, onClose, onSave }: {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { caption: string; tags: string[]; files: FileItem[]; visibility: "public" | "private" }) => void;
}) => {
  const [formData, setFormData] = useState<EditFormData>({
    caption: post.caption || '',
    tags: post.tags?.join(', ') || '',
    files: post.files.map((file: FileItem) => ({
      ...file,
      url: file.url,
      isNew: false
    })),
    visibility: post.visibility || "public"
  });
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";

      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          onClose();
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
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
  }, [isOpen, onClose]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      formData.files.forEach((file: FileItem) => {
        if (file.isNew && file.url) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [formData.files]); // Fixed dependency

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      onSave({
        caption: formData.caption,
        tags: formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
        files: formData.files,
        visibility: formData.visibility
      }); // Pass only the necessary data
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    const fileToRemove = formData.files[index];
    // Revoke object URL if it's a new file
    if (fileToRemove.isNew && fileToRemove.url) {
      URL.revokeObjectURL(fileToRemove.url);
    }

    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i: number) => i !== index)
    }));
  };

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image'));
    const currentImageCount = formData.files.filter((f: FileItem) => f.type.startsWith('image')).length;

    if (currentImageCount + imageFiles.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    try {
      // Compress new images
      const compressionStats: CompressionStats = await PostCompressionUtility.compressImages(imageFiles);

      const newFiles: FileItem[] = compressionStats.files.map(result => ({
        url: URL.createObjectURL(result.file),
        file: result.file,
        type: result.file.type,
        isNew: true,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize
      }));

      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }));

      // Log compression results
      PostCompressionUtility.logCompressionStats(compressionStats);

    } catch (error) {
      console.error('Image compression failed:', error);
      // Fallback to uncompressed files
      const newFiles: FileItem[] = imageFiles.map(file => ({
        url: URL.createObjectURL(file),
        file: file,
        type: file.type,
        isNew: true
      }));

      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const audioFile = files[0];
    if (!audioFile.type.startsWith('audio')) {
      alert('Please select an audio file');
      return;
    }

    try {
      // Process audio (trim and compress)
      const trimmedAudio = await PostCompressionUtility.trimAudio(audioFile);
      const compressedAudio = await PostCompressionUtility.compressAudio(trimmedAudio);

      const filteredFiles = formData.files.filter((f: FileItem) => !f.type.startsWith('audio'));
      const newAudioFile: FileItem = {
        url: URL.createObjectURL(compressedAudio),
        file: compressedAudio,
        type: compressedAudio.type,
        isNew: true
      };

      setFormData(prev => ({
        ...prev,
        files: [...filteredFiles, newAudioFile]
      }));

    } catch (error) {
      console.error('Audio processing failed:', error);
      alert('Failed to process audio file. Please try another file.');
      return;
    }

    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  const getImageFiles = (): FileItem[] => formData.files.filter((f: FileItem) => f.type.startsWith('image'));
  const getAudioFile = (): FileItem | undefined => formData.files.find((f: FileItem) => f.type.startsWith('audio'));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100] p-4 pb-20 sm:pb-4">
      <div
        ref={modalRef}
        className="bg-gray-800 rounded-t-xl sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-scale-in"
      >
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">Edit Post</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium">
                  Images ({getImageFiles().length}/5)
                </label>
                {getImageFiles().length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors text-sm"
                  >
                    Add Images
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleAddImages}
                className="hidden"
              />

              <div className="grid grid-cols-3 gap-3">
                {getImageFiles().map((file: FileItem, index: Key | null | undefined) => (
                  <div key={index} className="relative group">
                    <img
                      src={file.url}
                      alt=""
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(formData.files.indexOf(file))}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-100 hover:bg-red-500 transition-colors"
                    >
                      ×
                    </button>
                    {file.isNew && file.originalSize && file.compressedSize && (
                      <div className="absolute bottom-1 left-1 right-1 bg-black/80 text-white text-xs p-1 rounded text-center">
                        ⚡ {Math.round((1 - file.compressedSize / file.originalSize) * 100)}% smaller
                      </div>
                    )}
                  </div>
                ))}

                {Array.from({ length: 5 - getImageFiles().length }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="w-full h-24 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="text-gray-400 text-2xl">+</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium">Audio</label>
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors text-sm"
                >
                  {getAudioFile() ? 'Replace Audio' : 'Add Audio'}
                </button>
              </div>

              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAddAudio}
                className="hidden"
              />

              {getAudioFile() ? (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <AudioPlayer audioUrl={getAudioFile()!.url} />
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(formData.files.indexOf(getAudioFile()!))}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      Remove Audio
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="bg-gray-700 p-4 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors border-2 border-dashed border-gray-600"
                  onClick={() => audioInputRef.current?.click()}
                >
                  <span className="text-gray-400">+ Add Audio File</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Caption</label>
              <textarea
                value={formData.caption}
                onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white resize-none focus:border-blue-500 focus:outline-none transition-colors"
                rows={3}
                maxLength={500}
                placeholder="Add a caption..."
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {formData.caption.length}/500
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="tag1, tag2, tag3"
              />
              <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>

              <div className="mt-2">
                <TagsDisplay tags={formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)} />
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="mb-6">
              <VisibilityToggle
                visibility={formData.visibility}
                onToggle={(newVisibility) => setFormData(prev => ({ ...prev, visibility: newVisibility }))}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ isOpen, onCancel, onConfirm, isProcessing }: {
  post: Post;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div
        ref={modalRef}
        className="bg-gray-800 rounded-xl max-w-sm w-full p-6 text-center animate-scale-in"
      >
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🗑️</span>
        </div>
        <h3 className="text-lg font-bold mb-2">Delete Post?</h3>
        <p className="text-gray-300 mb-6">This action cannot be undone. The post will be permanently deleted.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors flex-1 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-500 transition-colors flex-1 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const UserMemes = ({ userId, previewMode = false, onPostClick, currentUserId }: UserMemesProps) => {
  // Get userDetails from the hook
  const { posts, userDetails, loading, hasMore, refreshPosts } = useUserPosts("crinzpostsmeme", userId);
  const navigate = useNavigate();
  const auth = useAuth();
  const access_token = auth.user?.access_token;

  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; post: Post } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; post: Post } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // For preview mode, show only first 6 posts
  const displayPosts = previewMode ? posts.slice(0, 6) : posts;

  const handleEdit = (post: Post) => {
    setMenuOpen(null);
    setEditModal({ isOpen: true, post });
  };

  const handleDelete = (post: Post) => {
    setMenuOpen(null);
    setDeleteConfirm({ isOpen: true, post });
  };

  const handlePostClick = (post: Post) => {
    if (menuOpen || editModal || deleteConfirm) return;

    if (onPostClick) {
      onPostClick(post);
    } else if (userId && previewMode) {
      // Only navigate when in preview mode
      navigate(`/posts/${userId}/allposts`, {
        state: {
          posts: posts, // All loaded posts
          userDetails: userDetails, // User profile info
          highlightedPostId: post.postId, // The clicked post
          userId: userId, // User ID for API calls
          postType: "crinzpostsmeme" // Type for consistency
        }
      });
    }
    // If not in preview mode, do nothing
  };

  const handleSeeAllPosts = () => {
    if (userId && previewMode) {
      navigate(`/posts/${userId}/allposts`, {
        state: {
          posts: posts, // All loaded posts
          userDetails: userDetails, // User profile info
          highlightedPostId: null, // No specific post highlighted
          userId: userId,
          postType: "crinzpostsmeme"
        }
      });
    }
  };

  const handleMenuToggle = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === postId ? null : postId);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpen) setMenuOpen(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm || !access_token) return;

    setIsProcessing(true);
    try {
      const payload = {
        action: "POSTDELETE",
        postId: deleteConfirm.post.postId
      };

      const res = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.CREATE_POST}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete post');
      }

      console.log('Post deleted successfully');
      setDeleteConfirm(null);
      refreshPosts();

    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdit = async (updatedData: { caption: string; tags: string[]; files: FileItem[]; visibility: "public" | "private" }) => {
    if (!editModal || !access_token) return;

    setIsProcessing(true);
    try {
      // Process files with compression for new files
      const processedFiles = await Promise.all(
        updatedData.files.map(async (file: FileItem) => {
          if (file.isNew && file.file) {
            // Compress new images
            let finalFile = file.file;

            if (file.type.startsWith('image')) {
              const compressionStats: CompressionStats = await PostCompressionUtility.compressImages([file.file]);
              finalFile = compressionStats.files[0].file;
              PostCompressionUtility.logCompressionStats(compressionStats);
            } else if (file.type.startsWith('audio')) {
              // Process audio (trim + compress)
              const trimmedAudio = await PostCompressionUtility.trimAudio(file.file);
              finalFile = await PostCompressionUtility.compressAudio(trimmedAudio);
            }

            const base64Content = await fileToBase64(finalFile);
            return {
              name: finalFile.name,
              type: finalFile.type,
              contentBase64: base64Content
            };
          } else {
            // Return existing file in expected format
            const { fileName, s3Key, type, url } = file;
            return {
              fileName,
              s3Key,
              type,
              url
            };
          }
        })
      );

      // Create Lambda payload with POSTUPDATE action
      const payload = {
        action: "POSTUPDATE",
        postId: editModal.post.postId,
        caption: updatedData.caption,
        tags: updatedData.tags,
        files: processedFiles,
        visibility: updatedData.visibility
      };

      console.log('Sending update payload to Lambda:', payload);

      const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.CREATE_POST}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to update post`);
      }

      const result = await res.json();
      console.log('Post updated successfully:', result);
      setEditModal(null);
      refreshPosts();

    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const isOwnPost = (post: Post) => currentUserId && post.userId === currentUserId;
  const getFirstImage = (post: Post): FileItem | undefined => post.files.find((f: FileItem) => f.type.startsWith("image"));
  const getAudioFile = (post: Post): FileItem | undefined => post.files.find((f: FileItem) => f.type.startsWith("audio"));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 text-lg">Loading posts...</p>
    </div>
  );

  if (!posts.length) return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📷</div>
      <p className="text-gray-400 text-lg">No posts yet.</p>
    </div>
  );

  return (
    <div className="w-full">
      <div className={`grid gap-4 ${previewMode ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"}`}>
        {displayPosts.map((post: Post) => {
          const firstImage = getFirstImage(post);
          const audioFile = getAudioFile(post);

          return (
            <div
              key={post.postId}
              className="aspect-square bg-gray-800 rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer group relative"
              onClick={() => handlePostClick(post)}
            >
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

              {audioFile && (
                <div className="absolute top-2 left-2 bg-black/70 text-white p-1.5 rounded-lg backdrop-blur-sm">
                  🎵
                </div>
              )}

              {isOwnPost(post) && (
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={(e) => handleMenuToggle(e, post.postId)}
                    className="bg-black/70 text-white p-1.5 rounded-lg hover:bg-black/90 transition-colors backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 opacity-100"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="6" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="18" r="1.5" />
                    </svg>
                  </button>

                  {menuOpen === post.postId && (
                    <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20 min-w-32 animate-scale-in">
                      <button
                        onClick={() => handleEdit(post)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        <span>✏️</span>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        <span>🗑️</span>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show "See All Posts" button only in preview mode when there are more posts */}
      {previewMode && (posts.length > 6 || hasMore) && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleSeeAllPosts}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            See All Posts ({posts.length} {hasMore ? '+' : ''})
          </button>
        </div>
      )}

      {editModal && (
        <MemeEditModal
          post={editModal.post}
          isOpen={editModal.isOpen}
          onClose={() => setEditModal(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          post={deleteConfirm.post}
          isOpen={deleteConfirm.isOpen}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={confirmDelete}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};