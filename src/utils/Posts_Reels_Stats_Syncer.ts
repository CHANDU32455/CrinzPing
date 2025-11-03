// utils/contentManager.ts
import { useState, useEffect, useCallback } from 'react';
import { batchSyncer, type BatchAction, useBatchSync } from '../feed/utils/msgsBatchSyncer';

// Extended types for all content types
export type ContentType = 'crinz_message' | 'post' | 'reel';

export interface ContentAction extends Omit<BatchAction, 'crinzId'> {
  contentId: string;
  contentType: ContentType;
  crinzId?: string; // For backward compatibility
}

export interface LikeAction extends Omit<ContentAction, 'type' | 'payload'> {
  type: 'like' | 'unlike';
}

export interface CommentAction extends Omit<ContentAction, 'type'> {
  type: 'add_comment' | 'remove_comment';
  payload: {
    comment: string;
    commentId?: string;
    parentCommentId?: string;
  };
}

export interface ShareAction extends Omit<ContentAction, 'type' | 'payload'> {
  type: 'share';
  payload: {
    platform?: string;
    message?: string;
    sharedTo?: string[];
  };
}

export interface ViewAction extends Omit<ContentAction, 'type' | 'payload'> {
  type: 'view';
  payload: {
    viewDuration?: number;
    progress?: number;
  };
}

export type EnhancedContentAction = LikeAction | CommentAction | ShareAction | ViewAction;

// Content statistics interface
export interface ContentStats {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  isLikedByUser: boolean;
  isBookmarked?: boolean;
}

// Content item base interface
export interface ContentItem {
  id: string;
  type: ContentType;
  userId: string;
  content: string;
  timestamp: number;
  stats: ContentStats;
  user?: {
    userName: string;
    profilePic: string;
    tagline: string;
  };
  files?: Array<{
    type: string;
    url: string;
    fileName: string;
    s3Key: string;
  }>;
}

class ContentManager {
  private contentStatsCache = new Map<string, ContentStats>();
  private contentCallbacks = new Map<string, Array<(stats: ContentStats) => void>>();

  /**
   * Like or unlike any content type
   */
  likeContent(contentId: string, contentType: ContentType, userId: string, currentlyLiked: boolean): void {
    const action: LikeAction = {
      type: currentlyLiked ? 'unlike' : 'like',
      contentId,
      contentType,
      userId,
      timestamp: new Date().toISOString(),
    };

    // Optimistic update
    this.updateContentStats(contentId, {
      likeCount: currentlyLiked ? -1 : 1,
      isLikedByUser: !currentlyLiked,
    });

    // Convert to legacy format for batchSyncer (backward compatibility)
    const legacyAction: Omit<BatchAction, 'timestamp'> = {
      type: action.type,
      crinzId: contentId, // Using contentId as crinzId for legacy support
      userId: action.userId,
    };

    batchSyncer.addAction(legacyAction);
  }

  /**
   * Add comment to any content type
   */
  addComment(
    contentId: string, 
    contentType: ContentType, 
    userId: string, 
    comment: string, 
    tempCommentId?: string,
    parentCommentId?: string
  ): void {
    const action: CommentAction = {
      type: 'add_comment',
      contentId,
      contentType,
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        comment,
        commentId: tempCommentId,
        parentCommentId,
      },
    };

    // Optimistic update
    this.updateContentStats(contentId, {
      commentCount: 1,
    });

    // Convert to legacy format
    const legacyAction: Omit<BatchAction, 'timestamp'> = {
      type: 'add_comment',
      crinzId: contentId,
      userId: action.userId,
      payload: {
        text: comment,
        commentId: tempCommentId,
      },
    };

