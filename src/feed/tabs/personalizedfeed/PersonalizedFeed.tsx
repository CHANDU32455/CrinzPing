import { useState, useCallback, useEffect } from "react";
import { usePersonalizedData } from "./usePersonalizedData";
import { useMediaManager } from "./Parts/useMediaManager";
import SyncStatusIndicator from "../../utils/SyncStatusIndicator";
import CentralizedCommentModal from "../../../components/CentralizedCommentModal";
import CentralizedShareModal from "../../../components/CentralizedShareModal";
import PostTile from "../../../components/PostTile";
import ReelTile from "../../../components/ReelTile";
import CrinzTile from "../../../components/CrinzMessageTile";
import { FeedItemSkeleton } from "./Parts/FeedItemSkeleton";

export const PersonalizedFeed = () => {
  const { content, loading, hasMore, loadMore, metrics } = usePersonalizedData();
  const { stopAllMedia } = useMediaManager();

  // Modal states
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    contentId: string;
    contentType: 'post' | 'reel' | 'crinz_message';
    content: {
      userName: string;
      message: string;
      timestamp: string;
    };
  } | null>(null);

  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    contentId: string;
    contentType: 'post' | 'reel' | 'crinz_message';
    content: {
      userName: string;
      message: string;
    };
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

  // Modal handlers
  const handleOpenComment = useCallback((item: any) => {
    setCommentModal({
      isOpen: true,
      contentId: item.id,
      contentType: item.type,
      content: {
        userName: item.user?.userName || 'Anonymous',
        message: item.content,
        timestamp: item.timestamp,
      },
    });
  }, []);

  const handleCloseComment = useCallback(() => {
    setCommentModal(null);
  }, []);

  const handleOpenShare = useCallback((item: any) => {
    setShareModal({
      isOpen: true,
      contentId: item.id,
      contentType: item.type,
      content: {
        userName: item.user?.userName || 'Anonymous',
        message: item.content,
      },
    });
  }, []);

  const handleCloseShare = useCallback(() => {
    setShareModal(null);
  }, []);

  // Comment callbacks
  const handleNewComment = useCallback(() => {
    console.log('New comment added');
  }, []);

  const handleDeleteComment = useCallback(() => {
    console.log('Comment deleted');
  }, []);

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
          {content.map((item) => (
            <div key={item.id} className="scroll-m-20">
              {item.type === 'post' && (
                <PostTile 
                  item={item} 
                  onComment={() => handleOpenComment(item)}
                  onShare={() => handleOpenShare(item)}
                />
              )}
              {item.type === 'reel' && (
                <ReelTile 
                  item={item} 
                  onComment={() => handleOpenComment(item)}
                  onShare={() => handleOpenShare(item)}
                />
              )}
              {item.type === 'crinz_message' && (
                <CrinzTile 
                  item={item} 
                  onComment={() => handleOpenComment(item)}
                  onShare={() => handleOpenShare(item)}
                />
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

        {/* Sync Status Indicator */}
        <SyncStatusIndicator />

        {/* Centralized Modals */}
        {commentModal && (
          <CentralizedCommentModal
            isOpen={commentModal.isOpen}
            onClose={handleCloseComment}
            contentId={commentModal.contentId}
            contentType={commentModal.contentType}
            content={commentModal.content}
            onNewComment={handleNewComment}
            onDeleteComment={handleDeleteComment}
          />
        )}

        {shareModal && (
          <CentralizedShareModal
            isOpen={shareModal.isOpen}
            onClose={handleCloseShare}
            contentId={shareModal.contentId}
            contentType={shareModal.contentType}
            content={shareModal.content}
          />
        )}
      </div>
    </div>
  );
};

export default PersonalizedFeed;