import { useState, useCallback, useEffect, useRef } from "react";
import { usePersonalizedData } from "../hooks/usePersonalizedData";
import { useMediaManager } from "../hooks/useMediaManager";
import CommentModal from "../components/feed/CommentModal";
import ShareComponent from "../components/shared/ShareComponent";
import PostTile from "../components/feed/PostTile";
import ReelTile from "../components/feed/ReelTile";
import CrinzTile from "../components/feed/CrinzMessageTile";
import { FeedItemSkeleton } from "../components/feed/personalized/FeedItemSkeleton";
import { useAuth } from "react-oidc-context";
import { contentManager } from "../utils/Posts_Reels_Stats_Syncer";
import InFeedAd from "../components/ads/InFeedAd_widthed";
import { APP_CONFIG } from "../config/appConfig";
import getRoast from "../utils/roastMessages";

// Define proper TypeScript interfaces
interface FeedUser {
  profilePic?: string;
  userName?: string;
  tagline?: string;
}

interface FeedFile {
  type: string;
  url: string;
  id?: string;
  name?: string;
}

interface BaseFeedItem {
  id: string;
  type: 'post' | 'reel' | 'crinz_message';
  content?: string;
  user?: FeedUser;
  timestamp: number;
  likeCount?: number;
  likes?: number;
  commentCount?: number;
  comments?: number;
  shareCount?: number;
  isLiked?: boolean;
  isLikedByUser?: boolean;
  files?: FeedFile[];
  degree?: number;
}

// Specific types for modal handlers
interface CommentModalItem {
  id: string;
  type: 'post' | 'reel' | 'crinz_message';
  content?: string;
  user?: FeedUser;
  commentCount?: number;
  comments?: number;
}

interface ShareModalItem {
  id: string;
  type: 'post' | 'reel' | 'crinz_message';
  content?: string;
  user?: FeedUser;
  timestamp: number;
  likeCount?: number;
  likes?: number;
  commentCount?: number;
  comments?: number;
  files?: FeedFile[];
}