    batchSyncer.addAction(legacyAction);
  }

  /**
   * Remove comment from any content type
   */
  removeComment(
    contentId: string, 
    contentType: ContentType, 
    userId: string, 
    commentId: string
  ): void {
    const action: CommentAction = {
      type: 'remove_comment',
      contentId,
      contentType,
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        comment: '',
        commentId,
      },
    };

    // Optimistic update
    this.updateContentStats(contentId, {
      commentCount: -1,
    });

    // Convert to legacy format
    const legacyAction: Omit<BatchAction, 'timestamp'> = {
      type: 'remove_comment',
      crinzId: contentId,
      userId: action.userId,
      payload: {
        commentId,
      },
    };

    batchSyncer.addAction(legacyAction);
  }

  /**
   * Share any content type
   */
  shareContent(
    contentId: string, 
    contentType: ContentType, 
    userId: string, 
    platform?: string, 
    message?: string
  ): void {
    const action: ShareAction = {
      type: 'share',
      contentId,
      contentType,
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        platform,
        message,
      },
    };

    // Optimistic update
    this.updateContentStats(contentId, {
      shareCount: 1,
    });

    // Note: Share might need separate API endpoint
    console.log('Share action:', action);
  }

  /**
   * Track content view (for analytics)
   */
  trackView(
    contentId: string, 
    contentType: ContentType, 
    userId: string, 
    viewDuration?: number, 
    progress?: number
  ): void {
    const action: ViewAction = {
      type: 'view',
      contentId,
      contentType,
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        viewDuration,
        progress,
      },
    };

    // Optimistic update for view count
    this.updateContentStats(contentId, {
      viewCount: 1,
    });

    // Views might go to analytics service
    console.log('View tracked:', action);
  }

  /**
   * Update content stats optimistically
   */
  private updateContentStats(contentId: string, updates: Partial<ContentStats>): void {
    const currentStats = this.contentStatsCache.get(contentId) || {
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
      isLikedByUser: false,
    };

    const newStats: ContentStats = {
      ...currentStats,
      likeCount: Math.max(0, currentStats.likeCount + (updates.likeCount || 0)),
      commentCount: Math.max(0, currentStats.commentCount + (updates.commentCount || 0)),
      shareCount: Math.max(0, currentStats.shareCount + (updates.shareCount || 0)),
      viewCount: Math.max(0, currentStats.viewCount + (updates.viewCount || 0)),
      isLikedByUser: updates.isLikedByUser !== undefined ? updates.isLikedByUser : currentStats.isLikedByUser,
    };

    this.contentStatsCache.set(contentId, newStats);
    this.notifyContentSubscribers(contentId, newStats);
  }

  /**
   * Subscribe to content stats changes
   */
  subscribeToContent(contentId: string, callback: (stats: ContentStats) => void): () => void {
    if (!this.contentCallbacks.has(contentId)) {
      this.contentCallbacks.set(contentId, []);
    }

    const callbacks = this.contentCallbacks.get(contentId)!;
    callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.contentCallbacks.get(contentId);
      if (callbacks) {
        this.contentCallbacks.set(
          contentId, 
          callbacks.filter(cb => cb !== callback)
        );
      }
    };
  }

  /**
   * Notify subscribers of content stats changes
   */
  private notifyContentSubscribers(contentId: string, stats: ContentStats): void {
    const callbacks = this.contentCallbacks.get(contentId);
    if (callbacks) {
      callbacks.forEach(callback => callback(stats));
    }
  }

  /**
   * Get current stats for content
   */
  getContentStats(contentId: string): ContentStats | undefined {
    return this.contentStatsCache.get(contentId);
  }

  /**
   * Initialize content stats from server data
   */
  initializeContentStats(contentId: string, serverStats: Partial<ContentStats>): void {
    const currentStats = this.contentStatsCache.get(contentId) || {
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
      isLikedByUser: false,
    };

    const newStats: ContentStats = {
      ...currentStats,
      ...serverStats,
    };

    this.contentStatsCache.set(contentId, newStats);
    this.notifyContentSubscribers(contentId, newStats);
  }

  /**
   * Get real comment ID after sync (for temp ID mapping)
   */
  getRealCommentId(tempCommentId: string): string | undefined {
    return batchSyncer.getRealCommentId(tempCommentId);
  }

  /**
   * Force sync all pending actions
   */
  forceSync(): void {
    batchSyncer.forceSync();
  }

  /**
   * Clear all pending actions
   */
  clearPending(): void {
    batchSyncer.clearPending();
  }

  /**
   * Get current pending actions count
   */
  getPendingCount(): number {
    return batchSyncer.getPendingCount();
  }
}

// Singleton instance
export const contentManager = new ContentManager();

