import { useState, useCallback, useEffect } from "react";
import { usePersonalizedData } from "./usePersonalizedData";
import { useMediaManager } from "./Parts/useMediaManager";
import SyncStatusIndicator from "../../utils/SyncStatusIndicator";
import CommentModal from "../../commentModal";
import ShareComponent from "../../ShareComponent";
import PostTile from "../../../components/PostTile";
import ReelTile from "../../../components/ReelTile";
import CrinzTile from "../../../components/CrinzMessageTile";
import { FeedItemSkeleton } from "./Parts/FeedItemSkeleton";
import { useAuth } from "react-oidc-context";
import { contentManager } from "../../../utils/Posts_Reels_Stats_Syncer";
import InFeedAd from "../../../ads/InFeedAd_widthed";
import { APP_CONFIG } from "../../../config/appConfig";

export const PersonalizedFeed = () => {
  const auth = useAuth();
  const userId = auth.user?.profile?.sub;
  const accessToken = auth.user?.access_token;

  const { content, loading, hasMore, loadMore, metrics, updateContentItem } = usePersonalizedData();
  const { stopAllMedia } = useMediaManager();

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

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  // Cleanup media on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, [stopAllMedia]);

  // Handle opening comment modal
  const handleOpenComment = useCallback((item: any) => {
    console.log('🔍 Opening comment for:', {
      id: item.id,
      type: item.type,
      content: item.content
    });

    setCommentModal({
      isOpen: true,
      postId: item.id,
      userName: item.user?.userName || 'Anonymous',
      postMessage: item.content,
      commentCount: item.commentCount || 0,
      contentType: item.type
    });
  }, []);

  const handleCloseComment = useCallback(() => {
    setCommentModal(null);
  }, []);

  const handleOpenShare = useCallback((item: any) => {
    const mediaUrl = Array.isArray(item.files) ? item.files.find((f: any) => f.type?.startsWith('video/') || f.type?.startsWith('image/'))?.url : undefined;
    setShareModal({
      isOpen: true,
      contentId: item.id,
      contentType: item.type,
      userName: item.user?.userName || 'Anonymous',
      message: item.content,
      timestamp: item.timestamp || Date.now(),
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
      comments: (currentItem.comments || 0) + 1 // Handle both field names
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
      comments: Math.max(0, (currentItem.comments || 1) - 1)
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

  // ✅ NEW: Handle like updates from child components
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

  return (
    <div className="min-h-screen bg-gray-950 py-4 md:py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          {metrics && (
            <p className="text-gray-400 text-sm">
              Showing {content.length} items • {metrics.stats.followees_processed} friends • {metrics.stats.global_users_processed} discovered
            </p>
          )}
        </div>

        {/* Feed Content */}
        <div className="space-y-6 md:space-y-8">
          {content.map((item, index) => (
            <div key={item.id} className="scroll-m-20">
              {item.type === 'post' && (
                <PostTile
                  item={item}
                  onComment={() => handleOpenComment(item)}
                  onShare={() => handleOpenShare(item)}
                  onLikeUpdate={handleLikeUpdate}
                />
              )}
              {item.type === 'reel' && (
                <ReelTile
                  item={item}
                  onComment={() => handleOpenComment(item)}
                  onShare={() => handleOpenShare(item)}
                  onLikeUpdate={handleLikeUpdate}
                />
              )}
              {item.type === 'crinz_message' && (
                <CrinzTile
                  item={item}
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

          {/* Loading Skeletons */}
          {loading && content.length === 0 && (
            <>
              <FeedItemSkeleton />
              <FeedItemSkeleton />
              <FeedItemSkeleton />
            </>
          )}

          {/* Load More */}
          {hasMore && content.length > 0 && (
            <div className="flex justify-center mt-8 md:mt-12">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Loading more content...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>📥</span>
                    Load More
                  </div>
                )}
              </button>
            </div>
          )}

          {/* End of Feed */}
          {!hasMore && content.length > 0 && (
            <div className="text-center mt-12 py-8 border-t border-gray-800">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-white mb-2">You're all caught up!</h3>
              <p className="text-gray-400">
                You've reached the end of your personalized feed.
              </p>
            </div>
          )}

          {/* Empty State */}
          {content.length === 0 && !loading && (
            <div className="text-center py-16 md:py-24">
              <div className="text-gray-400 text-6xl md:text-8xl mb-6">📱</div>
              <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                Your feed is empty
              </h3>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                This could be due to Lack of internet or You haven't following anyone or noone following you.
              </p>
              <button
                onClick={loadMore}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Refresh Feed
              </button>
            </div>
          )}
        </div>

        {/* Sync Status Indicator - Only show in development */}
        {process.env.NODE_ENV === 'development' && <SyncStatusIndicator />}

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