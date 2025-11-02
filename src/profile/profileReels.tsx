import { useUserPosts } from "../hooks/useUserPosts_Reels";
import { useNavigate } from "react-router-dom";
import { useState, useCallback, useRef } from "react";

interface UserReelsProps {
  userId?: string;
  previewMode?: boolean;
}

const UserReels = ({ userId, previewMode = false }: UserReelsProps) => {
  const { posts, loading } = useUserPosts("crinzpostsreels", userId);
  const navigate = useNavigate();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [loadingThumbnails, setLoadingThumbnails] = useState<Record<string, boolean>>({});
  const thumbnailQueue = useRef<Set<string>>(new Set());
  const isProcessing = useRef(false);

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
    </div>
  );
};

export default UserReels;