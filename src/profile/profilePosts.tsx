import { useUserPosts } from "../hooks/useUserPosts_Reels";
import { useNavigate } from "react-router-dom";

interface UserMemesProps {
  userId?: string;
  previewMode?: boolean;
  onPostClick?: (post: any) => void;
}

const UserMemes = ({ userId, previewMode = false, onPostClick }: UserMemesProps) => {
  const { posts, loading } = useUserPosts("crinzpostsmeme", userId);
  const navigate = useNavigate();

  const handlePostClick = (post: any) => {
    if (onPostClick) {
      onPostClick(post);
    } else if (userId) {
      // Navigate to posts all page with the posts data
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

              {/* Overlay with indicators */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300">
                {/* Multiple images indicator */}
                {multipleImages && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs">
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
    </div>
  );
};

export default UserMemes;