// React Hook for using the content manager
export const useContentManager = () => {
  const { syncState, forceSync, clearPending, pendingCount } = useBatchSync();

  const likeContent = useCallback((
    contentId: string, 
    contentType: ContentType, 
    userId: string, 
    currentlyLiked: boolean
  ) => {
    contentManager.likeContent(contentId, contentType, userId, currentlyLiked);
  }, []);

  const addComment = useCallback((
    contentId: string, 
    contentType: ContentType, 
    userId: string, 
    comment: string, 
    tempCommentId?: string,
    parentCommentId?: string
  ) => {
    contentManager.addComment(contentId, contentType, userId, comment, tempCommentId, parentCommentId);
  }, []);

  const removeComment = useCallback((
    contentId: string, 
    contentType: ContentType, 
    userId: string, 
    commentId: string
  ) => {
    contentManager.removeComment(contentId, contentType, userId, commentId);
  }, []);

  const shareContent = useCallback((
    contentId: string, 
    contentType: ContentType, 
    userId: string, 
    platform?: string, 
    message?: string
  ) => {
    contentManager.shareContent(contentId, contentType, userId, platform, message);
  }, []);

  const trackView = useCallback((
    contentId: string, 
    contentType: ContentType, 
    userId: string, 
    viewDuration?: number, 
    progress?: number
  ) => {
    contentManager.trackView(contentId, contentType, userId, viewDuration, progress);
  }, []);

  const subscribeToContent = useCallback((contentId: string, callback: (stats: ContentStats) => void) => {
    return contentManager.subscribeToContent(contentId, callback);
  }, []);

  const getContentStats = useCallback((contentId: string) => {
    return contentManager.getContentStats(contentId);
  }, []);

  const initializeContentStats = useCallback((contentId: string, serverStats: Partial<ContentStats>) => {
    contentManager.initializeContentStats(contentId, serverStats);
  }, []);

  return {
    // Actions
    likeContent,
    addComment,
    removeComment,
    shareContent,
    trackView,
    
    // Stats management
    subscribeToContent,
    getContentStats,
    initializeContentStats,
    
    // Sync management
    syncState,
    forceSync,
    clearPending,
    pendingCount,
    getRealCommentId: contentManager.getRealCommentId,
  };
};

// Hook for individual content item
export const useContentItem = (contentId: string, initialStats?: Partial<ContentStats>) => {
  const [stats, setStats] = useState<ContentStats>(() => ({
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewCount: 0,
    isLikedByUser: false,
    ...initialStats,
  }));

  const { 
    likeContent, 
    addComment, 
    removeComment, 
    shareContent,
    subscribeToContent,
    initializeContentStats 
  } = useContentManager();

  // Initialize stats
  useEffect(() => {
    if (initialStats) {
      initializeContentStats(contentId, initialStats);
    }
  }, [contentId, initialStats, initializeContentStats]);

  // Subscribe to stats changes
  useEffect(() => {
    const unsubscribe = subscribeToContent(contentId, (newStats) => {
      setStats(newStats);
    });
    return unsubscribe;
  }, [contentId, subscribeToContent]);

  const handleLike = useCallback((
    contentType: ContentType, 
    userId: string, 
    currentlyLiked: boolean
  ) => {
    likeContent(contentId, contentType, userId, currentlyLiked);
  }, [contentId, likeContent]);

  const handleAddComment = useCallback((
    contentType: ContentType, 
    userId: string, 
    comment: string, 
    tempCommentId?: string,
    parentCommentId?: string
  ) => {
    addComment(contentId, contentType, userId, comment, tempCommentId, parentCommentId);
  }, [contentId, addComment]);

  const handleRemoveComment = useCallback((
    contentType: ContentType, 
    userId: string, 
    commentId: string
  ) => {
    removeComment(contentId, contentType, userId, commentId);
  }, [contentId, removeComment]);

  const handleShare = useCallback((
    contentType: ContentType, 
    userId: string, 
    platform?: string, 
    message?: string
  ) => {
    shareContent(contentId, contentType, userId, platform, message);
  }, [contentId, shareContent]);

  return {
    stats,
    handleLike,
    handleAddComment,
    handleRemoveComment,
    handleShare,
  };
};