import React, { useRef, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ShareComponent from "../components/shared/ShareComponent";
import CommentModal from "../components/feed/CommentModal";
import { useAuth } from "react-oidc-context";
import { contentManager } from "../utils/Posts_Reels_Stats_Syncer";
import { useUserMemes } from "../hooks/useUserPosts_Reels"; // Import the hook

// Define proper types based on your actual API response
interface FileItem {
  presignedUrl: string;
  type: string;
  isCustom?: boolean;
  fileName?: string;
  s3Key?: string;
  url?: string;
}

interface LocalPost {
  postId: string;
  userId: string;
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  files: FileItem[];
  isLiked?: boolean;
  type?: string;
  timestamp?: number;
  visibility?: string;
  pk?: string;
  sk?: string;
  mediaUrl?: string;
}

interface LocationState {
  posts: LocalPost[];
  highlightedPostId: string;
  userDetails?: {
    userProfilePic?: string;
    userName?: string;
    userTagline?: string;
  };
  userId?: string;
  postType?: string;
}

interface ApiPost {
  postId: string;
  userId?: string;
  caption?: string;
  tags?: string[];
  likes?: number;
  comments?: number;
  files?: Array<{
    url?: string;
    presignedUrl?: string;
    type: string;
    isCustom?: boolean;
    fileName?: string;
    s3Key?: string;
  }>;
  likedByUser?: boolean;
  type?: string;
  timestamp?: number;
  visibility?: string;
  pk?: string;
  sk?: string;
}

const PostsAllPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const currentUserId = auth.user?.profile?.sub;
  const accessToken = auth.user?.access_token;

  // ✅ UPDATED: Use the hook to fetch data directly
  const { posts: postsFromHook, userDetails, loading, hasMore, loadMore } = useUserMemes(userId);

  // Get highlighted post ID from location state if available
  const { highlightedPostId } = (location.state as LocationState) || {};

  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(-1);
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<number, number>>({});
  const [isManuallyPaused] = useState<boolean>(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  const [localPosts, setLocalPosts] = useState<LocalPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<LocalPost | null>(null);
  const [sharePost, setSharePost] = useState<LocalPost | null>(null);
  const [mutedStates, setMutedStates] = useState<Record<number, boolean>>({});

  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (postsFromHook && postsFromHook.length > 0) {
      let formattedPosts: LocalPost[] = postsFromHook.map((post: ApiPost) => {
        // ✅ Just use API data as-is - no content manager sync on load
        return {
          postId: post.postId,
          userId: post.userId || userId || 'unknown',
          caption: post.caption || '',
          tags: post.tags || [],
          likes: post.likes || 0,
          comments: post.comments || 0,
          files: post.files?.map((file) => ({
            presignedUrl: file.url || file.presignedUrl || '',
            type: file.type,
            isCustom: file.isCustom,
            fileName: file.fileName,
            s3Key: file.s3Key
          })) || [],
          isLiked: post.likedByUser || false, // Use API data directly
          type: post.type,
          timestamp: post.timestamp,
          visibility: post.visibility,
          pk: post.pk,
          sk: post.sk
        };
      });

      // If there's a highlight post ID, move it to the beginning of the array
      if (highlightedPostId && formattedPosts.length > 0) {
        const highlightIndex = formattedPosts.findIndex(post => post.postId === highlightedPostId);
        if (highlightIndex !== -1) {
          const [highlightedPost] = formattedPosts.splice(highlightIndex, 1);
          formattedPosts = [highlightedPost, ...formattedPosts];
        }
      }

      setLocalPosts(formattedPosts);

      // Initialize current image indices and muted states
      const initialImageIndices: Record<number, number> = {};
      const initialMutedStates: Record<number, boolean> = {};

      formattedPosts.forEach((_, index) => {
        initialImageIndices[index] = 0;
        initialMutedStates[index] = false;
      });

      setCurrentImageIndices(initialImageIndices);
      setMutedStates(initialMutedStates);
    }
  }, [postsFromHook, highlightedPostId, userId]);

  // Handle navbar visibility and body scroll
  useEffect(() => {
    if (selectedPost || sharePost) {
      document.body.classList.add('modal-open');
      if (currentPlayingIndex !== -1 && audioRefs.current[currentPlayingIndex]) {
        audioRefs.current[currentPlayingIndex]?.pause();
      }
    } else {
      document.body.classList.remove('modal-open');
      if (!isManuallyPaused && currentPlayingIndex !== -1 && audioRefs.current[currentPlayingIndex]) {
        audioRefs.current[currentPlayingIndex]?.play().catch(() => { });
      }
    }

    return () => {
      const bottomNav = document.querySelector('.bottom-navbar');
      if (bottomNav) {
        bottomNav.classList.remove('hidden');
      }
      document.body.classList.remove('modal-open');

      audioRefs.current.forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, [selectedPost, sharePost, currentPlayingIndex, isManuallyPaused]);

  const truncateCaption = (caption: string, maxLength: number = 20): string => {
    if (!caption) return '';
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + '...';
  };

  // Initialize audio refs array
  useEffect(() => {
    audioRefs.current = audioRefs.current.slice(0, localPosts.length);
  }, [localPosts]);

  // Auto-play audio when post is in viewport
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-post-index') || '-1');

          if (entry.isIntersecting && !isManuallyPaused && !selectedPost && !sharePost) {
            if (currentPlayingIndex !== -1 && currentPlayingIndex !== index && audioRefs.current[currentPlayingIndex]) {
              audioRefs.current[currentPlayingIndex]?.pause();
            }

            setCurrentPlayingIndex(index);
            const audio = audioRefs.current[index];

            if (audio && audio.paused) {
              audio.muted = mutedStates[index] ?? false;
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise.catch(() => { });
              }
            }
          } else if (currentPlayingIndex === index) {
            const audio = audioRefs.current[index];
            if (audio && !audio.paused) {
              audio.pause();
            }
            setCurrentPlayingIndex(-1);
          }
        });
      },
      { threshold: 0.7 }
    );

    const postContainers = containerRef.current?.querySelectorAll('[data-post-index]');
    postContainers?.forEach(container => {
      if (observerRef.current) {
        observerRef.current.observe(container);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [localPosts, currentPlayingIndex, isManuallyPaused, selectedPost, sharePost, mutedStates]);

  const getImageFiles = (post: LocalPost) => {
    return post.files.filter(file => file.type.startsWith('image') && !file.isCustom);
  };

  const getAudioFile = (post: LocalPost) => {
    return post.files.find(file => file.type.startsWith('audio'));
  };

  const handleImageScroll = (postIndex: number, direction: 'next' | 'prev') => {
    const post = localPosts[postIndex];
    const imageFiles = getImageFiles(post);
    const currentIndex = currentImageIndices[postIndex];

    if (direction === 'next' && currentIndex < imageFiles.length - 1) {
      setCurrentImageIndices(prev => ({
        ...prev,
        [postIndex]: currentIndex + 1
      }));
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentImageIndices(prev => ({
        ...prev,
        [postIndex]: currentIndex - 1
      }));
    }
  };

  const handleMuteToggle = useCallback((index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const audio = audioRefs.current[index];
    if (!audio) return;

    const newMutedState = !audio.muted;
    audio.muted = newMutedState;
    setMutedStates(prev => ({
      ...prev,
      [index]: newMutedState
    }));
  }, []);

  const handleCaptionClick = useCallback((index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const handleAudioRef = useCallback((index: number) => (el: HTMLAudioElement | null) => {
    audioRefs.current[index] = el;
  }, []);

  const handleComment = useCallback((index: number) => {
    const post = localPosts[index];
    if (post) {
      setSelectedPost(post);
    }
  }, [localPosts]);

  const handleLike = useCallback((index: number, currentlyLiked: boolean) => {
    const post = localPosts[index];
    if (!post || !currentUserId) {
      console.log('❌ Cannot like: missing post or currentUserId', { post, currentUserId });
      return;
    }

    const newLikeCount = currentlyLiked
      ? Math.max(0, post.likes - 1)
      : post.likes + 1;
    const isLiked = !currentlyLiked;

    // Use contentManager for likes
    contentManager.likeContent(post.postId, 'post', currentUserId, currentlyLiked);

    // Optimistic update
    setLocalPosts(prev => {
      const updatedPosts = prev.map((p, i) =>
        i === index
          ? {
            ...p,
            isLiked: isLiked,
            likes: newLikeCount
          }
          : p
      );
      return updatedPosts;
    });
  }, [localPosts, currentUserId]);

  const handleNewComment = useCallback((postId: string) => {
    setLocalPosts(prev => prev.map(post =>
      post.postId === postId
        ? { ...post, comments: post.comments + 1 }
        : post
    ));

    const currentStats = contentManager.getContentStats(postId);
    if (currentStats) {
      contentManager.initializeContentStats(postId, {
        ...currentStats,
        commentCount: currentStats.commentCount + 1
      });
    }
  }, []);

  const handleDeleteComment = useCallback((postId: string) => {
    setLocalPosts(prev => prev.map(post =>
      post.postId === postId
        ? { ...post, comments: Math.max(0, post.comments - 1) }
        : post
    ));

    const currentStats = contentManager.getContentStats(postId);
    if (currentStats) {
      contentManager.initializeContentStats(postId, {
        ...currentStats,
        commentCount: Math.max(0, currentStats.commentCount - 1)
      });
    }
  }, []);

  const handleShare = useCallback((index: number) => {
    const post = localPosts[index];
    if (post) {
      const mediaUrl = post.files.find(f =>
        f.type.startsWith('image/') || f.type.startsWith('video/')
      )?.url;

      const sharePostData: LocalPost = {
        ...post,
        mediaUrl
      };

      setSharePost(sharePostData);
    }
  }, [localPosts]);

  const handleCloseCommentModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

  const handleCloseShareModal = useCallback(() => {
    setSharePost(null);
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // ✅ UPDATED: Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  if (loading && localPosts.length === 0) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 text-lg">Loading posts...</p>
      </div>
    </div>
  );

  if (!loading && localPosts.length === 0) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">📷</div>
        <p className="text-gray-400 text-lg mb-4">No posts found</p>
        <button
          onClick={handleBack}
          className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={containerRef}
        className="bg-black min-h-screen overflow-y-auto"
      >
        <button
          onClick={handleBack}
          className="fixed top-4 left-4 z-50 w-10 h-10 bg-black/70 rounded-full flex items-center justify-center border border-white/30 hover:bg-black/90 transition-all duration-200"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
          {localPosts.map((post: LocalPost, index: number) => {
            const imageFiles = getImageFiles(post);
            const audioFile = getAudioFile(post);
            const currentImageIndex = currentImageIndices[index] || 0;
            const currentImage = imageFiles[currentImageIndex];

            return (
              <div
                key={post.postId}
                data-post-index={index}
                className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800/50"
              >
                {audioFile && (
                  <audio
                    ref={handleAudioRef(index)}
                    src={audioFile.presignedUrl}
                    loop
                    muted={mutedStates[index] ?? false}
                    preload="metadata"
                  />
                )}

                <div className="p-4 border-b border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white border-opacity-20 cursor-pointer overflow-hidden"
                      onClick={() => navigate(`/profile/${post.userId}`)}
                    >
                      {userDetails?.userProfilePic ? (
                        <img
                          src={userDetails.userProfilePic}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {userDetails?.userName?.charAt(0)?.toUpperCase() ||
                              post.userId?.charAt(0)?.toUpperCase() ||
                              'U'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {userDetails?.userName ||
                          `User ${post.userId?.slice(0, 6)}`}
                      </p>

                      {userDetails?.userTagline && (
                        <p className="text-gray-400 text-xs truncate">
                          {userDetails.userTagline}
                        </p>
                      )}

                      {!userDetails?.userTagline && (
                        <p className="text-gray-400 text-xs truncate">
                          @{userDetails?.userName || post.userId?.slice(0, 12) || 'unknown'}
                        </p>
                      )}
                    </div>

                    {post.timestamp && (
                      <p className="text-gray-500 text-xs whitespace-nowrap">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="relative">
                  {currentImage ? (
                    <img
                      src={currentImage.presignedUrl}
                      alt="Post"
                      className="w-full h-auto max-h-96 object-contain bg-black"
                    />
                  ) : (
                    <div className="w-full h-96 flex items-center justify-center bg-gray-800">
                      <span className="text-gray-500 text-4xl">📷</span>
                    </div>
                  )}

                  {imageFiles.length > 1 && (
                    <>
                      {currentImageIndex > 0 && (
                        <button
                          onClick={() => handleImageScroll(index, 'prev')}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-all duration-200"
                        >
                          ‹
                        </button>
                      )}
                      {currentImageIndex < imageFiles.length - 1 && (
                        <button
                          onClick={() => handleImageScroll(index, 'next')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-all duration-200"
                        >
                          ›
                        </button>
                      )}
                    </>
                  )}

                  {imageFiles.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs">
                      {currentImageIndex + 1} / {imageFiles.length}
                    </div>
                  )}

                  {audioFile && (
                    <button
                      onClick={(e) => handleMuteToggle(index, e)}
                      className="absolute top-2 left-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-all duration-200"
                    >
                      {mutedStates[index] ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12m-4.5-9.5L6 9v6l1.5-1.5M5 15H3a1 1 0 01-1-1v-4a1 1 0 011-1h2l3.5-3.5A1 1 0 0110 3v18a1 1 0 01-1.5.866L5 15z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12m4.5-9.5L18 9v6l-1.5-1.5M19 15h2a1 1 0 001-1v-4a1 1 0 00-1-1h-2l-3.5-3.5A1 1 0 0014 3v18a1 1 0 001.5.866L19 15z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer ${post.isLiked ? 'bg-red-500/20' : 'bg-gray-800'
                          }`}
                        onClick={() => handleLike(index, post.isLiked || false)}
                      >
                        <svg
                          className="w-5 h-5"
                          fill={post.isLiked ? "#ff0000" : "white"}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
                        </svg>
                      </div>
                      <span className="text-white text-sm font-bold">{post.likes}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
                        onClick={() => handleComment(index)}
                      >
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM8 15h2.5l1.5 1.5 1.5-1.5H16v-2.5l1.5-1.5-1.5-1.5V8h-2.5L13 6.5 11.5 8H9v2.5L7.5 12 9 13.5V15z" />
                        </svg>
                      </div>
                      <span className="text-white text-sm font-bold">{post.comments}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
                        onClick={() => handleShare(index)}
                      >
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                        </svg>
                      </div>
                      <span className="text-white text-sm font-bold">Share</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <div
                    className="cursor-pointer select-none"
                    onClick={(e) => handleCaptionClick(index, e)}
                  >
                    <p className={`text-white text-sm font-normal leading-relaxed break-words w-full transition-all duration-300 ${expandedDescriptions.has(index)
                      ? 'whitespace-normal'
                      : 'overflow-hidden whitespace-nowrap text-ellipsis max-w-full'
                      }`}>
                      {expandedDescriptions.has(index) ? post.caption : truncateCaption(post.caption)}
                    </p>

                    {expandedDescriptions.has(index) && post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {post.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="text-blue-400 text-xs font-medium bg-blue-400 bg-opacity-10 px-2 py-0.5 rounded-full border border-blue-400 border-opacity-30">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {post.caption && post.caption.length > 20 && (
                      <div className="text-white text-opacity-80 text-xs font-semibold mt-2 inline-flex items-center gap-1 px-2 py-1 bg-white bg-opacity-10 rounded-full transition-all duration-200">
                        {expandedDescriptions.has(index) ? 'Show less' : 'Read more'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* ✅ UPDATED: Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Load More Posts'}
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedPost && (
        <CommentModal
          postId={selectedPost.postId}
          isOpen={true}
          onClose={handleCloseCommentModal}
          userName={selectedPost.userId || 'unknown'}
          postMessage={selectedPost.caption}
          commentCount={selectedPost.comments}
          currentUserId={currentUserId}
          accessToken={accessToken}
          onNewComment={handleNewComment}
          onDeleteComment={handleDeleteComment}
          contentType="post"
        />
      )}

      {sharePost && (
        <ShareComponent
          postId={sharePost.postId}
          userName={sharePost.userId || 'unknown'}
          message={sharePost.caption}
          timestamp={sharePost.timestamp || Date.now()}
          likeCount={sharePost.likes}
          commentCount={sharePost.comments}
          isOpen={true}
          onClose={handleCloseShareModal}
          contentType="post"
          mediaUrl={sharePost.mediaUrl}
        />
      )}

    </>
  );
};

export default PostsAllPage;