export const PersonalizedFeed = () => {
  const auth = useAuth();
  const userId = auth.user?.profile?.sub;
  const accessToken = auth.user?.access_token;

  const {
    content,
    loading,
    loadingMore,
    hasMore,
    lastKey,
    metrics,
    refresh,
    loadMore,
    updateContentItem
  } = usePersonalizedData();

  const { stopAllMedia } = useMediaManager();
  const observerTarget = useRef<HTMLDivElement>(null);

  // Modal states
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    postId: string;
    userName: string;
    postMessage: string;
    commentCount: number;
    contentType?: 'post' | 'reel' | 'crinz_message';
  } | null>(null);

  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    contentId: string;
    contentType: 'post' | 'reel' | 'crinz_message';
    userName: string;
    message: string;
    timestamp: string | number;
    likeCount: number;
    commentCount: number;
    mediaUrl?: string;
  } | null>(null);


  // Cleanup media on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, [stopAllMedia]);

  const handleLoadMore = useCallback(() => {
    console.log("🔄 Load More triggered:", { hasMore, lastKey, loading, loadingMore });

    if (!hasMore) {
      console.log("⏹️ No more content available");
      return;
    }

    if (!lastKey) {
      console.log("🔑 No lastKey available for pagination");
      return;
    }

    if (loading || loadingMore) {
      console.log("⏳ Already loading, skipping");
      return;
    }

    loadMore();
  }, [hasMore, lastKey, loading, loadingMore, loadMore]);

  // Infinite scroll observer
  useEffect(() => {
    const currentObserverTarget = observerTarget.current; // ✅ Store ref in variable
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          console.log("📱 Infinite scroll triggered");
          handleLoadMore(); // ✅ Using memoized handleLoadMore
        }
      },
      { threshold: 0.5 }
    );

    if (currentObserverTarget) {
      observer.observe(currentObserverTarget);
    }

    return () => {
      if (currentObserverTarget) { // ✅ Using stored variable for cleanup
        observer.unobserve(currentObserverTarget);
      }
    };
  }, [hasMore, loading, loadingMore, handleLoadMore]);


  // Handle opening comment modal with proper typing
  const handleOpenComment = useCallback((item: CommentModalItem) => {
    console.log('🔍 Opening comment for:', {
      id: item.id,
      type: item.type,
      content: item.content
    });

    setCommentModal({
      isOpen: true,
      postId: item.id,
      userName: item.user?.userName || 'Anonymous',
      postMessage: item.content || '',
      commentCount: item.commentCount || item.comments || 0,
      contentType: item.type
    });
  }, []);

  const handleCloseComment = useCallback(() => {
    setCommentModal(null);
  }, []);

  // Handle opening share modal with proper typing
  const handleOpenShare = useCallback((item: ShareModalItem) => {
    const mediaUrl = Array.isArray(item.files)
      ? item.files.find((f: FeedFile) => f.type?.startsWith('video/') || f.type?.startsWith('image/'))?.url
      : undefined;

    setShareModal({
      isOpen: true,
      contentId: item.id,
      contentType: item.type,
      userName: item.user?.userName || 'Anonymous',
      message: item.content || '',
      timestamp: item.timestamp,
      likeCount: item.likeCount ?? item.likes ?? 0,
      commentCount: item.commentCount ?? item.comments ?? 0,
      mediaUrl
    });
  }, []);

  const handleCloseShare = useCallback(() => {
    setShareModal(null);
  }, []);

  const handleNewComment = useCallback((postId: string) => {
    console.log('✅ Parent: New comment added to post:', postId);

    // Update local content state
    updateContentItem(postId, (currentItem) => ({
      ...currentItem,
      commentCount: (currentItem.commentCount || 0) + 1,
    }));

    // Update content manager stats
    const currentStats = contentManager.getContentStats(postId);
    if (currentStats) {
      contentManager.initializeContentStats(postId, {
        ...currentStats,
        commentCount: currentStats.commentCount + 1
      });
    }
  }, [updateContentItem]);

  const handleDeleteComment = useCallback((postId: string) => {
    console.log('✅ Parent: Comment deleted from post:', postId);

    // Update local content state
    updateContentItem(postId, (currentItem) => ({
      ...currentItem,
      commentCount: Math.max(0, (currentItem.commentCount || 1) - 1),
    }));

    // Update content manager stats
    const currentStats = contentManager.getContentStats(postId);
    if (currentStats) {
      contentManager.initializeContentStats(postId, {
        ...currentStats,
        commentCount: Math.max(0, currentStats.commentCount - 1)
      });
    }
  }, [updateContentItem]);

  // ✅ Handle like updates from child components
  const handleLikeUpdate = useCallback((contentId: string, newLikeCount: number, isLiked: boolean) => {
    console.log('✅ Parent: Like updated for:', contentId, 'count:', newLikeCount, 'liked:', isLiked);

    // Update local content state
    updateContentItem(contentId, (currentItem) => ({
      ...currentItem,
      likeCount: newLikeCount,
      likes: newLikeCount, // Handle both field names
      isLikedByUser: isLiked
    }));

    // Update content manager stats
    const currentStats = contentManager.getContentStats(contentId);
    if (currentStats) {
      contentManager.initializeContentStats(contentId, {
        ...currentStats,
        likeCount: newLikeCount,
        isLikedByUser: isLiked
      });
    }
  }, [updateContentItem]);

  // Debug logging
  useEffect(() => {
    console.log("📊 Feed State:", {
      itemsCount: content.length,
      loading,
      loadingMore,
      hasMore,
      lastKey: lastKey ? `${lastKey.substring(0, 30)}...` : 'None',
      metrics: metrics?.stats
    });
  }, [content, loading, loadingMore, hasMore, lastKey, metrics]);

  // Type assertion to handle the FeedItem from usePersonalizedData
  const feedItems = content as BaseFeedItem[];

  return (
    <div className="py-4 md:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with Refresh button */}
        {/**
         *  <div className="mb-6 md:mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Personalized Feed</h1>
            {metrics && (
              <p className="text-gray-400 text-sm mt-1">
                {content.length} items • {metrics.stats?.users_processed || 0} users processed •
                Degree 1: {metrics.stats?.degree_distribution?.degree_1 || 0} •
                Degree 2: {metrics.stats?.degree_distribution?.degree_2 || 0}
              </p>
            )}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Refreshing...
              </>
            ) : (
              <>
                <span>🔄</span>
                Refresh
              </>
            )}
          </button>
        </div>
         */}

        {/* Feed Content */}
        <div className="space-y-6 md:space-y-8">
          {feedItems.map((item, index) => (
            <div key={item.id} className="scroll-m-20">
              {/* Degree indicator badge */}
              {item.degree && (
                <div className="mb-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${item.degree === 1 ? 'bg-blue-900/30 text-blue-300' : 'bg-purple-900/30 text-purple-300'}`}>
                    {item.degree === 1 ? '👥 Direct Connection' : '👥👥 Friend of Friend'}
                  </span>
                </div>
              )}

              {item.type === 'post' && (
                <PostTile
                  item={{
                    ...item,
                    timestamp: item.timestamp.toString(), // Convert number to string
                    content: item.content || '',
                    likeCount: item.likeCount ?? item.likes ?? 0,
                    commentCount: item.commentCount ?? item.comments ?? 0,
                    shareCount: item.shareCount ?? 0,
                    isLiked: item.isLikedByUser ?? item.isLiked ?? false
                  }}
                  onComment={() => handleOpenComment(item)}
                  onShare={() => handleOpenShare(item)}
                  onLikeUpdate={handleLikeUpdate}
                />
              )}
              {item.type === 'reel' && (
                <ReelTile
                  item={{
                    ...item,
                    timestamp: item.timestamp.toString(), // Convert number to string
                    content: item.content || '',
                    likeCount: item.likeCount ?? item.likes ?? 0,
                    commentCount: item.commentCount ?? item.comments ?? 0,
                    shareCount: item.shareCount ?? 0,
                    isLiked: item.isLikedByUser ?? item.isLiked ?? false
                  }}
                  onComment={() => handleOpenComment(item)}
                  onShare={() => handleOpenShare(item)}
                  onLikeUpdate={handleLikeUpdate}
                />
              )}
              {item.type === 'crinz_message' && (
                <CrinzTile
                  item={{
                    ...item,
                    timestamp: item.timestamp.toString(), // Convert number to string
                    content: item.content || '',
                    likeCount: item.likeCount ?? item.likes ?? 0,
                    commentCount: item.commentCount ?? item.comments ?? 0,
                    shareCount: item.shareCount ?? 0,
                    isLiked: item.isLikedByUser ?? item.isLiked ?? false
                  }}
                  onComment={() => handleOpenComment(item)}
                  onShare={() => handleOpenShare(item)}
                  onLikeUpdate={handleLikeUpdate}
                />
              )}

              {/* ✅ AD UNIT - Show after every 3 tiles only if ads enabled */}
              {APP_CONFIG.ads && (index + 1) % 3 === 0 && (
                <div key={`ad-${item.id}`} className="mt-6 mb-6">
                  <InFeedAd />
                </div>
              )}
            </div>
          ))}

          {/* Loading Skeletons for initial load */}
          {loading && content.length === 0 && (
            <>
              <FeedItemSkeleton />
              <FeedItemSkeleton />
              <FeedItemSkeleton />
            </>
          )}

          {/* Loading More indicator */}
          {loadingMore && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-400">{getRoast.loading('feed')}</p>
            </div>
          )}

          {/* Load More button (manual) */}
          {hasMore && content.length > 0 && !loadingMore && (
            <div className="flex justify-center mt-8 md:mt-12">
              <button
                onClick={handleLoadMore}
                disabled={loading || loadingMore}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100"
              >
                <div className="flex items-center gap-2">
                  <span>📥</span>
                  Load More ({content.length} items loaded)
                </div>
              </button>
            </div>
          )}

          {/* Intersection observer target for infinite scroll */}
          <div ref={observerTarget} style={{ height: "1px", margin: "20px 0" }} />

          {/* End of Feed */}
          {!hasMore && content.length > 0 && (
            <div className="text-center mt-12 py-8 border-t border-gray-800">
              <div className="text-4xl mb-4">🛩️</div>
              <h3 className="text-xl font-semibold text-white mb-2">You've reached rock bottom!</h3>
              <p className="text-gray-400">
                No more content. Maybe go touch grass? 🌿
                {metrics?.stats && (
                  <span className="block text-sm mt-2">
                    Processed {metrics.stats.users_processed} users •
                    Found {metrics.stats.total_items} items
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Empty State */}
          {content.length === 0 && !loading && (
            <div className="text-center py-16 md:py-24">
              <div className="text-gray-400 text-6xl md:text-8xl mb-6">💀</div>
              <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                {getRoast.empty('feed')}
              </h3>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                {metrics?.stats?.users_processed === 0
                  ? "Zero friends? Wow. Maybe follow some people and pretend to be social?"
                  : "Even your network has nothing to show. Awkward. 🫠"}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300"
                >
                  Try Again (we believe in you... barely)
                </button>
                <button
                  onClick={() => window.location.href = '/explore'}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300"
                >
                  Find Some Friends
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sync Status Indicator - Only show in development */}
        {process.env.NODE_ENV === 'development' && lastKey && (
          <div className="fixed bottom-4 right-4 bg-gray-900/80 backdrop-blur-sm text-xs text-gray-300 p-2 rounded-lg border border-gray-700">
            <div>Last Key: {lastKey.substring(0, 20)}...</div>
            <div>Has More: {hasMore ? 'Yes' : 'No'}</div>
          </div>
        )}

        {/* Comment Modal */}
        {commentModal && (
          <CommentModal
            postId={commentModal.postId}
            isOpen={commentModal.isOpen}
            onClose={handleCloseComment}
            userName={commentModal.userName}
            postMessage={commentModal.postMessage}
            commentCount={commentModal.commentCount}
            contentType={commentModal.contentType}
            currentUserId={userId}
            accessToken={accessToken}
            onNewComment={handleNewComment}
            onDeleteComment={handleDeleteComment}
          />
        )}

        {/* Share Modal */}
        {shareModal && (
          <ShareComponent
            isOpen={shareModal.isOpen}
            onClose={handleCloseShare}
            postId={shareModal.contentId}
            userName={shareModal.userName}
            message={shareModal.message}
            timestamp={shareModal.timestamp}
            likeCount={shareModal.likeCount}
            commentCount={shareModal.commentCount}
            contentType={shareModal.contentType}
            mediaUrl={shareModal.mediaUrl}
          />
        )}
      </div>
    </div>
  );
};

export default PersonalizedFeed;